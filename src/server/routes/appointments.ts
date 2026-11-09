import { Router } from 'express';
import { z } from 'zod';
import db from '../db/index.ts';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth.ts';

export const appointmentsRouter = Router();

// 1. GET /api/appointments/slots/:therapistId?date=YYYY-MM-DD
// Returns 30-minute slots from therapist's availability and flags booked ones
appointmentsRouter.get('/slots/:therapistId', async (req, res) => {
  try {
    const therapistId = Number(req.params.therapistId);
    const dateStr = req.query.date as string;

    if (isNaN(therapistId) || !dateStr) {
      return res.status(400).json({ error: 'Therapist ID and valid date (YYYY-MM-DD) are required' });
    }

    const targetDate = new Date(dateStr + 'T00:00:00');
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // SQLite/JS getDay(): 0 is Sunday, 1 is Monday, ... 6 is Saturday
    const weekday = targetDate.getDay();

    const availability = db.prepare(`
      SELECT start_time, end_time
      FROM availability
      WHERE therapist_id = ? AND weekday = ?
    `).get(therapistId, weekday) as { start_time: string; end_time: string } | undefined;

    if (!availability) {
      return res.json({
        available: false,
        message: 'Therapist is not available on this day of the week',
        slots: [],
      });
    }

    // Generate 30-minute slots between start_time and end_time
    const [startH, startM] = availability.start_time.split(':').map(Number);
    const [endH, endM] = availability.end_time.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const allSlots: string[] = [];
    for (let m = startMinutes; m < endMinutes; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      allSlots.push(timeStr);
    }

    // Query booked appointments for this date
    const bookedAppointments = db.prepare(`
      SELECT time
      FROM appointments
      WHERE therapist_id = ? AND date = ? AND status NOT IN ('cancelled', 'declined')
    `).all(therapistId, dateStr) as { time: string }[];

    const bookedSet = new Set(bookedAppointments.map((b) => b.time));

    // Check if date is today to filter past hours
    const now = new Date();
    const isToday = dateStr === now.toISOString().split('T')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const slots = allSlots.map((time) => {
      const [h, min] = time.split(':').map(Number);
      const slotMinutes = h * 60 + min;
      const isPast = isToday && slotMinutes <= currentMinutes;
      const isBooked = bookedSet.has(time);

      return {
        time,
        available: !isBooked && !isPast,
        reason: isBooked ? 'Booked' : isPast ? 'Time passed' : 'Open',
      };
    });

    res.json({
      available: true,
      therapistId,
      date: dateStr,
      workingHours: `${availability.start_time} - ${availability.end_time}`,
      slots,
    });
  } catch (err: any) {
    console.error('Error computing available slots:', err);
    res.status(500).json({ error: 'Failed to calculate available slots' });
  }
});

