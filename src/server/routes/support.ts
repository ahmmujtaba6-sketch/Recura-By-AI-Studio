import { Router } from 'express';
import { z } from 'zod';
import db from '../db/index.ts';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.ts';

export const supportRouter = Router();

const ticketSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  category: z.enum(['billing', 'appointments', 'exercises', 'therapist_verification', 'other']),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000),
});

// 1. POST /api/support/tickets
// Create a new support ticket (public or authenticated)
supportRouter.post('/tickets', (req: AuthenticatedRequest, res) => {
  try {
    const parseResult = ticketSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid support ticket data',
      });
    }

    const { name, email, category, message } = parseResult.data;
    const userId = req.user ? req.user.id : null;

    const result = db.prepare(`
      INSERT INTO support_tickets (user_id, name, email, category, message, status)
      VALUES (?, ?, ?, ?, ?, 'open')
    `).run(userId, name, email, category, message);

    // Notify all admin users
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as { id: number }[];
    for (const admin of admins) {
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, body)
        VALUES (?, 'new_support_ticket', 'New Support Ticket Filed', ?)
      `).run(
        admin.id,
        `Ticket #${result.lastInsertRowid} from ${name} (${category}): "${message.slice(0, 75)}..."`
      );
    }

    const created = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Support ticket submitted successfully. Our clinical team will respond shortly.',
      ticket: created,
    });
  } catch (err: any) {
    console.error('Error submitting support ticket:', err);
    res.status(500).json({ error: 'Failed to submit support ticket' });
  }
});

// 2. GET /api/support/tickets/my
// Get logged-in user tickets
supportRouter.get('/tickets/my', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const tickets = db.prepare(`
      SELECT *
      FROM support_tickets
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    res.json({ tickets });
  } catch (err: any) {
    console.error('Error fetching user tickets:', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// 3. GET /api/support/faqs
// Frequently Asked Questions
supportRouter.get('/faqs', (req, res) => {
  res.json({
    faqs: [
      {
        id: 'faq-1',
        category: 'Consultations & Booking',
        question: 'How do I book a physiotherapy consultation on RECURA?',
        answer: 'You can explore certified physiotherapists across 8 major Pakistani cities (Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, Quetta, Faisalabad, Multan). Filter by body area complaint, city, and your PKR budget. Once you select a therapist, pick an available 30-minute slot (in-clinic, home visit, or video call). Your request is confirmed once approved by the practitioner.',
      },
      {
        id: 'faq-2',
        category: 'Payments & Pricing',
        question: 'What payment methods are supported in Pakistan?',
        answer: 'RECURA supports simulated local payment gateways for Pakistan including JazzCash, Easypaisa, Debit/Credit Card, and Cash at Clinic for in-person appointments. No real credit card details are ever stored.',
      },
      {
        id: 'faq-3',
        category: 'Plans & Video Calls',
        question: 'What is included in the Basic vs Premium subscription plans?',
        answer: 'The Free tier allows in-clinic bookings and logging daily pain for the past 7 days. The Basic tier (PKR 1,499/mo) unlocks full 90-day history, video tutorials, in-app therapist chat, home visits, and 2 monthly video consultations. The Premium tier (PKR 2,999/mo) unlocks 4 monthly video calls, direct physiotherapist progress commentary, and certified clinical report exports with CSV download.',
      },
      {
        id: 'faq-4',
        category: 'PMR Verification',
        question: 'How are physiotherapists verified on the platform?',
        answer: 'Every practitioner must hold a valid PMR (Physical Medicine & Rehabilitation) or Pakistan Physical Therapy Council registration number. Profiles are reviewed and vetted by the RECURA Clinical Board before receiving the Approved badge.',
      },
      {
        id: 'faq-5',
        category: 'Emergency & Safety',
        question: 'Does RECURA provide emergency medical assistance?',
        answer: 'No. RECURA by Physio Hub does not diagnose emergency conditions or replace urgent trauma care. If you experience severe trauma, sudden paralysis, chest pain, or unmanageable acute pain, immediately call 1122 or visit the nearest emergency hospital.',
      },
    ],
  });
});
