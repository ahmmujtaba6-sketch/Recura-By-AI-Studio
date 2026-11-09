import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import db from '../db/index.ts';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth.ts';

export const therapistWorkspaceRouter = Router();

// Helper to get current therapist record
function getTherapistRecord(userId: number) {
  return db.prepare('SELECT * FROM therapists WHERE user_id = ?').get(userId) as any;
}

export function formatTherapistName(name: string): string {
  if (!name) return 'Therapist';
  return name.startsWith('Dr.') ? name : `Dr. ${name}`;
}

// 1. GET /api/therapist-workspace/dashboard
// Overview statistics, today's schedule, pending booking requests, and attention alerts
therapistWorkspaceRouter.get('/dashboard', requireAuth, requireRole('therapist', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const therapist = getTherapistRecord(req.user!.id);
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Today's appointments
    const todayAppointments = db.prepare(`
      SELECT a.*, p.name as patient_name, p.phone as patient_phone, p.primary_complaint_area
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      JOIN patient_profiles p ON u.id = p.user_id
      WHERE a.therapist_id = ? AND a.date = ?
      ORDER BY a.time ASC
    `).all(therapist.id, todayStr);

    // Pending requests
    const pendingAppointments = db.prepare(`
      SELECT a.*, p.name as patient_name, p.phone as patient_phone, p.primary_complaint_area
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      JOIN patient_profiles p ON u.id = p.user_id
      WHERE a.therapist_id = ? AND a.status = 'requested'
      ORDER BY a.date ASC, a.time ASC
    `).all(therapist.id);

    // Total distinct linked patients (via appointments, assignments, or redeemed invites)
    const linkedPatientIds = db.prepare(`
      SELECT DISTINCT patient_id FROM (
        SELECT patient_id FROM appointments WHERE therapist_id = ?
        UNION
        SELECT patient_id FROM assignments WHERE assigned_by = ?
      )
    `).all(therapist.id, therapist.id) as { patient_id: number }[];

    const totalPatientsCount = linkedPatientIds.length;

    // "Patients needing attention" card:
    // Flags linked patients with pain score >= 8 in the last 3 days
    // OR who haven't logged exercises in 3 days
    const needingAttention: any[] = [];

    for (const { patient_id } of linkedPatientIds) {
      const patientProfile = db.prepare(`
        SELECT p.name, p.phone, p.city, p.primary_complaint_area, u.email
        FROM patient_profiles p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
      `).get(patient_id) as any;

      if (!patientProfile) continue;

      // Check max pain score in last 3 days
      const highPainEntry = db.prepare(`
        SELECT score, date, area, note
        FROM pain_entries
        WHERE patient_id = ? AND date >= date('now', '-3 days') AND score >= 8
        ORDER BY score DESC, date DESC
        LIMIT 1
      `).get(patient_id) as any;

      if (highPainEntry) {
        needingAttention.push({
          patientId: patient_id,
          name: patientProfile.name,
          phone: patientProfile.phone,
          complaint: patientProfile.primary_complaint_area || 'Musculoskeletal',
          flagType: 'high_pain',
          severity: 'critical',
          reason: `High Pain Spike: ${highPainEntry.score}/10 logged on ${highPainEntry.date} (${highPainEntry.area})`,
          score: highPainEntry.score,
          note: highPainEntry.note,
          date: highPainEntry.date,
        });
        continue; // flagged
      }

      // Check last exercise log date
      const lastExerciseLog = db.prepare(`
        SELECT MAX(date) as last_date
        FROM exercise_logs
        WHERE patient_id = ?
      `).get(patient_id) as { last_date: string | null };

      // Check if patient has active assignments
      const activeAssignmentsCount = db.prepare(`
        SELECT COUNT(*) as count FROM assignments WHERE patient_id = ? AND assigned_by = ? AND active = 1
      `).get(patient_id, therapist.id) as { count: number };

      if (activeAssignmentsCount.count > 0) {
        if (!lastExerciseLog.last_date) {
          needingAttention.push({
            patientId: patient_id,
            name: patientProfile.name,
            phone: patientProfile.phone,
            complaint: patientProfile.primary_complaint_area || 'Musculoskeletal',
            flagType: 'inactive_exercises',
            severity: 'warning',
            reason: 'Has not yet logged any assigned exercises',
            score: null,
            note: 'Pending first log',
            date: 'Never',
          });
        } else {
          const lastDate = new Date(lastExerciseLog.last_date);
          const diffDays = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 3) {
            needingAttention.push({
              patientId: patient_id,
              name: patientProfile.name,
              phone: patientProfile.phone,
              complaint: patientProfile.primary_complaint_area || 'Musculoskeletal',
              flagType: 'inactive_exercises',
              severity: 'warning',
              reason: `Rehab Inactivity: No exercise logged for ${diffDays} days (last logged ${lastExerciseLog.last_date})`,
              score: null,
              note: `${diffDays} days inactive`,
              date: lastExerciseLog.last_date,
            });
          }
        }
      }
    }

    res.json({
      therapist,
      today: todayStr,
      metrics: {
        todayAppointmentsCount: todayAppointments.length,
        pendingRequestsCount: pendingAppointments.length,
        totalPatientsCount,
        needingAttentionCount: needingAttention.length,
      },
      todayAppointments,
      pendingAppointments,
      needingAttention,
    });
  } catch (err: any) {
    console.error('Error fetching therapist dashboard:', err);
    res.status(500).json({ error: 'Failed to load therapist dashboard data' });
  }
});