// Zod schema for booking an appointment
const bookAppointmentSchema = z.object({
  therapist_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be formatted as HH:MM'),
  type: z.enum(['in-clinic', 'home', 'video']),
  reason: z.string().trim().min(2, 'Please select or enter the consultation reason'),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

// 2. POST /api/appointments/book
appointmentsRouter.post('/book', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const patientId = req.user!.id;
    const parseResult = bookAppointmentSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid booking details',
        details: parseResult.error.issues,
      });
    }

    const { therapist_id, date, time, type, reason, notes } = parseResult.data;

    // Check that date is not in the past
    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) {
      return res.status(400).json({ error: 'Cannot book appointments for past dates.' });
    }

    // Verify therapist exists and is approved
    const therapist = db.prepare(`
      SELECT t.*, u.id as user_id, u.email
      FROM therapists t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ? AND t.status = 'approved'
    `).get(therapist_id) as any;

    if (!therapist) {
      return res.status(404).json({ error: 'Physiotherapist not found or inactive.' });
    }

    // SERVER-SIDE PLAN LIMIT ENFORCEMENT
    const patientPlan = db.prepare('SELECT plan FROM plans WHERE patient_id = ?').get(patientId) as any;
    const planType = patientPlan?.plan || 'free';

    if (planType === 'free') {
      if (type === 'home') {
        return res.status(403).json({
          error: 'Home visits require a Basic or Premium plan. Please upgrade your plan or select an in-clinic consultation.',
          code: 'UPGRADE_REQUIRED',
        });
      }
      if (type === 'video') {
        return res.status(403).json({
          error: 'Video consultations require a Basic or Premium plan. Free plans include in-clinic bookings only.',
          code: 'UPGRADE_REQUIRED',
        });
      }
    }

    // PREVENT DOUBLE-BOOKING: Check if slot is already occupied
    const existing = db.prepare(`
      SELECT id FROM appointments
      WHERE therapist_id = ? AND date = ? AND time = ?
        AND status NOT IN ('cancelled', 'declined')
    `).get(therapist_id, date, time);

    if (existing) {
      return res.status(409).json({
        error: `The ${time} slot on ${date} was just reserved by another patient. Please choose an adjacent slot.`,
      });
    }

    // Patient profile name for notification
    const patientProfile = db.prepare('SELECT name, city FROM patient_profiles WHERE user_id = ?').get(patientId) as any;
    const patientName = patientProfile?.name || 'A patient';

    // Insert appointment with initial status 'requested'
    const insertAppt = db.prepare(`
      INSERT INTO appointments (
        patient_id, therapist_id, type, date, time, status, reason, notes
      ) VALUES (?, ?, ?, ?, ?, 'requested', ?, ?)
    `).run(
      patientId,
      therapist_id,
      type,
      date,
      time,
      reason,
      notes || ''
    );

    const appointmentId = insertAppt.lastInsertRowid as number;

    // Notify Therapist
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, body)
      VALUES (?, 'appointment_requested', 'New Consultation Request', ?)
    `).run(
      therapist.user_id,
      `${patientName} requested a ${type} consultation on ${date} at ${time}. Reason: ${reason}.`
    );

    // Notify Patient
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, body)
      VALUES (?, 'appointment_pending', 'Consultation Request Sent', ?)
    `).run(
      patientId,
      `Your ${type} appointment request with ${therapist.name} for ${date} at ${time} is awaiting confirmation.`
    );

    const createdAppointment = db.prepare(`
      SELECT a.*, t.name as therapist_name, t.city as therapist_city, t.fee as therapist_fee,
             t.speciality as therapist_speciality
      FROM appointments a
      JOIN therapists t ON a.therapist_id = t.id
      WHERE a.id = ?
    `).get(appointmentId);

    res.status(201).json({
      message: 'Appointment successfully requested! Waiting for therapist confirmation.',
      appointment: createdAppointment,
    });
  } catch (err: any) {
    console.error('Error booking appointment:', err);
    res.status(500).json({ error: 'Failed to complete booking. Please try again.' });
  }
});

// 3. GET /api/appointments
// Fetch appointments filtered by user role
appointmentsRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    let query = '';
    const params: any[] = [];

    if (user.role === 'patient') {
      query = `
        SELECT a.*,
               t.name as therapist_name, t.speciality as therapist_speciality,
               t.city as therapist_city, t.fee as therapist_fee,
               r.id as review_id, r.rating as review_rating, r.comment as review_comment
        FROM appointments a
        JOIN therapists t ON a.therapist_id = t.id
        LEFT JOIN reviews r ON a.id = r.appointment_id
        WHERE a.patient_id = ?
        ORDER BY a.date DESC, a.time DESC
      `;
      params.push(user.id);
    } else if (user.role === 'therapist') {
      const therapistProfile = db.prepare('SELECT id FROM therapists WHERE user_id = ?').get(user.id) as any;
      if (!therapistProfile) {
        return res.json({ appointments: [] });
      }

      query = `
        SELECT a.*,
               p.name as patient_name, p.phone as patient_phone,
               p.city as patient_city, p.primary_complaint_area,
               r.id as review_id, r.rating as review_rating, r.comment as review_comment
        FROM appointments a
        JOIN patient_profiles p ON a.patient_id = p.user_id
        LEFT JOIN reviews r ON a.id = r.appointment_id
        WHERE a.therapist_id = ?
        ORDER BY a.date DESC, a.time DESC
      `;
      params.push(therapistProfile.id);
    } else {
      // Admin
      query = `
        SELECT a.*,
               t.name as therapist_name, t.city as therapist_city,
               p.name as patient_name, p.phone as patient_phone,
               r.id as review_id, r.rating as review_rating
        FROM appointments a
        JOIN therapists t ON a.therapist_id = t.id
        JOIN patient_profiles p ON a.patient_id = p.user_id
        ORDER BY a.date DESC, a.time DESC
      `;
    }

    const appointments = db.prepare(query).all(...params);
    res.json({ appointments });
  } catch (err: any) {
    console.error('Error loading appointments:', err);
    res.status(500).json({ error: 'Failed to load appointments' });
  }
});

