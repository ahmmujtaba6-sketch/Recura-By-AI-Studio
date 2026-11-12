import { Router } from 'express';
import { z } from 'zod';
import db from '../db/index.ts';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth.ts';

export const adminRouter = Router();

// All routes here strictly require role === 'admin'
adminRouter.use(requireAuth, requireRole('admin'));

// 1. GET /api/admin/metrics
// Platform executive dashboard KPIs
adminRouter.get('/metrics', (req: AuthenticatedRequest, res) => {
  try {
    const totalUsersRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const totalPatientsRow = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'patient'").get() as { count: number };
    const totalTherapistsRow = db.prepare('SELECT COUNT(*) as count FROM therapists').get() as { count: number };
    const pendingTherapistsRow = db.prepare("SELECT COUNT(*) as count FROM therapists WHERE status = 'pending'").get() as { count: number };
    const totalAppointmentsRow = db.prepare('SELECT COUNT(*) as count FROM appointments').get() as { count: number };
    const openTicketsRow = db.prepare("SELECT COUNT(*) as count FROM support_tickets WHERE status != 'resolved'").get() as { count: number };

    // Total simulated revenue from payments table
    const revenueRow = db.prepare("SELECT SUM(amount) as total FROM payments WHERE status = 'paid'").get() as { total: number | null };

    // Subscriptions count by tier
    const planCounts = db.prepare(`
      SELECT plan, COUNT(*) as count
      FROM plans
      GROUP BY plan
    `).all() as { plan: string; count: number }[];

    // City distribution of approved therapists
    const cityDistribution = db.prepare(`
      SELECT city, COUNT(*) as count
      FROM therapists
      WHERE status = 'approved'
      GROUP BY city
      ORDER BY count DESC
    `).all();

    res.json({
      metrics: {
        totalUsers: totalUsersRow.count,
        totalPatients: totalPatientsRow.count,
        totalTherapists: totalTherapistsRow.count,
        pendingApprovals: pendingTherapistsRow.count,
        totalAppointments: totalAppointmentsRow.count,
        openTickets: openTicketsRow.count,
        totalSimulatedRevenuePKR: revenueRow.total || 0,
        planDistribution: planCounts,
        cityDistribution,
      },
    });
  } catch (err: any) {
    console.error('Error fetching admin metrics:', err);
    res.status(500).json({ error: 'Failed to load admin metrics' });
  }
});

// 2. GET /api/admin/therapists
// Therapist listings with status filter (pending, approved, rejected, all)
adminRouter.get('/therapists', (req: AuthenticatedRequest, res) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT t.*, u.email, u.created_at as registered_at
      FROM therapists t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (search && typeof search === 'string' && search.trim()) {
      query += ' AND (t.name LIKE ? OR t.speciality LIKE ? OR t.city LIKE ? OR t.registration_no LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s);
    }

    query += " ORDER BY CASE WHEN t.status = 'pending' THEN 0 ELSE 1 END, t.created_at DESC";

    const therapists = db.prepare(query).all(...params);
    res.json({ therapists });
  } catch (err: any) {
    console.error('Error fetching therapists for admin:', err);
    res.status(500).json({ error: 'Failed to fetch therapists' });
  }
});

// 3. PATCH /api/admin/therapists/:id/status
// Approve or Reject a therapist registration
const updateStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'pending']),
  reason: z.string().trim().optional(),
});

adminRouter.patch('/therapists/:id/status', (req: AuthenticatedRequest, res) => {
  try {
    const therapistId = Number(req.params.id);
    if (isNaN(therapistId)) {
      return res.status(400).json({ error: 'Invalid therapist ID' });
    }

    const parseResult = updateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid status data' });
    }

    const { status, reason } = parseResult.data;

    const therapist = db.prepare('SELECT * FROM therapists WHERE id = ?').get(therapistId) as any;
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist record not found' });
    }

    db.prepare('UPDATE therapists SET status = ? WHERE id = ?').run(status, therapistId);

    // Send notification to therapist's user account
    const notificationTitle = status === 'approved' ? 'PMR Credentials Approved!' : 'Registration Status Update';
    const notificationBody = status === 'approved'
      ? `Assalamu Alaikum Dr. ${therapist.name}. Your physical therapy credentials (Registration ${therapist.registration_no}) have been verified by the RECURA Clinical Board. You may now publish availability and accept bookings in ${therapist.city}.`
      : `Registration notice: Your credentials status has been updated to "${status}". Reason: ${reason || 'Credentials verification pending submission of updated PMR license.'}`;

    db.prepare(`
      INSERT INTO notifications (user_id, type, title, body)
      VALUES (?, 'therapist_verification', ?, ?)
    `).run(therapist.user_id, notificationTitle, notificationBody);

    const updated = db.prepare('SELECT * FROM therapists WHERE id = ?').get(therapistId);

    res.json({
      message: `Therapist has been ${status}.`,
      therapist: updated,
    });
  } catch (err: any) {
    console.error('Error updating therapist status:', err);
    res.status(500).json({ error: 'Failed to update therapist status' });
  }
});

