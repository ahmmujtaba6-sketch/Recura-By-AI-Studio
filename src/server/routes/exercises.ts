import { Router } from 'express';
import { z } from 'zod';
import db from '../db/index.ts';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth.ts';

export const exercisesRouter = Router();

// Helper to compute consecutive day exercise streak
function calculateStreak(patientId: number): number {
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

  // Check if today or yesterday has a completed exercise
  const latestDateStr = dates[0].date;
  const latestDate = new Date(latestDateStr + 'T00:00:00');

  const diffDays = Math.round((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 1) {
    // Missed yesterday and today, streak broken
    return 0;
  }

  const dateSet = new Set(dates.map((d) => d.date));

  // If latest is yesterday, start streak check from yesterday
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

// Helper to compute past 7-day completion status row
function getPast7DaysStatus(patientId: number) {
  const result: { date: string; dayLabel: string; done: boolean; count: number }[] = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = dayNames[d.getDay()];

    const countRes = db.prepare(`
      SELECT COUNT(*) as count
      FROM exercise_logs
      WHERE patient_id = ? AND date = ? AND done = 1
    `).get(patientId, dateStr) as { count: number };

    result.push({
      date: dateStr,
      dayLabel,
      done: countRes.count > 0,
      count: countRes.count,
    });
  }

  return result;
}

// 1. GET /api/exercises/assigned
// Returns patient assigned exercises, plan tutorial gating, streak, and 7-day row
exercisesRouter.get('/assigned', requireAuth, requireRole('patient'), (req: AuthenticatedRequest, res) => {
  try {
    const patientId = req.user!.id;
    const todayStr = new Date().toISOString().split('T')[0];

    // Check plan for tutorial locking
    const planRec = db.prepare('SELECT plan FROM plans WHERE patient_id = ?').get(patientId) as any;
    const plan = planRec?.plan || 'free';
    const canAccessTutorials = plan === 'basic' || plan === 'premium';

    // Fetch active assignments
    const assignments = db.prepare(`
      SELECT a.id as assignment_id, a.sets, a.reps, a.note as assignment_note, a.active,
             t.id as tutorial_id, t.title, t.category, t.minutes, t.safety_note,
             t.steps, t.video_url,
             th.id as therapist_id, th.name as therapist_name, th.speciality as therapist_speciality
      FROM assignments a
      JOIN tutorials t ON a.tutorial_id = t.id
      JOIN therapists th ON a.assigned_by = th.id
      WHERE a.patient_id = ? AND a.active = 1
      ORDER BY a.created_at DESC
    `).all(patientId) as any[];

    // Check today's logs for each assignment
    const getTodayLog = db.prepare(`
      SELECT id, done, pain_after
      FROM exercise_logs
      WHERE patient_id = ? AND assignment_id = ? AND date = ?
    `);

    const formattedAssignments = assignments.map((asg) => {
      const todayLog = getTodayLog.get(patientId, asg.assignment_id, todayStr) as any;
      const isDoneToday = Boolean(todayLog && todayLog.done === 1);
      const painAfter = todayLog ? todayLog.pain_after : null;

      let stepsParsed = [];
      try {
        stepsParsed = JSON.parse(asg.steps || '[]');
      } catch (e) {
        stepsParsed = [];
      }

      return {
        assignment_id: asg.assignment_id,
        tutorial_id: asg.tutorial_id,
        title: asg.title,
        category: asg.category,
        minutes: asg.minutes,
        sets: asg.sets,
        reps: asg.reps,
        assignment_note: asg.assignment_note,
        therapist_name: asg.therapist_name,
        safety_note: asg.safety_note,
        // Plan gating: Free users cannot see video tutorials
        isTutorialLocked: !canAccessTutorials,
        video_url: canAccessTutorials ? asg.video_url : null,
        steps: canAccessTutorials ? stepsParsed : [],
        isDoneToday,
        painAfter,
      };
    });

    const streak = calculateStreak(patientId);
    const weeklyRow = getPast7DaysStatus(patientId);

    res.json({
      assignments: formattedAssignments,
      streak,
      weeklyRow,
      plan,
      canAccessTutorials,
    });
  } catch (err: any) {
    console.error('Error fetching assigned exercises:', err);
    res.status(500).json({ error: 'Failed to load assigned exercises' });
  }
});

// Zod schema for logging exercise completion
const logExerciseSchema = z.object({
  assignment_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  done: z.boolean(),
  pain_after: z.number().int().min(0).max(10).optional().default(0),
});

// 2. POST /api/exercises/log
// Log or toggle exercise done status for a specific day
exercisesRouter.post('/log', requireAuth, requireRole('patient'), (req: AuthenticatedRequest, res) => {
  try {
    const patientId = req.user!.id;
    const parseResult = logExerciseSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid log data',
      });
    }

    const { assignment_id, date, done, pain_after } = parseResult.data;
    const entryDate = date || new Date().toISOString().split('T')[0];

    // Check if log already exists for this assignment and date
    const existing = db.prepare(`
      SELECT id FROM exercise_logs
      WHERE patient_id = ? AND assignment_id = ? AND date = ?
    `).get(patientId, assignment_id, entryDate) as { id: number } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE exercise_logs
        SET done = ?, pain_after = ?
        WHERE id = ?
      `).run(done ? 1 : 0, pain_after, existing.id);
    } else {
      db.prepare(`
        INSERT INTO exercise_logs (patient_id, assignment_id, date, done, pain_after)
        VALUES (?, ?, ?, ?, ?)
      `).run(patientId, assignment_id, entryDate, done ? 1 : 0, pain_after);
    }

    const newStreak = calculateStreak(patientId);
    const weeklyRow = getPast7DaysStatus(patientId);

    res.json({
      message: done ? 'Exercise marked complete for today!' : 'Exercise marked incomplete.',
      assignment_id,
      date: entryDate,
      done,
      pain_after,
      streak: newStreak,
      weeklyRow,
    });
  } catch (err: any) {
    console.error('Error logging exercise:', err);
    res.status(500).json({ error: 'Failed to save exercise log' });
  }
});

// 3. GET /api/exercises/tutorials/:id
// Returns full tutorial video and steps, gated by plan
exercisesRouter.get('/tutorials/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const tutorialId = Number(req.params.id);
    const userId = req.user!.id;

    if (isNaN(tutorialId)) {
      return res.status(400).json({ error: 'Invalid tutorial ID' });
    }

    // Check plan for patient
    if (req.user!.role === 'patient') {
      const planRec = db.prepare('SELECT plan FROM plans WHERE patient_id = ?').get(userId) as any;
      const plan = planRec?.plan || 'free';

      if (plan === 'free') {
        return res.status(403).json({
          error: 'Video tutorials with step-by-step form instructions require a Basic or Premium plan. Please upgrade your care subscription to unlock guided video exercises.',
          locked: true,
          code: 'UPGRADE_REQUIRED',
        });
      }
    }

    const tutorial = db.prepare(`
      SELECT t.*, th.name as therapist_name, th.speciality as therapist_speciality
      FROM tutorials t
      JOIN therapists th ON t.therapist_id = th.id
      WHERE t.id = ?
    `).get(tutorialId) as any;

    if (!tutorial) {
      return res.status(404).json({ error: 'Tutorial not found' });
    }

    res.json({
      tutorial: {
        ...tutorial,
        steps: JSON.parse(tutorial.steps || '[]'),
      },
    });
  } catch (err: any) {
    console.error('Error fetching tutorial:', err);
    res.status(500).json({ error: 'Failed to load tutorial' });
  }
});
