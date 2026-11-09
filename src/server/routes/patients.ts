import { Router } from 'express';
import { z } from 'zod';
import db from '../db/index.ts';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth.ts';

export const patientsRouter = Router();

// Calculate profile completion percentage based on filled fields
export function calculateCompletion(profile: any): number {
  if (!profile) return 0;
  const fields = [
    Boolean(profile.name && profile.name.trim()),
    Boolean(profile.phone && profile.phone.trim()),
    Boolean(profile.dob && profile.dob.trim()),
    Boolean(profile.gender && profile.gender.trim()),
    Boolean(profile.city && profile.city.trim()),
    Boolean(profile.height && Number(profile.height) > 0),
    Boolean(profile.weight && Number(profile.weight) > 0),
    Boolean(profile.allergies && profile.allergies.trim()),
    Boolean(profile.medical_history && profile.medical_history.trim()),
    Boolean(profile.primary_complaint_area && profile.primary_complaint_area.trim()),
    Boolean(profile.primary_complaint_duration && profile.primary_complaint_duration.trim()),
  ];

  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
}

// Zod schema for patient profile update
const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .trim()
    .regex(/^(\+92|0)?3[0-9]{9}$/, 'Please enter a valid Pakistan mobile number (e.g. +92 300 1234567)')
    .optional()
    .or(z.literal('')),
  dob: z
    .string()
    .refine((val) => {
      if (!val) return true;
      const d = new Date(val);
      return !isNaN(d.getTime()) && d < new Date();
    }, 'Date of birth must be a valid date in the past')
    .optional()
    .or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  city: z.string().trim().min(2, 'Please select a valid city'),
  height: z.number().min(0).max(250).optional(),
  weight: z.number().min(0).max(300).optional(),
  allergies: z.string().trim().max(500).optional().or(z.literal('')),
  medical_history: z.string().trim().max(2000).optional().or(z.literal('')),
  primary_complaint_area: z.string().trim().min(1, 'Please select a primary complaint area'),
  primary_complaint_duration: z.string().trim().min(1, 'Please select the complaint duration'),
});

// 1. GET /api/patients/profile
patientsRouter.get('/profile', requireAuth, requireRole('patient', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const profile = db.prepare('SELECT * FROM patient_profiles WHERE user_id = ?').get(userId) as any;

    if (!profile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const completion = calculateCompletion(profile);

    res.json({
      profile: {
        ...profile,
        completion_percentage: completion,
      },
    });
  } catch (err: any) {
    console.error('Error fetching patient profile:', err);
    res.status(500).json({ error: 'Failed to load patient profile' });
  }
});

// 2. PUT /api/patients/profile
patientsRouter.put('/profile', requireAuth, requireRole('patient', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const parseResult = updateProfileSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid input data',
        details: parseResult.error.issues,
      });
    }

    const data = parseResult.data;
    const completion = calculateCompletion(data);

    db.prepare(`
      UPDATE patient_profiles
      SET name = ?,
          phone = ?,
          dob = ?,
          gender = ?,
          city = ?,
          height = ?,
          weight = ?,
          allergies = ?,
          medical_history = ?,
          primary_complaint_area = ?,
          primary_complaint_duration = ?,
          completion_percentage = ?,
          updated_at = datetime('now')
      WHERE user_id = ?
    `).run(
      data.name,
      data.phone || '',
      data.dob || '',
      data.gender || '',
      data.city,
      data.height || 0,
      data.weight || 0,
      data.allergies || '',
      data.medical_history || '',
      data.primary_complaint_area,
      data.primary_complaint_duration,
      completion,
      userId
    );

    const updated = db.prepare('SELECT * FROM patient_profiles WHERE user_id = ?').get(userId);

    res.json({
      message: 'Profile updated successfully!',
      profile: updated,
    });
  } catch (err: any) {
    console.error('Error updating patient profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 3. GET /api/patients/favourites
patientsRouter.get('/favourites', requireAuth, requireRole('patient'), (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const favs = db.prepare('SELECT therapist_id FROM favourites WHERE user_id = ?').all(userId) as { therapist_id: number }[];
    const ids = favs.map((f) => f.therapist_id);
    res.json({ favourites: ids });
  } catch (err: any) {
    console.error('Error fetching favourites:', err);
    res.status(500).json({ error: 'Failed to fetch favourite therapists' });
  }
});

// 4. POST /api/patients/favourites/:therapistId (Toggle)
patientsRouter.post('/favourites/:therapistId', requireAuth, requireRole('patient'), (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const therapistId = Number(req.params.therapistId);

    if (isNaN(therapistId)) {
      return res.status(400).json({ error: 'Invalid therapist ID' });
    }

    const existing = db.prepare('SELECT id FROM favourites WHERE user_id = ? AND therapist_id = ?').get(userId, therapistId);

    if (existing) {
      db.prepare('DELETE FROM favourites WHERE user_id = ? AND therapist_id = ?').run(userId, therapistId);
      return res.json({ favourited: false, message: 'Removed from favourites' });
    } else {
      db.prepare('INSERT INTO favourites (user_id, therapist_id) VALUES (?, ?)').run(userId, therapistId);
      return res.json({ favourited: true, message: 'Added to favourites' });
    }
  } catch (err: any) {
    console.error('Error toggling favourite:', err);
    res.status(500).json({ error: 'Failed to update favourite status' });
  }
});