// 4. PUT /api/appointments/:id/reschedule
// Updates date and time on existing appointment
appointmentsRouter.put('/:id/reschedule', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({ error: 'New date and time are required to reschedule' });
    }

    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId) as any;
    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Role check: Only the patient or the booked therapist can reschedule
    const isPatient = req.user!.role === 'patient' && appt.patient_id === req.user!.id;
    const therapistUser = db.prepare('SELECT user_id FROM therapists WHERE id = ?').get(appt.therapist_id) as any;
    const isTherapist = req.user!.role === 'therapist' && therapistUser?.user_id === req.user!.id;
    const isAdmin = req.user!.role === 'admin';

    if (!isPatient && !isTherapist && !isAdmin) {
      return res.status(403).json({ error: 'Access denied. You cannot reschedule this appointment.' });
    }

    // Check slot conflict
    const conflict = db.prepare(`
      SELECT id FROM appointments
      WHERE therapist_id = ? AND date = ? AND time = ?
        AND id != ? AND status NOT IN ('cancelled', 'declined')
    `).get(appt.therapist_id, date, time, appointmentId);

    if (conflict) {
      return res.status(409).json({ error: 'This time slot is already taken. Please choose another.' });
    }

    // Update the same appointment record
    db.prepare(`
      UPDATE appointments
      SET date = ?, time = ?, status = 'requested',
          notes = notes || '\n[Rescheduled to ' || ? || ' at ' || ? || ']',
          updated_at = datetime('now')
      WHERE id = ?
    `).run(date, time, date, time, appointmentId);

    // Notify parties
    if (isPatient) {
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, body)
        VALUES (?, 'appointment_rescheduled', 'Appointment Rescheduled', ?)
      `).run(therapistUser.user_id, `Patient rescheduled appointment #${appointmentId} to ${date} at ${time}.`);
    } else {
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, body)
        VALUES (?, 'appointment_rescheduled', 'Appointment Rescheduled by Therapist', ?)
      `).run(appt.patient_id, `Your therapist rescheduled appointment #${appointmentId} to ${date} at ${time}.`);
    }

    res.json({ message: 'Appointment rescheduled successfully!', date, time });
  } catch (err: any) {
    console.error('Error rescheduling appointment:', err);
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
});