// 2. GET /api/therapist-workspace/patients
// List of all linked patients with latest pain score, 7-day sparkline, and exercise completion %
therapistWorkspaceRouter.get('/patients', requireAuth, requireRole('therapist', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const therapist = getTherapistRecord(req.user!.id);
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    const linkedRows = db.prepare(`
      SELECT DISTINCT patient_id FROM (
        SELECT patient_id FROM appointments WHERE therapist_id = ?
        UNION
        SELECT patient_id FROM assignments WHERE assigned_by = ?
      )
    `).all(therapist.id, therapist.id) as { patient_id: number }[];

    const patients = linkedRows.map(({ patient_id }) => {
      const profile = db.prepare(`
        SELECT p.*, u.email, pl.plan
        FROM patient_profiles p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN plans pl ON p.user_id = pl.patient_id
        WHERE p.user_id = ?
      `).get(patient_id) as any;

      if (!profile) return null;

      // Latest pain entry
      const latestPain = db.prepare(`
        SELECT score, date, area, note
        FROM pain_entries
        WHERE patient_id = ?
        ORDER BY date DESC
        LIMIT 1
      `).get(patient_id) as any;

      // 7-day pain sparkline (last 7 days of entries)
      const sparklineEntries = db.prepare(`
        SELECT date, score
        FROM pain_entries
        WHERE patient_id = ? AND date >= date('now', '-7 days')
        ORDER BY date ASC
      `).all(patient_id) as { date: string; score: number }[];

      // Active assignments
      const activeAssignments = db.prepare(`
        SELECT COUNT(*) as count FROM assignments WHERE patient_id = ? AND assigned_by = ? AND active = 1
      `).get(patient_id, therapist.id) as { count: number };

      // Exercise completion % in the past 7 days
      // Total logs in past 7 days / (activeAssignments * 7)
      const logsCountPast7 = db.prepare(`
        SELECT COUNT(*) as count
        FROM exercise_logs
        WHERE patient_id = ? AND date >= date('now', '-7 days') AND done = 1
      `).get(patient_id) as { count: number };

      const expectedLogs = Math.max(1, activeAssignments.count * 7);
      const completionPercentage = Math.min(100, Math.round((logsCountPast7.count / expectedLogs) * 100));

      return {
        id: patient_id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        dob: profile.dob,
        gender: profile.gender,
        city: profile.city,
        height: profile.height,
        weight: profile.weight,
        allergies: profile.allergies,
        medical_history: profile.medical_history,
        primary_complaint_area: profile.primary_complaint_area,
        primary_complaint_duration: profile.primary_complaint_duration,
        completion_percentage: profile.completion_percentage,
        plan: profile.plan || 'free',
        latestPain: latestPain || null,
        sparkline: sparklineEntries,
        activeAssignmentsCount: activeAssignments.count,
        exerciseCompletionRate: completionPercentage,
      };
    }).filter(Boolean);

    res.json({ patients });
  } catch (err: any) {
    console.error('Error fetching linked patients:', err);
    res.status(500).json({ error: 'Failed to load patients list' });
  }
});

