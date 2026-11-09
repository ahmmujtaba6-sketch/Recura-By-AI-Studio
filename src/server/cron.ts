import cron from 'node-cron';
import db from './db/index.ts';

export function startCronJobs() {
  console.log('Initializing scheduled reminder cron jobs...');

  // 1. Appointment reminder: Runs every hour
  // Checks upcoming appointments within the next 24 hours
  cron.schedule('0 * * * *', () => {
    try {
      const upcoming = db.prepare(`
        SELECT a.id, a.patient_id, a.therapist_id, a.date, a.time, a.type,
               t.name as therapist_name, p.name as patient_name
        FROM appointments a
        JOIN therapists t ON a.therapist_id = t.id
        JOIN patient_profiles p ON a.patient_id = p.user_id
        WHERE a.status = 'upcoming'
          AND a.date = date('now', '+1 day')
      `).all() as any[];

      const insertNotification = db.prepare(`
        INSERT INTO notifications (user_id, type, title, body)
        VALUES (?, ?, ?, ?)
      `);

      for (const appt of upcoming) {
        // Check if reminder already sent
        const existing = db.prepare(`
          SELECT id FROM notifications 
          WHERE user_id = ? AND type = 'appointment_reminder' AND body LIKE ?
        `).get(appt.patient_id, `%appointment #${appt.id}%`);

        if (!existing) {
          // Notify patient
          insertNotification.run(
            appt.patient_id,
            'appointment_reminder',
            'Upcoming Appointment Tomorrow',
            `Reminder: You have a ${appt.type} session with ${appt.therapist_name} tomorrow at ${appt.time} (appointment #${appt.id}).`
          );
          // Notify therapist
          const therapistUser = db.prepare('SELECT user_id FROM therapists WHERE id = ?').get(appt.therapist_id) as any;
          if (therapistUser) {
            insertNotification.run(
              therapistUser.user_id,
              'appointment_reminder',
              'Patient Session Tomorrow',
              `Reminder: Session scheduled with ${appt.patient_name} tomorrow at ${appt.time} (${appt.type}).`
            );
          }
        }
      }
    } catch (err) {
      console.error('Error running appointment reminder cron:', err);
    }
  });

  // 2. Daily 6 PM exercise reminder: Runs at 18:00 every day
  cron.schedule('0 18 * * *', () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const patientsWithAssignments = db.prepare(`
        SELECT DISTINCT a.patient_id, p.name
        FROM assignments a
        JOIN patient_profiles p ON a.patient_id = p.user_id
        WHERE a.active = 1
      `).all() as any[];

      for (const pt of patientsWithAssignments) {
        // Check if patient already logged exercise today
        const logged = db.prepare(`
          SELECT id FROM exercise_logs
          WHERE patient_id = ? AND date = ? AND done = 1
        `).get(pt.patient_id, todayStr);

        if (!logged) {
          db.prepare(`
            INSERT INTO notifications (user_id, type, title, body)
            VALUES (?, 'exercise_reminder', 'Daily Exercise Reminder', 'You haven\\'t logged your physiotherapy exercises today. Take 10 minutes to protect your recovery progress!')
          `).run(pt.patient_id);
        }
      }
    } catch (err) {
      console.error('Error running daily exercise reminder cron:', err);
    }
  });

  console.log('Cron jobs scheduled: 24h appointment reminders and 6 PM daily exercise notifications.');
}