// 5. PUT /api/appointments/:id/cancel
// Cancels appointment with mandatory reason
appointmentsRouter.put('/:id/cancel', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const { reason = 'Cancelled by user' } = req.body;

    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId) as any;
    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const isPatient = req.user!.role === 'patient' && appt.patient_id === req.user!.id;
    const therapistUser = db.prepare('SELECT user_id FROM therapists WHERE id = ?').get(appt.therapist_id) as any;
    const isTherapist = req.user!.role === 'therapist' && therapistUser?.user_id === req.user!.id;
    const isAdmin = req.user!.role === 'admin';

    if (!isPatient && !isTherapist && !isAdmin) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    db.prepare(`
      UPDATE appointments
      SET status = 'cancelled',
          notes = notes || '\n[Cancellation Reason: ' || ? || ']',
          updated_at = datetime('now')
      WHERE id = ?
    `).run(reason, appointmentId);

    // Notify other party
    const targetUserId = isPatient ? therapistUser?.user_id : appt.patient_id;
    if (targetUserId) {
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, body)
        VALUES (?, 'appointment_cancelled', 'Appointment Cancelled', ?)
      `).run(targetUserId, `Appointment #${appointmentId} was cancelled. Reason: ${reason}`);
    }

    res.json({ message: 'Appointment successfully cancelled.', appointmentId });
  } catch (err: any) {
    console.error('Error cancelling appointment:', err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// 6. POST /api/appointments/:id/review
// Patient submits review for a completed appointment and updates therapist rating
appointmentsRouter.post('/:id/review', requireAuth, requireRole('patient'), (req: AuthenticatedRequest, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const patientId = req.user!.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be a whole number between 1 and 5' });
    }

    const appt = db.prepare(`
      SELECT * FROM appointments
      WHERE id = ? AND patient_id = ? AND status = 'completed'
    `).get(appointmentId, patientId) as any;

    if (!appt) {
      return res.status(400).json({ error: 'Review can only be submitted for completed sessions.' });
    }

    // Check if already reviewed
    const existing = db.prepare('SELECT id FROM reviews WHERE appointment_id = ?').get(appointmentId);
    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this appointment.' });
    }

    // Insert review
    db.prepare(`
      INSERT INTO reviews (appointment_id, patient_id, therapist_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(appointmentId, patientId, appt.therapist_id, Number(rating), comment || '');

    // Recalculate average therapist rating
    const avgRes = db.prepare(`
      SELECT AVG(rating) as avg_rating FROM reviews WHERE therapist_id = ?
    `).get(appt.therapist_id) as any;

    const newRating = avgRes?.avg_rating ? Math.round(avgRes.avg_rating * 10) / 10 : 5.0;
    db.prepare('UPDATE therapists SET rating = ? WHERE id = ?').run(newRating, appt.therapist_id);

    res.json({
      message: 'Thank you for reviewing your physical therapist!',
      rating: newRating,
    });
  } catch (err: any) {
    console.error('Error submitting review:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// 7. GET /api/appointments/:id/calendar
// Downloads standard .ics calendar invite
appointmentsRouter.get('/:id/calendar', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const appt = db.prepare(`
      SELECT a.*, t.name as therapist_name, t.city as therapist_city,
             p.name as patient_name
      FROM appointments a
      JOIN therapists t ON a.therapist_id = t.id
      JOIN patient_profiles p ON a.patient_id = p.user_id
      WHERE a.id = ?
    `).get(appointmentId) as any;

    if (!appt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const [year, month, day] = appt.date.split('-');
    const [hour, minute] = appt.time.split(':');

    const dtStart = `${year}${month}${day}T${hour}${minute}00`;
    // 30 min duration
    const endMinutes = Number(minute) + 30;
    const endHour = endMinutes >= 60 ? Number(hour) + 1 : Number(hour);
    const endMinFormatted = (endMinutes % 60).toString().padStart(2, '0');
    const dtEnd = `${year}${month}${day}T${endHour.toString().padStart(2, '0')}${endMinFormatted}00`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RECURA by Physio Hub//Consultation Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:recura-appt-${appt.id}@recura.pk`,
      `DTSTAMP:${year}${month}${day}T000000Z`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:RECURA Physiotherapy: ${appt.therapist_name} (${appt.type})`,
      `DESCRIPTION:Physiotherapy session for ${appt.patient_name} with ${appt.therapist_name}. Reason: ${appt.reason}`,
      `LOCATION:${appt.type === 'video' ? 'Online Telehealth Video' : appt.therapist_city}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="recura-appointment-${appt.id}.ics"`);
    res.send(icsContent);
  } catch (err: any) {
    console.error('Error generating calendar file:', err);
    res.status(500).json({ error: 'Failed to generate calendar file' });
  }
});