// 3. GET /api/therapist-workspace/patients/:id
// Full clinical profile with 14-day history, biometrics, assigned protocols, and appointment history
therapistWorkspaceRouter.get('/patients/:id', requireAuth, requireRole('therapist', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const therapist = getTherapistRecord(req.user!.id);
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    const patientId = Number(req.params.id);
    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }

    const profile = db.prepare(`
      SELECT p.*, u.email, pl.plan
      FROM patient_profiles p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN plans pl ON p.user_id = pl.patient_id
      WHERE p.user_id = ?
    `).get(patientId) as any;

    if (!profile) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // 14-day full pain history
    const painHistory = db.prepare(`
      SELECT pe.*, c.text as therapist_comment, c.created_at as comment_date
      FROM pain_entries pe
      LEFT JOIN comments c ON pe.id = c.pain_entry_id AND c.therapist_id = ?
      WHERE pe.patient_id = ?
      ORDER BY pe.date DESC
      LIMIT 14
    `).all(therapist.id, patientId);

    // Active & inactive assignments with tutorial details
    const assignments = db.prepare(`
      SELECT a.*, t.title as tutorial_title, t.category as tutorial_category,
             t.minutes, t.steps, t.safety_note, t.video_url
      FROM assignments a
      JOIN tutorials t ON a.tutorial_id = t.id
      WHERE a.patient_id = ? AND a.assigned_by = ?
      ORDER BY a.active DESC, a.created_at DESC
    `).all(patientId, therapist.id).map((asgn: any) => ({
      ...asgn,
      steps: typeof asgn.steps === 'string' ? JSON.parse(asgn.steps || '[]') : asgn.steps,
    }));

    // Recent exercise logs
    const recentExerciseLogs = db.prepare(`
      SELECT el.*, t.title as exercise_title
      FROM exercise_logs el
      JOIN assignments a ON el.assignment_id = a.id
      JOIN tutorials t ON a.tutorial_id = t.id
      WHERE el.patient_id = ?
      ORDER BY el.date DESC
      LIMIT 20
    `).all(patientId);

    // Appointment history
    const appointments = db.prepare(`
      SELECT *
      FROM appointments
      WHERE patient_id = ? AND therapist_id = ?
      ORDER BY date DESC, time DESC
    `).all(patientId, therapist.id);

    // Calculate BMI if height and weight exist
    let bmi: number | null = null;
    if (profile.height > 0 && profile.weight > 0) {
      const heightInMeters = profile.height / 100;
      bmi = parseFloat((profile.weight / (heightInMeters * heightInMeters)).toFixed(1));
    }

    res.json({
      patient: {
        ...profile,
        bmi,
      },
      painHistory,
      assignments,
      recentExerciseLogs,
      appointments,
    });
  } catch (err: any) {
    console.error('Error fetching patient clinical file:', err);
    res.status(500).json({ error: 'Failed to load clinical file' });
  }
});

// 4. GET /api/therapist-workspace/availability
therapistWorkspaceRouter.get('/availability', requireAuth, requireRole('therapist', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const therapist = getTherapistRecord(req.user!.id);
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    const slots = db.prepare(`
      SELECT id, weekday, start_time, end_time
      FROM availability
      WHERE therapist_id = ?
      ORDER BY weekday ASC, start_time ASC
    `).all(therapist.id);

    res.json({ availability: slots });
  } catch (err: any) {
    console.error('Error fetching availability:', err);
    res.status(500).json({ error: 'Failed to load availability' });
  }
});