// 4. GET /api/admin/users
// User directory across all roles
adminRouter.get('/users', (req: AuthenticatedRequest, res) => {
  try {
    const { role, search } = req.query;

    let query = `
      SELECT u.id, u.email, u.role, u.created_at,
             p.name as patient_name, p.phone as patient_phone, p.city as patient_city,
             t.name as therapist_name, t.city as therapist_city, t.status as therapist_status,
             pl.plan as patient_plan
      FROM users u
      LEFT JOIN patient_profiles p ON u.id = p.user_id
      LEFT JOIN therapists t ON u.id = t.user_id
      LEFT JOIN plans pl ON u.id = pl.patient_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role && role !== 'all') {
      query += ' AND u.role = ?';
      params.push(role);
    }

    if (search && typeof search === 'string' && search.trim()) {
      query += ' AND (u.email LIKE ? OR p.name LIKE ? OR t.name LIKE ? OR p.city LIKE ? OR t.city LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s, s);
    }

    query += ' ORDER BY u.created_at DESC';

    const users = db.prepare(query).all(...params);
    res.json({ users });
  } catch (err: any) {
    console.error('Error fetching users for admin:', err);
    res.status(500).json({ error: 'Failed to fetch user directory' });
  }
});

// 5. GET /api/admin/appointments
// System-wide appointments oversight
adminRouter.get('/appointments', (req: AuthenticatedRequest, res) => {
  try {
    const { status, type } = req.query;

    let query = `
      SELECT a.*,
             p.name as patient_name, p.phone as patient_phone, p.city as patient_city,
             u.email as patient_email,
             t.name as therapist_name, t.city as therapist_city, t.speciality, t.fee
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      JOIN patient_profiles p ON u.id = p.user_id
      JOIN therapists t ON a.therapist_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (type && type !== 'all') {
      query += ' AND a.type = ?';
      params.push(type);
    }

    query += ' ORDER BY a.date DESC, a.time DESC';

    const appointments = db.prepare(query).all(...params);
    res.json({ appointments });
  } catch (err: any) {
    console.error('Error fetching all appointments for admin:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// 6. GET /api/admin/tickets
// Support tickets triage
adminRouter.get('/tickets', (req: AuthenticatedRequest, res) => {
  try {
    const { status, category } = req.query;

    let query = 'SELECT * FROM support_tickets WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += " ORDER BY CASE WHEN status = 'open' THEN 0 WHEN status = 'in_progress' THEN 1 ELSE 2 END, created_at DESC";

    const tickets = db.prepare(query).all(...params);
    res.json({ tickets });
  } catch (err: any) {
    console.error('Error fetching tickets for admin:', err);
    res.status(500).json({ error: 'Failed to load support tickets' });
  }
});

// 7. PATCH /api/admin/tickets/:id
// Update support ticket status & resolution
const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']),
  resolution_note: z.string().trim().optional(),
});

adminRouter.patch('/tickets/:id', (req: AuthenticatedRequest, res) => {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    const parseResult = updateTicketSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid ticket data' });
    }

    const { status, resolution_note } = parseResult.data;

    const existing = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    db.prepare('UPDATE support_tickets SET status = ? WHERE id = ?').run(status, ticketId);

    // If ticket was created by an authenticated user, send notification
    if (existing.user_id) {
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, body)
        VALUES (?, 'support_ticket_update', 'Support Ticket Update', ?)
      `).run(
        existing.user_id,
        `Your support request regarding "${existing.category}" has been marked as ${status}.${resolution_note ? ' Note: ' + resolution_note : ''}`
      );
    }

    const updated = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);

    res.json({
      message: 'Support ticket updated successfully',
      ticket: updated,
    });
  } catch (err: any) {
    console.error('Error updating ticket:', err);
    res.status(500).json({ error: 'Failed to update support ticket' });
  }
});
