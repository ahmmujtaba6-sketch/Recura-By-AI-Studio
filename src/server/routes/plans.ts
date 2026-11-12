import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import db from '../db/index.ts';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth.ts';

export const plansRouter = Router();

// Pricing constants in PKR
const PLAN_PRICES = {
  free: { monthly: 0, yearly: 0, videoLimit: 0 },
  basic: { monthly: 1499, yearly: 14988, videoLimit: 2 }, // 1,249 * 12 = 14,988 (2 months free)
  premium: { monthly: 2999, yearly: 29988, videoLimit: 4 }, // 2,499 * 12 = 29,988 (2 months free)
};

// 1. GET /api/plans/current
// Fetch the current patient's plan details, video call limits, and usage
plansRouter.get('/current', requireAuth, requireRole('patient', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const patientId = req.user!.id;

    let planRecord = db.prepare('SELECT * FROM plans WHERE patient_id = ?').get(patientId) as any;

    if (!planRecord) {
      // Default Free Plan if not present
      db.prepare(`
        INSERT INTO plans (patient_id, plan, cycle, video_calls_used)
        VALUES (?, 'free', 'monthly', 0)
      `).run(patientId);
      planRecord = db.prepare('SELECT * FROM plans WHERE patient_id = ?').get(patientId);
    }

    const planType = (planRecord.plan || 'free') as 'free' | 'basic' | 'premium';
    const planConfig = PLAN_PRICES[planType] || PLAN_PRICES.free;

    res.json({
      plan: planRecord.plan,
      cycle: planRecord.cycle,
      started_at: planRecord.started_at,
      video_calls_used: planRecord.video_calls_used || 0,
      video_calls_limit: planConfig.videoLimit,
      period_start: planRecord.period_start,
      features: {
        painLogHistory: planType === 'free' ? 'last_7_days' : 'full',
        exerciseTutorials: planType !== 'free',
        bookingTypes: planType === 'free' ? ['in-clinic'] : ['in-clinic', 'home'],
        priorityBadge: planType === 'premium',
        chatEnabled: planType !== 'free',
        videoCallsPerMonth: planConfig.videoLimit,
        therapistComments: planType === 'premium',
        exportReport: planType === 'premium',
      },
    });
  } catch (err: any) {
    console.error('Error fetching plan details:', err);
    res.status(500).json({ error: 'Failed to load plan information' });
  }
});

// 2. POST /api/plans/subscribe
// Upgrade or switch subscription plan with simulated payment
const subscribeSchema = z.object({
  plan: z.enum(['free', 'basic', 'premium']),
  cycle: z.enum(['monthly', 'yearly']),
  method: z.enum(['jazzcash', 'easypaisa', 'card', 'cash']),
});

plansRouter.post('/subscribe', requireAuth, requireRole('patient'), (req: AuthenticatedRequest, res) => {
  try {
    const patientId = req.user!.id;
    const parseResult = subscribeSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid subscription payload',
      });
    }

    const { plan, cycle, method } = parseResult.data;

    const priceConfig = PLAN_PRICES[plan];
    const amount = cycle === 'yearly' ? priceConfig.yearly : priceConfig.monthly;

    const txnId = 'TXN-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // In simulated payment: record payment if amount > 0
    if (amount > 0) {
      db.prepare(`
        INSERT INTO payments (patient_id, kind, amount, method, status, transaction_id)
        VALUES (?, 'plan', ?, ?, 'paid', ?)
      `).run(patientId, amount, method, txnId);
    }

    // Update plans record
    db.prepare(`
      UPDATE plans
      SET plan = ?,
          cycle = ?,
          started_at = datetime('now'),
          video_calls_used = 0,
          period_start = datetime('now'),
          updated_at = datetime('now')
      WHERE patient_id = ?
    `).run(plan, cycle, patientId);

    // Send confirmation notification
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, body)
      VALUES (?, 'plan_updated', 'Plan Upgraded Successfully', ?)
    `).run(
      patientId,
      `You are now subscribed to the RECURA ${plan.toUpperCase()} plan (${cycle} billing). Video consultations and clinical tools are now active.`
    );

    res.json({
      message: `Successfully upgraded to ${plan.toUpperCase()} plan!`,
      plan,
      cycle,
      amount,
      method,
      transaction_id: txnId,
    });
  } catch (err: any) {
    console.error('Error upgrading plan:', err);
    res.status(500).json({ error: 'Failed to process plan subscription' });
  }
});

// 3. GET /api/plans/payments
// Returns payment history and total spend summary
plansRouter.get('/payments', requireAuth, requireRole('patient', 'admin'), (req: AuthenticatedRequest, res) => {
  try {
    const patientId = req.user!.id;

    const payments = db.prepare(`
      SELECT *
      FROM payments
      WHERE patient_id = ?
      ORDER BY created_at DESC
    `).all(patientId);

    const totalSpent = payments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);

    res.json({
      payments,
      totalSpent,
      currency: 'PKR',
    });
  } catch (err: any) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ error: 'Failed to load payment history' });
  }
});

// 4. POST /api/plans/session-payment
// Pay for an appointment session (simulated JazzCash, Easypaisa, Card, or Cash)
const sessionPaymentSchema = z.object({
  appointment_id: z.number().int().positive(),
  amount: z.number().int().positive(),
  method: z.enum(['jazzcash', 'easypaisa', 'card', 'cash']),
});

plansRouter.post('/session-payment', requireAuth, requireRole('patient'), (req: AuthenticatedRequest, res) => {
  try {
    const patientId = req.user!.id;
    const parseResult = sessionPaymentSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid session payment data',
      });
    }

    const { appointment_id, amount, method } = parseResult.data;

    // Verify appointment belongs to patient
    const apt = db.prepare('SELECT * FROM appointments WHERE id = ? AND patient_id = ?').get(appointment_id, patientId) as any;
    if (!apt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const txnId = 'APT-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    db.prepare(`
      INSERT INTO payments (patient_id, kind, amount, method, status, transaction_id)
      VALUES (?, 'session', ?, ?, 'paid', ?)
    `).run(patientId, amount, method, txnId);

    // Add note to appointment
    db.prepare(`
      UPDATE appointments
      SET notes = CASE WHEN notes = '' THEN ? ELSE notes || ' • ' || ? END,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(`Paid PKR ${amount.toLocaleString()} via ${method} (${txnId})`, `Paid PKR ${amount.toLocaleString()} via ${method} (${txnId})`, appointment_id);

    res.json({
      message: 'Consultation session payment completed successfully!',
      transaction_id: txnId,
      amount,
      method,
    });
  } catch (err: any) {
    console.error('Error recording session payment:', err);
    res.status(500).json({ error: 'Failed to record session payment' });
  }
});