// 5. PUT /api/therapist-workspace/availability
const availabilitySchema = z.object({
  slots: z.array(
    z.object({
      weekday: z.number().int().min(0).max(6),
      start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid start time (HH:MM)'),
      end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid end time (HH:MM)'),
    }).refine((slot) => slot.start_time < slot.end_time, {
      message: 'Start time must be before end time',
    })
  ),
});

therapistWorkspaceRouter.put('/availability', requireAuth, requireRole('therapist', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const therapist = getTherapistRecord(req.user!.id);
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    const parseResult = availabilitySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid availability data',
      });
    }

    const { slots } = parseResult.data;

    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM availability WHERE therapist_id = ?').run(therapist.id);
      const insert = db.prepare(`
        INSERT INTO availability (therapist_id, weekday, start_time, end_time)
        VALUES (?, ?, ?, ?)
      `);
      for (const slot of slots) {
        insert.run(therapist.id, slot.weekday, slot.start_time, slot.end_time);
      }
    });

    transaction();

    const updated = db.prepare(`
      SELECT id, weekday, start_time, end_time
      FROM availability
      WHERE therapist_id = ?
      ORDER BY weekday ASC, start_time ASC
    `).all(therapist.id);

    res.json({
      message: 'Weekly availability updated successfully!',
      availability: updated,
    });
  } catch (err: any) {
    console.error('Error updating availability:', err);
    res.status(500).json({ error: 'Failed to update availability schedule' });
  }
});

// 6. GET /api/therapist-workspace/appointments
therapistWorkspaceRouter.get('/appointments', requireAuth, requireRole('therapist', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const therapist = getTherapistRecord(req.user!.id);
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    const appointments = db.prepare(`
      SELECT a.*, p.name as patient_name, p.phone as patient_phone, p.primary_complaint_area, u.email as patient_email
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      JOIN patient_profiles p ON u.id = p.user_id
      WHERE a.therapist_id = ?
      ORDER BY a.date ASC, a.time ASC
    `).all(therapist.id);

    res.json({ appointments });
  } catch (err: any) {
    console.error('Error fetching therapist appointments:', err);
    res.status(500).json({ error: 'Failed to load appointments' });
  }
});

// 7. PATCH /api/therapist-workspace/appointments/:id/action
const appointmentActionSchema = z.object({
  action: z.enum(['accept', 'decline', 'reschedule']),
  reason: z.string().trim().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
});

