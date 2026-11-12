import { Router } from 'express';
import db from '../db/index.ts';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.ts';

export const notificationsRouter = Router();

// GET /api/notifications
// Retrieves user notifications and unread badge count
notificationsRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const notifications = db.prepare(`
      SELECT *
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(userId);

    const unreadRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND read = 0
    `).get(userId) as { count: number };

    res.json({
      notifications,
      unreadCount: unreadRow?.count || 0,
    });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// PATCH /api/notifications/:id/read
// Mark individual notification as read
notificationsRouter.patch('/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const notifId = Number(req.params.id);

    if (isNaN(notifId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    db.prepare(`
      UPDATE notifications
      SET read = 1
      WHERE id = ? AND user_id = ?
    `).run(notifId, userId);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err: any) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// POST /api/notifications/read-all
// Mark all user notifications as read
notificationsRouter.post('/read-all', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    db.prepare(`
      UPDATE notifications
      SET read = 1
      WHERE user_id = ? AND read = 0
    `).run(userId);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// DELETE /api/notifications/:id
// Delete a specific notification
notificationsRouter.delete('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const notifId = Number(req.params.id);

    if (isNaN(notifId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    db.prepare(`
      DELETE FROM notifications
      WHERE id = ? AND user_id = ?
    `).run(notifId, userId);

    res.json({ success: true, message: 'Notification removed' });
  } catch (err: any) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// DELETE /api/notifications
// Clear all notifications for user
notificationsRouter.delete('/', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    db.prepare(`
      DELETE FROM notifications
      WHERE user_id = ?
    `).run(userId);

    res.json({ success: true, message: 'All notifications cleared' });
  } catch (err: any) {
    console.error('Error clearing notifications:', err);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});
