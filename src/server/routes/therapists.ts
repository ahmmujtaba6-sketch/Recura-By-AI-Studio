import { Router } from 'express';
import db from '../db/index.ts';

export const therapistsRouter = Router();

// GET /api/therapists/public
// Search and filter approved therapists for visitors and patients
therapistsRouter.get('/public', (req, res) => {
  try {
    const { city, maxFee, speciality, limit } = req.query;

    let query = `
      SELECT t.id, t.user_id, t.name, t.speciality, t.registration_no,
             t.experience, t.city, t.fee, t.bio, t.status, t.rating,
             u.email
      FROM therapists t
      JOIN users u ON t.user_id = u.id
      WHERE t.status = 'approved'
    `;
    const params: any[] = [];

    if (city && typeof city === 'string' && city.trim() !== '' && city !== 'All Cities') {
      query += ` AND LOWER(t.city) = LOWER(?)`;
      params.push(city.trim());
    }

    if (maxFee && !isNaN(Number(maxFee))) {
      query += ` AND t.fee <= ?`;
      params.push(Number(maxFee));
    }

    if (speciality && typeof speciality === 'string' && speciality.trim() !== '' && speciality !== 'All Specialities') {
      query += ` AND LOWER(t.speciality) LIKE LOWER(?)`;
      params.push(`%${speciality.trim()}%`);
    }

    query += ` ORDER BY t.rating DESC, t.fee ASC`;

    if (limit && !isNaN(Number(limit))) {
      query += ` LIMIT ?`;
      params.push(Number(limit));
    }

    const therapists = db.prepare(query).all(...params) as any[];

    // Fetch availability for each therapist
    const getAvailability = db.prepare(`
      SELECT weekday, start_time, end_time
      FROM availability
      WHERE therapist_id = ?
      ORDER BY weekday ASC
    `);

    const result = therapists.map((t) => ({
      ...t,
      availability: getAvailability.all(t.id),
    }));

    res.json({ therapists: result });
  } catch (err: any) {
    console.error('Error fetching public therapists:', err);
    res.status(500).json({ error: 'Failed to search therapists' });
  }
});

// GET /api/therapists/public/:id
// Detailed profile for a single approved therapist
therapistsRouter.get('/public/:id', (req, res) => {
  try {
    const therapistId = Number(req.params.id);
    if (isNaN(therapistId)) {
      return res.status(400).json({ error: 'Invalid therapist ID' });
    }

    const therapist = db.prepare(`
      SELECT t.id, t.user_id, t.name, t.speciality, t.registration_no,
             t.experience, t.city, t.fee, t.bio, t.status, t.rating,
             u.email
      FROM therapists t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ? AND t.status = 'approved'
    `).get(therapistId) as any;

    if (!therapist) {
      return res.status(404).json({ error: 'Therapist not found or not currently active' });
    }

    const availability = db.prepare(`
      SELECT weekday, start_time, end_time
      FROM availability
      WHERE therapist_id = ?
      ORDER BY weekday ASC
    `).all(therapistId);

    const reviews = db.prepare(`
      SELECT r.id, r.rating, r.comment, r.created_at, p.name as patient_name
      FROM reviews r
      JOIN users u ON r.patient_id = u.id
      LEFT JOIN patient_profiles p ON u.id = p.user_id
      WHERE r.therapist_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `).all(therapistId);

    res.json({
      therapist: {
        ...therapist,
        availability,
        reviews,
      },
    });
  } catch (err: any) {
    console.error('Error fetching therapist profile:', err);
    res.status(500).json({ error: 'Failed to load therapist details' });
  }
});