therapistWorkspaceRouter.patch('/appointments/:id/action', requireAuth, requireRole('therapist', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const therapist = getTherapistRecord(req.user!.id);
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    const appointmentId = Number(req.params.id);
    if (isNaN(appointmentId)) {
      return res.status(400).json({ error: 'Invalid appointment ID' });
    }

    const parseResult = appointmentActionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid action data',
      });
    }

    const { action, reason, date, time } = parseResult.data;

    const apt = db.prepare(`
      SELECT * FROM appointments WHERE id = ? AND therapist_id = ?
    `).get(appointmentId, therapist.id) as any;

    if (!apt) {
      return res.status(404).json({ error: 'Appointment not found or not assigned to you' });
    }

    if (action === 'accept') {
      db.prepare(`
        UPDATE appointments
        SET status = 'upcoming', updated_at = datetime('now')
        WHERE id = ?
      `).run(appointmentId);

      // Notify patient
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, body)
        VALUES (?, 'appointment_accepted', 'Appointment Confirmed!', ?)
      `).run(
        apt.patient_id,
        `${formatTherapistName(therapist.name)} accepted your consultation on ${apt.date} at ${apt.time} (${apt.type}).`
      );

      return res.json({ message: 'Appointment confirmed and moved to Upcoming.', status: 'upcoming' });
    }

    if (action === 'decline') {
      const declineReason = reason || 'Therapist unavailable at requested time';
      db.prepare(`
        UPDATE appointments
        SET status = 'declined', notes = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(`Declined: ${declineReason}`, appointmentId);

      // Notify patient
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, body)
        VALUES (?, 'appointment_declined', 'Appointment Request Declined', ?)
      `).run(
        apt.patient_id,
        `${formatTherapistName(therapist.name)} declined your consultation request for ${apt.date}. Reason: ${declineReason}`
      );

      return res.json({ message: 'Appointment declined.', status: 'declined' });
    }

    if (action === 'reschedule') {
      if (!date || !time) {
        return res.status(400).json({ error: 'New date and time are required for rescheduling.' });
      }

      // Check double-booking
      const conflict = db.prepare(`
        SELECT id FROM appointments
        WHERE therapist_id = ? AND date = ? AND time = ? AND status IN ('requested', 'upcoming') AND id != ?
      `).get(therapist.id, date, time, appointmentId);

      if (conflict) {
        return res.status(400).json({ error: 'You already have another active appointment scheduled at this date and time.' });
      }

      const rescheduleNote = reason ? `Rescheduled by Therapist: ${reason}` : 'Rescheduled by Therapist';
      db.prepare(`
        UPDATE appointments
        SET date = ?, time = ?, status = 'upcoming', notes = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(date, time, rescheduleNote, appointmentId);

      // Notify patient
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, body)
        VALUES (?, 'appointment_rescheduled', 'Appointment Rescheduled', ?)
      `).run(
        apt.patient_id,
        `${formatTherapistName(therapist.name)} rescheduled your appointment to ${date} at ${time}. Note: ${reason || 'Updated time slot'}`
      );

      return res.json({ message: 'Appointment rescheduled and confirmed for new time.', status: 'upcoming', date, time });
    }

    res.status(400).json({ error: 'Unknown action' });
  } catch (err: any) {
    console.error('Error updating appointment action:', err);
    res.status(500).json({ error: 'Failed to process appointment action' });
  }
});

// 8. GET /api/therapist-workspace/tutorials
// List tutorials (both created by this therapist and system library)
therapistWorkspaceRouter.get('/tutorials', requireAuth, requireRole('therapist', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const therapist = getTherapistRecord(req.user!.id);
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    const tutorials = db.prepare(`
      SELECT t.*, th.name as therapist_name
      FROM tutorials t
      JOIN therapists th ON t.therapist_id = th.id
      ORDER BY t.created_at DESC
    `).all().map((tut: any) => ({
      ...tut,
      steps: typeof tut.steps === 'string' ? JSON.parse(tut.steps || '[]') : tut.steps,
      is_mine: tut.therapist_id === therapist.id,
    }));

    res.json({ tutorials });
  } catch (err: any) {
    console.error('Error fetching tutorials:', err);
    res.status(500).json({ error: 'Failed to load tutorial library' });
  }
});

// 9. POST /api/therapist-workspace/tutorials
const tutorialSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  category: z.string().trim().min(2, 'Please select or enter a category'),
  minutes: z.number().int().min(1).max(60).default(10),
  steps: z.array(z.string().trim().min(5, 'Each step must contain clinical instructions')).min(3, 'Please provide at least 3 clinical steps').max(6, 'Maximum 6 steps allowed'),
  safety_note: z.string().trim().min(5, 'Safety note is required').default('Stop immediately if pain increases sharply.'),
  video_url: z.string().trim().url('Please enter a valid video URL (e.g. YouTube or Vimeo)').optional().or(z.literal('')),
});

therapistWorkspaceRouter.post('/tutorials', requireAuth, requireRole('therapist', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const therapist = getTherapistRecord(req.user!.id);
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    const parseResult = tutorialSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid tutorial data',
        details: parseResult.error.issues,
      });
    }

    const data = parseResult.data;

    const result = db.prepare(`
      INSERT INTO tutorials (therapist_id, title, category, minutes, steps, safety_note, video_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      therapist.id,
      data.title,
      data.category,
      data.minutes,
      JSON.stringify(data.steps),
      data.safety_note,
      data.video_url || 'https://www.youtube.com/watch?v=sI9f9jT5gRs'
    );

    const created = db.prepare('SELECT * FROM tutorials WHERE id = ?').get(result.lastInsertRowid) as any;

    res.status(201).json({
      message: 'Tutorial created successfully in your library!',
      tutorial: {
        ...created,
        steps: JSON.parse(created.steps),
        is_mine: true,
      },
    });
  } catch (err: any) {
    console.error('Error creating tutorial:', err);
    res.status(500).json({ error: 'Failed to create tutorial' });
  }
});

