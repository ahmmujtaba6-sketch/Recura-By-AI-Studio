import { Router } from 'express';
import { z } from 'zod';
import db from '../db/index.ts';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth.ts';

export const painRouter = Router();

const painEntrySchema = z.object({
  score: z.number().int().min(0).max(10, 'Score must be between 0 and 10'),
  area: z.string().trim().min(1, 'Please select a body area'),
  note: z.string().trim().max(140, 'Note cannot exceed 140 characters').optional().or(z.literal('')),
  time_of_day: z.enum(['Morning', 'Afternoon', 'Evening', 'Night']).default('Morning'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
});

// 1. GET /api/pain
// Returns pain history, 14-day trend data, this week vs last week averages, and plan gating
painRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const isPatient = req.user!.role === 'patient';
    const targetPatientId = isPatient ? userId : Number(req.query.patientId) || userId;

    // Check patient's plan
    const planRec = db.prepare('SELECT plan FROM plans WHERE patient_id = ?').get(targetPatientId) as any;
    const plan = planRec?.plan || 'free';

    // Gate history: Free plan gets only the last 7 days; Basic and Premium get full history
    const isGated = plan === 'free';
    const daysLimit = isGated ? 7 : 90;

    const entries = db.prepare(`
      SELECT p.*,
             c.text as therapist_comment,
             t.name as commenting_therapist_name
      FROM pain_entries p
      LEFT JOIN comments c ON p.id = c.pain_entry_id
      LEFT JOIN therapists t ON c.therapist_id = t.id
      WHERE p.patient_id = ?
        AND p.date >= date('now', '-' || ? || ' days')
      ORDER BY p.date DESC
    `).all(targetPatientId, daysLimit) as any[];

    // Count if there are older records hidden on free plan
    let hiddenRecordsCount = 0;
    if (isGated) {
      const older = db.prepare(`
        SELECT COUNT(*) as count
        FROM pain_entries
        WHERE patient_id = ? AND date < date('now', '-7 days')
      `).get(targetPatientId) as { count: number };
      hiddenRecordsCount = older.count;
    }

    // Compute averages for this week (last 7 days) and last week (days 8-14)
    const thisWeekScores = db.prepare(`
      SELECT score FROM pain_entries
      WHERE patient_id = ? AND date >= date('now', '-7 days')
    `).all(targetPatientId) as { score: number }[];

    const lastWeekScores = db.prepare(`
      SELECT score FROM pain_entries
      WHERE patient_id = ?
        AND date >= date('now', '-14 days')
        AND date < date('now', '-7 days')
    `).all(targetPatientId) as { score: number }[];

    const avgThisWeek = thisWeekScores.length > 0
      ? Math.round((thisWeekScores.reduce((sum, s) => sum + s.score, 0) / thisWeekScores.length) * 10) / 10
      : null;

    const avgLastWeek = lastWeekScores.length > 0
      ? Math.round((lastWeekScores.reduce((sum, s) => sum + s.score, 0) / lastWeekScores.length) * 10) / 10
      : null;

    // Last 14 entries chronologically for the trendline chart
    const trendlineEntries = db.prepare(`
      SELECT date, score, area, time_of_day
      FROM pain_entries
      WHERE patient_id = ?
      ORDER BY date DESC
      LIMIT 14
    `).all(targetPatientId) as any[];

    // Reverse to chronological order (oldest to newest)
    const trendline = [...trendlineEntries].reverse();

    // Today's entry if logged
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntry = entries.find((e) => e.date === todayStr) || null;

    res.json({
      entries,
      todayEntry,
      trendline,
      avgThisWeek,
      avgLastWeek,
      plan,
      isGated,
      hiddenRecordsCount,
    });
  } catch (err: any) {
    console.error('Error fetching pain entries:', err);
    res.status(500).json({ error: 'Failed to load pain history' });
  }
});

// 2. POST /api/pain
// Log or update daily pain score (one entry per day) and handle 8+ alert
painRouter.post('/', requireAuth, requireRole('patient'), (req: AuthenticatedRequest, res) => {
  try {
    const patientId = req.user!.id;
    const parseResult = painEntrySchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid pain entry data',
        details: parseResult.error.issues,
      });
    }

    const { score, area, note = '', time_of_day = 'Morning', date } = parseResult.data;
    const entryDate = date || new Date().toISOString().split('T')[0];

    // Enforce one entry per day via SQLite UPSERT
    const upsertRes = db.prepare(`
      INSERT INTO pain_entries (patient_id, date, score, area, note, time_of_day)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(patient_id, date) DO UPDATE SET
        score = excluded.score,
        area = excluded.area,
        note = excluded.note,
        time_of_day = excluded.time_of_day,
        created_at = datetime('now')
    `).run(patientId, entryDate, score, area, note, time_of_day);

    const savedEntry = db.prepare(`
      SELECT * FROM pain_entries
      WHERE patient_id = ? AND date = ?
    `).get(patientId, entryDate);

    // HIGH PAIN THRESHOLD (Score >= 8)
    let alertTriggered = false;
    let linkedTherapistCount = 0;

    if (score >= 8) {
      alertTriggered = true;

      // Patient alert notification
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, body)
        VALUES (?, 'high_pain_alert', 'High Pain Score Alert', ?)
      `).run(
        patientId,
        `You logged a high pain score of ${score}/10 for ${area}. If this pain is sharp or radiating, please contact your physical therapist or seek medical care.`
      );

      // Find all linked therapist user accounts:
      // Therapists with whom patient has appointments or who have assigned exercises
      const linkedTherapists = db.prepare(`
        SELECT DISTINCT u.id as user_id, t.name as therapist_name
        FROM appointments a
        JOIN therapists t ON a.therapist_id = t.id
        JOIN users u ON t.user_id = u.id
        WHERE a.patient_id = ?
        UNION
        SELECT DISTINCT u.id as user_id, t.name as therapist_name
        FROM assignments asg
        JOIN therapists t ON asg.assigned_by = t.id
        JOIN users u ON t.user_id = u.id
        WHERE asg.patient_id = ?
      `).all(patientId, patientId) as { user_id: number; therapist_name: string }[];

      linkedTherapistCount = linkedTherapists.length;
      const patientProfile = db.prepare('SELECT name FROM patient_profiles WHERE user_id = ?').get(patientId) as any;
      const ptName = patientProfile?.name || 'A patient';

      for (const th of linkedTherapists) {
        db.prepare(`
          INSERT INTO notifications (user_id, type, title, body)
          VALUES (?, 'high_pain_patient_alert', 'Patient High Pain Alert', ?)
        `).run(
          th.user_id,
          `Urgent Clinical Notice: Your patient ${ptName} logged a high pain score of ${score}/10 (${area}). Review their clinical trendline.`
        );
      }
    }

    res.json({
      message: 'Pain entry successfully logged for today!',
      entry: savedEntry,
      alertTriggered,
      linkedTherapistCount,
    });
  } catch (err: any) {
    console.error('Error saving pain entry:', err);
    res.status(500).json({ error: 'Failed to record pain entry' });
  }
});
