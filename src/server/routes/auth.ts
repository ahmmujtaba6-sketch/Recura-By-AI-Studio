import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import db from '../db/index.ts';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.ts';
import { rateLimit } from '../middleware/rateLimit.ts';

export const authRouter = Router();

const loginLimiter = rateLimit({
  max: 20,
  windowMs: 5 * 60 * 1000,
  message: 'Too many login attempts. Please wait 5 minutes before trying again.',
});

// Helper to create and set session cookie
function createSession(res: Response, userId: number): string {
  const token = crypto.randomBytes(32).toString('hex');
  // 30 days expiration
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (?, ?, ?)
  `).run(userId, token, expiresAt);

  res.cookie('recura_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return token;
}

// Zod schemas
const registerSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.enum(['patient', 'therapist']),
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  city: z.string().trim().min(2, 'Please select a valid city'),
  phone: z.string().trim().regex(/^(\+92|0)?3[0-9]{9}$/, 'Please enter a valid Pakistan mobile number (e.g. +92 300 1234567)').optional().or(z.literal('')),
  // Therapist specific fields
  speciality: z.string().trim().optional(),
  registration_no: z.string().trim().optional(),
  experience: z.number().min(0).max(50).optional(),
  fee: z.number().min(500).max(10000).optional(),
  bio: z.string().trim().optional(),
  // Patient specific fields
  primary_complaint_area: z.string().trim().optional(),
  primary_complaint_duration: z.string().trim().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// 1. Register
authRouter.post('/register', async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid input data',
        details: parseResult.error.issues,
      });
    }

    const data = parseResult.data;

    // Check duplicate email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
    }

    if (data.role === 'therapist') {
      if (!data.registration_no || !data.speciality || !data.fee) {
        return res.status(400).json({ error: 'Speciality, registration number, and consultation fee are required for therapists.' });
      }
      const existingReg = db.prepare('SELECT id FROM therapists WHERE registration_no = ?').get(data.registration_no.trim());
      if (existingReg) {
        return res.status(400).json({ error: 'This PMDC/PCP Registration Number is already registered.' });
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const userInsert = db.prepare(`
      INSERT INTO users (email, password_hash, role)
      VALUES (?, ?, ?)
    `).run(data.email.toLowerCase(), passwordHash, data.role);

    const userId = userInsert.lastInsertRowid as number;

    if (data.role === 'patient') {
      db.prepare(`
        INSERT INTO patient_profiles (
          user_id, name, phone, city, dob, gender,
          primary_complaint_area, primary_complaint_duration, completion_percentage
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        data.name.trim(),
        data.phone || '',
        data.city.trim(),
        data.dob || '',
        data.gender || '',
        data.primary_complaint_area || '',
        data.primary_complaint_duration || '',
        35
      );

      // Default Free Plan
      db.prepare(`
        INSERT INTO plans (patient_id, plan, cycle, video_calls_used)
        VALUES (?, 'free', 'monthly', 0)
      `).run(userId);

      // Welcome notification
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, body)
        VALUES (?, 'welcome', 'Welcome to RECURA!', 'Start your recovery journey by setting your primary complaint and tracking pain.')
      `).run(userId);
    } else {
      // Therapist starts as 'pending' approval by admin
      const tRes = db.prepare(`
        INSERT INTO therapists (
          user_id, name, speciality, registration_no, experience, city, fee, bio, status, rating
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 5.0)
      `).run(
        userId,
        data.name.trim(),
        data.speciality || 'General Physiotherapy',
        data.registration_no!.trim(),
        data.experience || 1,
        data.city.trim(),
        data.fee || 2000,
        data.bio || 'Dedicated physiotherapist committed to evidence-based musculoskeletal care.'
      );

      const therapistId = tRes.lastInsertRowid as number;

      // Add default availability (Mon-Fri 09:00 - 17:00)
      for (let day = 1; day <= 5; day++) {
        db.prepare('INSERT INTO availability (therapist_id, weekday, start_time, end_time) VALUES (?, ?, ?, ?)').run(
          therapistId,
          day,
          '09:00',
          '17:00'
        );
      }

      // Notification for therapist
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, body)
        VALUES (?, 'pending_approval', 'Application Submitted', 'Your therapist account is under review by Recura Admins. You will be notified once approved.')
      `).run(userId);
    }

    const token = createSession(res, userId);

    // Fetch created user details
    const createdUser: any = {
      id: userId,
      email: data.email.toLowerCase(),
      role: data.role,
      token,
    };

    if (data.role === 'patient') {
      createdUser.patient_profile = db.prepare('SELECT * FROM patient_profiles WHERE user_id = ?').get(userId);
      createdUser.plan = db.prepare('SELECT * FROM plans WHERE patient_id = ?').get(userId);
    } else {
      createdUser.therapist_profile = db.prepare('SELECT * FROM therapists WHERE user_id = ?').get(userId);
    }

    res.status(201).json({
      message: 'Registration successful!',
      user: createdUser,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
});

// 2. Login
authRouter.post('/login', loginLimiter, async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid credentials' });
    }

    const { email, password } = parseResult.data;

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = createSession(res, user.id);

    const userPayload: any = {
      id: user.id,
      email: user.email,
      role: user.role,
      token,
      created_at: user.created_at,
    };

    if (user.role === 'patient') {
      userPayload.patient_profile = db.prepare('SELECT * FROM patient_profiles WHERE user_id = ?').get(user.id);
      userPayload.plan = db.prepare('SELECT * FROM plans WHERE patient_id = ?').get(user.id);
    } else if (user.role === 'therapist') {
      userPayload.therapist_profile = db.prepare('SELECT * FROM therapists WHERE user_id = ?').get(user.id);
    }

    res.json({
      message: 'Login successful',
      user: userPayload,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
});

// 3. Logout
authRouter.post('/logout', (req: AuthenticatedRequest, res) => {
  const token = req.cookies?.recura_session || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }

  res.clearCookie('recura_session', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully' });
});

// 4. Me
authRouter.get('/me', (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.user });
});

// 5. Fast Demo Account Switcher (Development helper)
authRouter.post('/switch-demo', async (req, res) => {
  const { role } = req.body;
  let targetEmail = 'patient@recura.demo';
  if (role === 'therapist') targetEmail = 'therapist@recura.demo';
  else if (role === 'admin') targetEmail = 'admin@recura.demo';

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(targetEmail) as any;
  if (!user) {
    return res.status(404).json({ error: `Demo account for ${role} not found` });
  }

  const token = createSession(res, user.id);

  const userPayload: any = {
    id: user.id,
    email: user.email,
    role: user.role,
    token,
  };

  if (user.role === 'patient') {
    userPayload.patient_profile = db.prepare('SELECT * FROM patient_profiles WHERE user_id = ?').get(user.id);
    userPayload.plan = db.prepare('SELECT * FROM plans WHERE patient_id = ?').get(user.id);
  } else if (user.role === 'therapist') {
    userPayload.therapist_profile = db.prepare('SELECT * FROM therapists WHERE user_id = ?').get(user.id);
  }

  res.json({
    message: `Switched to ${role} demo account`,
    user: userPayload,
  });
});