// 10. PUT /api/therapist-workspace/tutorials/:id
therapistWorkspaceRouter.put('/tutorials/:id', requireAuth, requireRole('therapist', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const therapist = getTherapistRecord(req.user!.id);
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    const tutorialId = Number(req.params.id);
    if (isNaN(tutorialId)) {
      return res.status(400).json({ error: 'Invalid tutorial ID' });
    }

    const existing = db.prepare('SELECT * FROM tutorials WHERE id = ?').get(tutorialId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Tutorial not found' });
    }

    // Only creator or admin can edit
    if (existing.therapist_id !== therapist.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'You can only edit tutorials you created' });
    }

    const parseResult = tutorialSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid tutorial data',
        details: parseResult.error.issues,
      });
    }

    const data = parseResult.data;

    db.prepare(`
      UPDATE tutorials
      SET title = ?, category = ?, minutes = ?, steps = ?, safety_note = ?, video_url = ?
      WHERE id = ?
    `).run(
      data.title,
      data.category,
      data.minutes,
      JSON.stringify(data.steps),
      data.safety_note,
      data.video_url || '',
      tutorialId
    );

    const updated = db.prepare('SELECT * FROM tutorials WHERE id = ?').get(tutorialId) as any;

    res.json({
      message: 'Tutorial updated successfully!',
      tutorial: {
        ...updated,
        steps: JSON.parse(updated.steps),
        is_mine: true,
      },
    });
  } catch (err: any) {
    console.error('Error updating tutorial:', err);
    res.status(500).json({ error: 'Failed to update tutorial' });
  }
});

// 11. DELETE /api/therapist-workspace/tutorials/:id
therapistWorkspaceRouter.delete('/tutorials/:id', requireAuth, requireRole('therapist', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const therapist = getTherapistRecord(req.user!.id);
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    const tutorialId = Number(req.params.id);
    if (isNaN(tutorialId)) {
      return res.status(400).json({ error: 'Invalid tutorial ID' });
    }

    const existing = db.prepare('SELECT * FROM tutorials WHERE id = ?').get(tutorialId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Tutorial not found' });
    }

    if (existing.therapist_id !== therapist.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete tutorials you created' });
    }

    // Deactivate assignments using this tutorial first
    db.prepare('UPDATE assignments SET active = 0 WHERE tutorial_id = ?').run(tutorialId);
    db.prepare('DELETE FROM tutorials WHERE id = ?').run(tutorialId);

    res.json({ message: 'Tutorial removed from library.' });
  } catch (err: any) {
    console.error('Error deleting tutorial:', err);
    res.status(500).json({ error: 'Failed to delete tutorial' });
  }
});

// 12. POST /api/therapist-workspace/assignments
// Assign an exercise tutorial to a patient
const assignSchema = z.object({
  patient_id: z.number().int().positive(),
  tutorial_id: z.number().int().positive(),
  sets: z.number().int().min(1).max(20).default(3),
  reps: z.number().int().min(1).max(100).default(10),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});

