import { Router } from 'express';
import { z } from 'zod';
import db from '../db/index.ts';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.ts';

export const chatRouter = Router();

// 1. GET /api/chat/contacts
// Returns list of linked chat contacts for current user (therapists for patient, patients for therapist)
chatRouter.get('/contacts', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const contacts: any[] = [];

    if (user.role === 'patient') {
      // Find therapists linked via appointments or assignments
      const rows = db.prepare(`
        SELECT DISTINCT t.id as therapist_id, t.user_id, t.name, t.speciality, t.city, u.email
        FROM therapists t
        JOIN users u ON t.user_id = u.id
        WHERE t.id IN (
          SELECT therapist_id FROM appointments WHERE patient_id = ?
          UNION
          SELECT assigned_by FROM assignments WHERE patient_id = ?
        )
      `).all(user.id, user.id) as any[];

      for (const r of rows) {
        // Count unread messages from this therapist
        const unread = db.prepare(`
          SELECT COUNT(*) as count
          FROM messages
          WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL
        `).get(r.user_id, user.id) as { count: number };

        // Last message
        const lastMsg = db.prepare(`
          SELECT text, created_at
          FROM messages
          WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
          ORDER BY created_at DESC
          LIMIT 1
        `).get(user.id, r.user_id, r.user_id, user.id) as any;

        contacts.push({
          userId: r.user_id,
          therapistId: r.therapist_id,
          name: r.name,
          subtitle: r.speciality,
          city: r.city,
          unreadCount: unread.count,
          lastMessage: lastMsg ? lastMsg.text : null,
          lastTime: lastMsg ? lastMsg.created_at : null,
        });
      }
    } else if (user.role === 'therapist') {
      const therapist = db.prepare('SELECT id FROM therapists WHERE user_id = ?').get(user.id) as any;
      if (!therapist) return res.json({ contacts: [] });

      const rows = db.prepare(`
        SELECT DISTINCT p.user_id, p.name, p.primary_complaint_area, p.city, u.email
        FROM patient_profiles p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id IN (
          SELECT patient_id FROM appointments WHERE therapist_id = ?
          UNION
          SELECT patient_id FROM assignments WHERE assigned_by = ?
        )
      `).all(therapist.id, therapist.id) as any[];

      for (const r of rows) {
        const unread = db.prepare(`
          SELECT COUNT(*) as count
          FROM messages
          WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL
        `).get(r.user_id, user.id) as { count: number };

        const lastMsg = db.prepare(`
          SELECT text, created_at
          FROM messages
          WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
          ORDER BY created_at DESC
          LIMIT 1
        `).get(user.id, r.user_id, r.user_id, user.id) as any;

        contacts.push({
          userId: r.user_id,
          name: r.name,
          subtitle: r.primary_complaint_area || 'Musculoskeletal Patient',
          city: r.city,
          unreadCount: unread.count,
          lastMessage: lastMsg ? lastMsg.text : null,
          lastTime: lastMsg ? lastMsg.created_at : null,
        });
      }
    }

    res.json({ contacts });
  } catch (err: any) {
    console.error('Error fetching chat contacts:', err);
    res.status(500).json({ error: 'Failed to load chat contacts' });
  }
});

// 2. GET /api/chat/messages/:otherUserId
// Fetch message history between current user and contact, marking unread messages as read
chatRouter.get('/messages/:otherUserId', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const otherUserId = Number(req.params.otherUserId);

    if (isNaN(otherUserId)) {
      return res.status(400).json({ error: 'Invalid contact user ID' });
    }

    // Mark messages as read
    db.prepare(`
      UPDATE messages
      SET read_at = datetime('now')
      WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL
    `).run(otherUserId, userId);

    const messages = db.prepare(`
      SELECT m.*, u.email as sender_email
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `).all(userId, otherUserId, otherUserId, userId);

    res.json({ messages });
  } catch (err: any) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to load message history' });
  }
});

// 3. POST /api/chat/messages/:otherUserId
// Send message with optional pain score attachment and plan enforcement
const sendMessageSchema = z.object({
  text: z.string().trim().min(1, 'Message text cannot be empty').max(2000),
  attachPainScore: z.boolean().optional(),
});

chatRouter.post('/messages/:otherUserId', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const otherUserId = Number(req.params.otherUserId);

    if (isNaN(otherUserId)) {
      return res.status(400).json({ error: 'Invalid contact user ID' });
    }

    // Server-side Plan Limit Enforcement for patients
    if (user.role === 'patient') {
      const plan = db.prepare('SELECT plan FROM plans WHERE patient_id = ?').get(user.id) as any;
      if (!plan || plan.plan === 'free') {
        return res.status(403).json({
          error: 'Direct messaging with physiotherapists is locked on the Free plan. Please upgrade to Basic or Premium to chat with your therapist.',
          upgradeRequired: true,
          feature: 'Chat with Therapist',
        });
      }
    }

    const parseResult = sendMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid message',
      });
    }

    let messageText = parseResult.data.text;

    // Attach latest pain score if requested by patient
    if (user.role === 'patient' && parseResult.data.attachPainScore) {
      const latestPain = db.prepare(`
        SELECT score, area, date
        FROM pain_entries
        WHERE patient_id = ?
        ORDER BY date DESC
        LIMIT 1
      `).get(user.id) as any;

      if (latestPain) {
        messageText += `\n\n📌 [Clinical Status: VAS Pain ${latestPain.score}/10 (${latestPain.area}) logged on ${latestPain.date}]`;
      }
    }

    const result = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, text, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(user.id, otherUserId, messageText);

    // Send notification to recipient
    const senderName = user.role === 'patient'
      ? (user.patient_profile?.name || 'Your Patient')
      : (user.therapist_profile?.name || 'Your Physiotherapist');

    db.prepare(`
      INSERT INTO notifications (user_id, type, title, body)
      VALUES (?, 'new_message', 'New Message Received', ?)
    `).run(
      otherUserId,
      `${senderName}: "${messageText.slice(0, 80)}${messageText.length > 80 ? '...' : ''}"`
    );

    const created = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Message sent successfully!',
      data: created,
    });
  } catch (err: any) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});
