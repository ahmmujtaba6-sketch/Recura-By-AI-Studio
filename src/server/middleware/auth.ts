import { Request, Response, NextFunction } from 'express';
import db from '../db/index.ts';

export interface UserSessionData {
  id: number;
  email: string;
  role: 'patient' | 'therapist' | 'admin';
  created_at: string;
  patient_profile?: {
    id: number;
    name: string;
    phone: string;
    dob: string;
    gender: string;
    city: string;
    height: number;
    weight: number;
    allergies: string;
    medical_history: string;
    primary_complaint_area: string;
    primary_complaint_duration: string;
    completion_percentage: number;
  };
  therapist_profile?: {
    id: number;
    name: string;
    speciality: string;
    registration_no: string;
    experience: number;
    city: string;
    fee: number;
    bio: string;
    status: 'pending' | 'approved' | 'rejected';
    rating: number;
  };
  plan?: {
    id: number;
    plan: 'free' | 'basic' | 'premium';
    cycle: 'monthly' | 'yearly';
    video_calls_used: number;
    period_start: string;
  };
}

export interface AuthenticatedRequest extends Request {
  user?: UserSessionData;
  sessionToken?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check cookie or Bearer header
  const token = req.cookies?.recura_session || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

  if (!token) {
    return next();
  }

  try {
    const session = db.prepare(`
      SELECT s.token, s.expires_at, u.id, u.email, u.role, u.created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
    `).get(token) as { token: string; expires_at: string; id: number; email: string; role: 'patient' | 'therapist' | 'admin'; created_at: string } | undefined;

    if (!session) {
      return next();
    }

    req.sessionToken = token;
    const userData: UserSessionData = {
      id: session.id,
      email: session.email,
      role: session.role,
      created_at: session.created_at,
    };

    if (session.role === 'patient') {
      const profile = db.prepare('SELECT * FROM patient_profiles WHERE user_id = ?').get(session.id) as any;
      if (profile) userData.patient_profile = profile;

      const plan = db.prepare('SELECT * FROM plans WHERE patient_id = ?').get(session.id) as any;
      if (plan) userData.plan = plan;
    } else if (session.role === 'therapist') {
      const profile = db.prepare('SELECT * FROM therapists WHERE user_id = ?').get(session.id) as any;
      if (profile) userData.therapist_profile = profile;
    }

    req.user = userData;
    next();
  } catch (err) {
    console.error('Session authentication error:', err);
    next();
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

export function requireRole(...allowedRoles: ('patient' | 'therapist' | 'admin')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Requires one of: ${allowedRoles.join(', ')}` });
    }
    next();
  };
}