therapistWorkspaceRouter.post('/assignments', requireAuth, requireRole('therapist', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const therapist = getTherapistRecord(req.user!.id);
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    const parseResult = assignSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid assignment data',
      });
    }

    const data = parseResult.data;

    // Check tutorial exists
    const tutorial = db.prepare('SELECT * FROM tutorials WHERE id = ?').get(data.tutorial_id) as any;
    if (!tutorial) {
      return res.status(404).json({ error: 'Selected tutorial does not exist' });
    }

    // Check patient exists
    const patientUser = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'patient'").get(data.patient_id);
    if (!patientUser) {
      return res.status(404).json({ error: 'Selected patient does not exist' });
    }

    const result = db.prepare(`
      INSERT INTO assignments (patient_id, tutorial_id, sets, reps, note, assigned_by, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(
      data.patient_id,
      data.tutorial_id,
      data.sets,
      data.reps,
      data.note || '',
      therapist.id
    );

    // Send notification to patient
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, body)
      VALUES (?, 'exercise_assigned', 'New Exercise Assigned!', ?)
    `).run(
      data.patient_id,
      `${formatTherapistName(therapist.name)} assigned: "${tutorial.title}" (${data.sets} sets × ${data.reps} reps). ${data.note ? 'Clinical note: ' + data.note : ''}`
    );

    const created = db.prepare(`
      SELECT a.*, t.title as tutorial_title, t.category as tutorial_category, t.minutes
      FROM assignments a
      JOIN tutorials t ON a.tutorial_id = t.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Exercise protocol assigned successfully to patient!',
      assignment: created,
    });
  } catch (err: any) {
    console.error('Error assigning exercise:', err);
    res.status(500).json({ error: 'Failed to assign exercise' });
  }
});

// 13. DELETE /api/therapist-workspace/assignments/:id (Toggle or Deactivate)
therapistWorkspaceRouter.delete('/assignments/:id', requireAuth, requireRole('therapist', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const therapist = getTherapistRecord(req.user!.id);
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    const assignmentId = Number(req.params.id);
    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    const asgn = db.prepare(`
      SELECT * FROM assignments WHERE id = ? AND assigned_by = ?
    `).get(assignmentId, therapist.id) as any;

    if (!asgn) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    db.prepare('UPDATE assignments SET active = 0 WHERE id = ?').run(assignmentId);

    res.json({ message: 'Exercise protocol archived.' });
  } catch (err: any) {
    console.error('Error archiving assignment:', err);
    res.status(500).json({ error: 'Failed to archive assignment' });
  }
});

// 14. GET /api/therapist-workspace/invites
therapistWorkspaceRouter.get('/invites', requireAuth, requireRole('therapist', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const therapist = getTherapistRecord(req.user!.id);
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    const invites = db.prepare(`
      SELECT * FROM invites
      WHERE therapist_id = ?
      ORDER BY created_at DESC
    `).all(therapist.id);

    res.json({ invites });
  } catch (err: any) {
    console.error('Error fetching invites:', err);
    res.status(500).json({ error: 'Failed to load invites' });
  }
});

// 15. POST /api/therapist-workspace/invites
const inviteSchema = z.object({
  patient_name: z.string().trim().optional(),
  patient_phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/[\s-]/g, ''))
    .refine((val) => !val || /^(\+92|0)?3[0-9]{9}$/.test(val), {
      message: 'Please enter a valid Pakistan mobile number (e.g. +92 300 1234567 or 03001234567)',
    })
    .optional()
    .or(z.literal('')),
});

therapistWorkspaceRouter.post('/invites', requireAuth, requireRole('therapist', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const therapist = getTherapistRecord(req.user!.id);
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    const parseResult = inviteSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid invite input',
      });
    }

    const data = parseResult.data;

    // Generate code: REC-XXXX (alphanumeric uppercase)
    const code = 'REC-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    db.prepare(`
      INSERT INTO invites (code, therapist_id, patient_name, patient_phone, used)
      VALUES (?, ?, ?, ?, 0)
    `).run(
      code,
      therapist.id,
      data.patient_name || '',
      data.patient_phone || ''
    );

    const messageTemplate = `Assalamu Alaikum ${data.patient_name || 'Patient'}! ${formatTherapistName(therapist.name)} invites you to connect your rehabilitation profile on RECURA. Enter invite code: ${code} in your patient portal to receive custom exercise protocols and monitor your daily recovery.`;

    res.status(201).json({
      message: 'Invite code generated!',
      code,
      patient_name: data.patient_name || '',
      patient_phone: data.patient_phone || '',
      messageTemplate,
    });
  } catch (err: any) {
    console.error('Error generating invite:', err);
    res.status(500).json({ error: 'Failed to generate invite code' });
  }
});