// 5. GET /api/patients/recommended-therapist
// Maps primary complaint area to optimal clinical speciality
patientsRouter.get('/recommended-therapist', requireAuth, requireRole('patient'), (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const profile = db.prepare('SELECT city, primary_complaint_area FROM patient_profiles WHERE user_id = ?').get(userId) as any;

    if (!profile || !profile.primary_complaint_area) {
      return res.json({ recommended: null });
    }

    const area = profile.primary_complaint_area.toLowerCase();
    let specialityKeyword = 'Musculoskeletal';
    if (area.includes('back') || area.includes('spine')) {
      specialityKeyword = 'Spine';
    } else if (area.includes('knee') || area.includes('sport')) {
      specialityKeyword = 'Sports';
    } else if (area.includes('pelvis') || area.includes('women')) {
      specialityKeyword = 'Women';
    } else if (area.includes('stroke') || area.includes('neuro')) {
      specialityKeyword = 'Neuro';
    }

    // Try same city first
    let therapist = db.prepare(`
      SELECT t.*, u.email
      FROM therapists t
      JOIN users u ON t.user_id = u.id
      WHERE t.status = 'approved'
        AND LOWER(t.city) = LOWER(?)
        AND (LOWER(t.speciality) LIKE LOWER(?) OR LOWER(t.speciality) LIKE '%musculoskeletal%')
      ORDER BY t.rating DESC
      LIMIT 1
    `).get(profile.city, `%${specialityKeyword}%`) as any;

    // Fallback if none in exact same city
    if (!therapist) {
      therapist = db.prepare(`
        SELECT t.*, u.email
        FROM therapists t
        JOIN users u ON t.user_id = u.id
        WHERE t.status = 'approved'
          AND LOWER(t.speciality) LIKE LOWER(?)
        ORDER BY t.rating DESC
        LIMIT 1
      `).get(`%${specialityKeyword}%`) as any;
    }

    res.json({ recommended: therapist, matchArea: profile.primary_complaint_area });
  } catch (err: any) {
    console.error('Error finding recommended therapist:', err);
    res.status(500).json({ error: 'Failed to load recommendation' });
  }
});

// 6. POST /api/patients/redeem-invite
// Allows a patient to connect with a therapist using an invite code
patientsRouter.post('/redeem-invite', requireAuth, requireRole('patient'), (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Please enter a valid invite code' });
    }

    const cleanCode = code.trim().toUpperCase();

    const invite = db.prepare(`
      SELECT i.*, t.name as therapist_name, t.speciality, t.city, t.user_id as therapist_user_id
      FROM invites i
      JOIN therapists t ON i.therapist_id = t.id
      WHERE UPPER(i.code) = ?
    `).get(cleanCode) as any;

    if (!invite) {
      return res.status(404).json({ error: 'Invalid invite code. Please check with your physiotherapist.' });
    }

    if (invite.used) {
      return res.status(400).json({ error: 'This invite code has already been redeemed.' });
    }

    const patientProfile = db.prepare('SELECT name, phone FROM patient_profiles WHERE user_id = ?').get(userId) as any;

    // Mark invite as used
    db.prepare('UPDATE invites SET used = 1 WHERE id = ?').run(invite.id);

    // Create an initial consultation appointment request or greeting to formally link them
    const todayStr = new Date().toISOString().split('T')[0];
    db.prepare(`
      INSERT INTO appointments (patient_id, therapist_id, type, date, time, status, reason, notes)
      VALUES (?, ?, 'in-clinic', ?, '10:00', 'requested', 'Invite Code Connection', ?)
    `).run(
      userId,
      invite.therapist_id,
      todayStr,
      `Linked via invite code ${cleanCode}`
    );

    const therapistDisplayName = invite.therapist_name.startsWith('Dr.') ? invite.therapist_name : `Dr. ${invite.therapist_name}`;

    // Notify patient
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, body)
      VALUES (?, 'invite_redeemed', 'Connected with Physiotherapist', ?)
    `).run(
      userId,
      `You are now connected with ${therapistDisplayName}. Your rehabilitation protocols and records are now active.`
    );

    // Notify therapist
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, body)
      VALUES (?, 'patient_linked', 'New Patient Joined Roster', ?)
    `).run(
      invite.therapist_user_id,
      `Patient ${patientProfile?.name || 'New Patient'} (${patientProfile?.phone || ''}) redeemed invite code ${cleanCode}.`
    );

    res.json({
      message: `Successfully connected with Dr. ${invite.therapist_name}!`,
      therapist: {
        id: invite.therapist_id,
        name: invite.therapist_name,
        speciality: invite.speciality,
        city: invite.city,
      },
    });
  } catch (err: any) {
    console.error('Error redeeming invite:', err);
    res.status(500).json({ error: 'Failed to redeem invite code' });
  }
});

