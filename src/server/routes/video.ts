import { Router } from 'express';
import crypto from 'crypto';
import db from '../db/index.ts';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.ts';

export const videoRouter = Router();

// POST /api/video/start
// Starts a video consultation room if allowed by the user's plan
videoRouter.post('/start', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { appointmentId } = req.body;

    let targetPatientId = user.id;

    if (user.role === 'therapist') {
      // If therapist is initiating, find patient from appointment
      if (!appointmentId) {
        return res.status(400).json({ error: 'Appointment ID is required to start session as a therapist' });
      }

      const apt = db.prepare('SELECT patient_id FROM appointments WHERE id = ?').get(appointmentId) as any;
      if (!apt) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      targetPatientId = apt.patient_id;
    }

    // Check patient's plan limits
    const plan = db.prepare('SELECT * FROM plans WHERE patient_id = ?').get(targetPatientId) as any;
    const planType = plan?.plan || 'free';
    const callsUsed = plan?.video_calls_used || 0;

    let maxCalls = 0;
    if (planType === 'basic') maxCalls = 2;
    else if (planType === 'premium') maxCalls = 4;

    if (planType === 'free') {
      return res.status(403).json({
        error: 'Video consultations are only available on Basic and Premium care plans. Please upgrade your plan to start video calls.',
        upgradeRequired: true,
        currentPlan: 'free',
      });
    }

    if (callsUsed >= maxCalls) {
      return res.status(403).json({
        error: `Monthly video call limit reached (${callsUsed}/${maxCalls} sessions used). You can upgrade to Premium for 4 calls/month or wait until your next monthly billing cycle.`,
        limitReached: true,
        callsUsed,
        maxCalls,
      });
    }

    // Only increment usage when patient initiates
    if (user.role === 'patient') {
      db.prepare(`
        UPDATE plans
        SET video_calls_used = video_calls_used + 1
        WHERE patient_id = ?
      `).run(targetPatientId);
    }

    const roomId = appointmentId
      ? `recura-session-${appointmentId}`
      : `recura-call-${crypto.randomBytes(4).toString('hex')}`;

    const roomUrl = `https://meet.jit.si/${roomId}#config.prejoinPageEnabled=false`;

    res.json({
      roomId,
      roomUrl,
      callsUsed: callsUsed + (user.role === 'patient' ? 1 : 0),
      callsRemaining: Math.max(0, maxCalls - (callsUsed + (user.role === 'patient' ? 1 : 0))),
      maxCalls,
      disclaimer: 'Recura does not diagnose or replace emergency care. In medical emergencies call 1122.',
    });
  } catch (err: any) {
    console.error('Error starting video consultation:', err);
    res.status(500).json({ error: 'Failed to initiate video session' });
  }
});
