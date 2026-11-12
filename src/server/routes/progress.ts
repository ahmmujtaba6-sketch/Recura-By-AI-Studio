import { Router } from 'express';
import { z } from 'zod';
import db from '../db/index.ts';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth.ts';

export const progressRouter = Router();

// Body areas for the 6-area x 14-day heat map
const HEATMAP_AREAS = [
  'Lower Back',
  'Neck & Shoulders',
  'Knee',
  'Shoulder',
  'Pelvis',
  'Ankle & Foot',
];

// Helper to compute consecutive day exercise streak
function getStreak(patientId: number): number {
  const dates = db.prepare(`
    SELECT DISTINCT date
    FROM exercise_logs
    WHERE patient_id = ? AND done = 1
    ORDER BY date DESC
  `).all(patientId) as { date: string }[];

  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  const latestDateStr = dates[0].date;
  const latestDate = new Date(latestDateStr + 'T00:00:00');
  const diffDays = Math.round((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 1) return 0;

  const dateSet = new Set(dates.map((d) => d.date));
  if (diffDays === 1) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (dateSet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// 1. GET /api/progress/summary
// Returns recovery summary, pain drop %, goals, and 6-area x 14-day heat map
progressRouter.get('/summary', requireAuth, requireRole('patient', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const patientId = req.user!.id;

    // Total exercises completed
    const totalExercises = db.prepare(`
      SELECT COUNT(*) as count
      FROM exercise_logs
      WHERE patient_id = ? AND done = 1
    `).get(patientId) as { count: number };

    // Current streak
    const streak = getStreak(patientId);

    // Pain drop % calculation:
    // Compare average pain score of first 3 days (12-14 days ago) vs last 3 days (most recent 3 days)
    const allPainEntries = db.prepare(`
      SELECT date, score, area
      FROM pain_entries
      WHERE patient_id = ?
      ORDER BY date ASC
    `).all(patientId) as { date: string; score: number; area: string }[];

    let initialAvg = 0;
    let currentAvg = 0;
    let painDropPercentage = 0;

    if (allPainEntries.length >= 2) {
      const first3 = allPainEntries.slice(0, Math.min(3, Math.floor(allPainEntries.length / 2)));
      const last3 = allPainEntries.slice(-Math.min(3, Math.floor(allPainEntries.length / 2)));

      initialAvg = first3.reduce((acc, curr) => acc + curr.score, 0) / first3.length;
      currentAvg = last3.reduce((acc, curr) => acc + curr.score, 0) / last3.length;

      if (initialAvg > 0) {
        painDropPercentage = Math.round(((initialAvg - currentAvg) / initialAvg) * 100);
      }
    }

    // 14-Day Pain Heat Map (6 body areas x 14 dates)
    const today = new Date();
    const dates: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    // Map each area to daily pain scores
    const heatmap = HEATMAP_AREAS.map((area) => {
      const entries = db.prepare(`
        SELECT date, score, note
        FROM pain_entries
        WHERE patient_id = ? AND (LOWER(area) LIKE LOWER(?) OR (area = 'Ankle/Foot' AND LOWER(?) LIKE '%ankle%'))
      `).all(patientId, `%${area.split(' ')[0]}%`, area) as { date: string; score: number; note: string }[];

      const scoresByDate: { [date: string]: { score: number; note: string } | null } = {};
      for (const d of dates) {
        const found = entries.find((e) => e.date === d);
        scoresByDate[d] = found ? { score: found.score, note: found.note || '' } : null;
      }

      return {
        area,
        scoresByDate,
      };
    });

    // Goals for this patient
    const goals = db.prepare(`
      SELECT *
      FROM goals
      WHERE patient_id = ?
      ORDER BY created_at DESC
    `).all(patientId);

    res.json({
      metrics: {
        streak,
        totalExercisesLogged: totalExercises.count,
        initialAvgPain: parseFloat(initialAvg.toFixed(1)),
        currentAvgPain: parseFloat(currentAvg.toFixed(1)),
        painDropPercentage,
      },
      dates,
      heatmap,
      goals,
    });
  } catch (err: any) {
    console.error('Error fetching progress summary:', err);
    res.status(500).json({ error: 'Failed to load progress summary' });
  }
});

// 2. Goals CRUD
const goalSchema = z.object({
  title: z.string().trim().min(3, 'Goal title must be at least 3 characters').max(200),
  target_date: z.string().optional().or(z.literal('')),
});

progressRouter.post('/goals', requireAuth, requireRole('patient'), (req: AuthenticatedRequest, res) => {
  try {
    const patientId = req.user!.id;
    const parseResult = goalSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid goal input',
      });
    }

    const { title, target_date } = parseResult.data;

    const result = db.prepare(`
      INSERT INTO goals (patient_id, title, target_date, status)
      VALUES (?, ?, ?, 'in_progress')
    `).run(patientId, title, target_date || '');

    const created = db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Recovery goal created!',
      goal: created,
    });
  } catch (err: any) {
    console.error('Error creating goal:', err);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

progressRouter.patch('/goals/:id', requireAuth, requireRole('patient'), (req: AuthenticatedRequest, res) => {
  try {
    const patientId = req.user!.id;
    const goalId = Number(req.params.id);

    if (isNaN(goalId)) {
      return res.status(400).json({ error: 'Invalid goal ID' });
    }

    const { status, title, target_date } = req.body;

    const existing = db.prepare('SELECT * FROM goals WHERE id = ? AND patient_id = ?').get(goalId, patientId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const updatedStatus = status || existing.status;
    const updatedTitle = title !== undefined ? title : existing.title;
    const updatedDate = target_date !== undefined ? target_date : existing.target_date;

    db.prepare(`
      UPDATE goals
      SET status = ?, title = ?, target_date = ?
      WHERE id = ?
    `).run(updatedStatus, updatedTitle, updatedDate, goalId);

    const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(goalId);

    res.json({
      message: 'Goal updated successfully',
      goal: updated,
    });
  } catch (err: any) {
    console.error('Error updating goal:', err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

progressRouter.delete('/goals/:id', requireAuth, requireRole('patient'), (req: AuthenticatedRequest, res) => {
  try {
    const patientId = req.user!.id;
    const goalId = Number(req.params.id);

    if (isNaN(goalId)) {
      return res.status(400).json({ error: 'Invalid goal ID' });
    }

    const existing = db.prepare('SELECT id FROM goals WHERE id = ? AND patient_id = ?').get(goalId, patientId);
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    db.prepare('DELETE FROM goals WHERE id = ?').run(goalId);

    res.json({ message: 'Goal removed.' });
  } catch (err: any) {
    console.error('Error deleting goal:', err);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// 3. GET /api/progress/report
// Full clinical recovery progress report for Premium patients
progressRouter.get('/report', requireAuth, requireRole('patient', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const patientId = req.user!.id;

    // Check plan gating: only Premium tier gets printable report export
    const plan = db.prepare('SELECT plan FROM plans WHERE patient_id = ?').get(patientId) as any;
    if (!plan || plan.plan !== 'premium') {
      return res.status(403).json({
        error: 'Clinical Progress Report export is a verified Premium feature. Please upgrade to Premium to download or print your clinical report.',
        upgradeRequired: true,
        currentPlan: plan?.plan || 'free',
      });
    }

    const profile = db.prepare(`
      SELECT p.*, u.email
      FROM patient_profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
    `).get(patientId) as any;

    // 14-day pain entries with therapist comments
    const painEntries = db.prepare(`
      SELECT pe.date, pe.score, pe.area, pe.note, pe.time_of_day,
             c.text as therapist_comment, t.name as therapist_name
      FROM pain_entries pe
      LEFT JOIN comments c ON pe.id = c.pain_entry_id
      LEFT JOIN therapists t ON c.therapist_id = t.id
      WHERE pe.patient_id = ?
      ORDER BY pe.date ASC
      LIMIT 14
    `).all(patientId);

    // Exercise completion stats
    const totalLogs = db.prepare(`
      SELECT COUNT(*) as count FROM exercise_logs WHERE patient_id = ? AND done = 1
    `).get(patientId) as { count: number };

    // Active goals
    const goals = db.prepare('SELECT * FROM goals WHERE patient_id = ?').all(patientId);

    // Linked therapist info
    const linkedTherapist = db.prepare(`
      SELECT DISTINCT t.name, t.speciality, t.registration_no, t.city
      FROM therapists t
      JOIN appointments a ON t.id = a.therapist_id
      WHERE a.patient_id = ?
      LIMIT 1
    `).get(patientId) as any;

    res.json({
      report: {
        generatedAt: new Date().toISOString(),
        patient: profile,
        therapist: linkedTherapist || {
          name: 'RECURA Clinical Board',
          speciality: 'Musculoskeletal Rehabilitation',
          registration_no: 'PK-PMR-BOARD',
          city: profile?.city || 'Pakistan',
        },
        painEntries,
        totalCompletedExercises: totalLogs.count,
        goals,
        disclaimer: 'Recura by Physio Hub does not diagnose or replace emergency medical care. This recovery record reflects patient-logged VAS pain levels and prescribed physiotherapy compliance.',
      },
    });
  } catch (err: any) {
    console.error('Error generating progress report:', err);
    res.status(500).json({ error: 'Failed to generate progress report' });
  }
});

// 4. GET /api/progress/report/csv
// Export 14-day pain and exercise data as CSV download (Premium plan)
progressRouter.get('/report/csv', requireAuth, requireRole('patient', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const patientId = req.user!.id;

    // Check plan gating
    const plan = db.prepare('SELECT plan FROM plans WHERE patient_id = ?').get(patientId) as any;
    if (!plan || plan.plan !== 'premium') {
      return res.status(403).json({
        error: 'CSV Export is restricted to Premium plan subscribers.',
        upgradeRequired: true,
      });
    }

    const painEntries = db.prepare(`
      SELECT pe.date, pe.score, pe.area, pe.note, pe.time_of_day,
             COALESCE(c.text, '') as therapist_comment
      FROM pain_entries pe
      LEFT JOIN comments c ON pe.id = c.pain_entry_id
      WHERE pe.patient_id = ?
      ORDER BY pe.date ASC
      LIMIT 14
    `).all(patientId) as any[];

    let csvContent = 'Date,VAS_Pain_Score_0_10,Body_Area,Time_Of_Day,Patient_Notes,Therapist_Comment\n';

    for (const row of painEntries) {
      const cleanNote = (row.note || '').replace(/"/g, '""');
      const cleanComment = (row.therapist_comment || '').replace(/"/g, '""');
      csvContent += `${row.date},${row.score},"${row.area}","${row.time_of_day}","${cleanNote}","${cleanComment}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="recura-14day-recovery-data.csv"');
    res.send(csvContent);
  } catch (err: any) {
    console.error('Error exporting CSV:', err);
    res.status(500).json({ error: 'Failed to export CSV report' });
  }
});
