import bcrypt from 'bcryptjs';
import db from './db/index.ts';
import { runMigrations } from './db/migrate.ts';

export async function seedDatabase() {
  console.log('Running migrations...');
  runMigrations();

  // Check if already seeded
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    console.log('Database already contains data. Skipping full seed.');
    return;
  }

  console.log('Seeding demo accounts and mock data...');
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, role)
    VALUES (?, ?, ?)
  `);

  const insertPatientProfile = db.prepare(`
    INSERT INTO patient_profiles (
      user_id, name, phone, dob, gender, city, height, weight,
      allergies, medical_history, primary_complaint_area, primary_complaint_duration, completion_percentage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTherapist = db.prepare(`
    INSERT INTO therapists (
      user_id, name, speciality, registration_no, experience, city, fee, bio, status, rating
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAvailability = db.prepare(`
    INSERT INTO availability (therapist_id, weekday, start_time, end_time)
    VALUES (?, ?, ?, ?)
  `);

  const insertPlan = db.prepare(`
    INSERT INTO plans (patient_id, plan, cycle, started_at, video_calls_used, period_start)
    VALUES (?, ?, ?, datetime('now', '-30 days'), ?, datetime('now', '-30 days'))
  `);

  const insertTutorial = db.prepare(`
    INSERT INTO tutorials (therapist_id, title, category, minutes, steps, safety_note, video_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAssignment = db.prepare(`
    INSERT INTO assignments (patient_id, tutorial_id, sets, reps, note, assigned_by, active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPainEntry = db.prepare(`
    INSERT INTO pain_entries (patient_id, date, score, area, note, time_of_day)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertExerciseLog = db.prepare(`
    INSERT INTO exercise_logs (patient_id, assignment_id, date, done, pain_after)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertAppointment = db.prepare(`
    INSERT INTO appointments (patient_id, therapist_id, type, date, time, status, reason, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, read)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertComment = db.prepare(`
    INSERT INTO comments (pain_entry_id, therapist_id, text)
    VALUES (?, ?, ?)
  `);

  const insertGoal = db.prepare(`
    INSERT INTO goals (patient_id, title, target_date, status)
    VALUES (?, ?, ?, ?)
  `);

  // 1. Admin
  const adminRes = insertUser.run('admin@recura.demo', passwordHash, 'admin');
  const adminId = adminRes.lastInsertRowid as number;

  // 2. Demo Therapist (Dr. Ayesha Khan - Karachi, Musculoskeletal & Sports Rehab)
  const demoTherapistUser = insertUser.run('therapist@recura.demo', passwordHash, 'therapist');
  const demoTherapistUserId = demoTherapistUser.lastInsertRowid as number;
  const demoTherapistRes = insertTherapist.run(
    demoTherapistUserId,
    'Dr. Ayesha Khan, PT',
    'Musculoskeletal & Sports Rehabilitation',
    'PK-PMR-41028',
    9,
    'Karachi',
    2500,
    'Senior Musculoskeletal Physiotherapist with clinical fellowship in biomechanics and spinal manual therapy. Passionate about empowering patients through guided movement.',
    'approved',
    4.9
  );
  const demoTherapistId = demoTherapistRes.lastInsertRowid as number;

  // Availability for Demo Therapist (Mon-Fri 09:00 - 17:00, Sat 10:00 - 14:00)
  for (let day = 1; day <= 5; day++) {
    insertAvailability.run(demoTherapistId, day, '09:00', '17:00');
  }
  insertAvailability.run(demoTherapistId, 6, '10:00', '14:00');

  // 3. 6 More Approved Therapists
  const otherTherapists = [
    {
      email: 'dr.bilal@recura.demo',
      name: 'Dr. Bilal Tariq, PT',
      speciality: 'Orthopaedic & Spine Rehabilitation',
      reg: 'PK-PMR-55921',
      exp: 12,
      city: 'Lahore',
      fee: 3200,
      bio: 'Post-surgical spinal rehabilitation specialist and certified dry-needling practitioner. 12+ years treating chronic lumbar disc pathology.',
      rating: 4.85,
    },
    {
      email: 'dr.fatima@recura.demo',
      name: 'Dr. Fatima Zahra, PT',
      speciality: 'Neurological & Stroke Recovery',
      reg: 'PK-PMR-33290',
      exp: 8,
      city: 'Islamabad',
      fee: 3000,
      bio: 'Neuro-rehabilitation expert trained in Bobath concept and gait retraining. Helping stroke and Parkinson patients regain functional independence.',
      rating: 4.95,
    },
    {
      email: 'dr.usman@recura.demo',
      name: 'Dr. Usman Farooq, PT',
      speciality: 'Sports Injury & Knee Rehab',
      reg: 'PK-PMR-78114',
      exp: 6,
      city: 'Rawalpindi',
      fee: 2200,
      bio: 'Former Pakistan cricket board rehabilitation consultant. Specializes in ACL return-to-sport protocols and meniscus recovery.',
      rating: 4.75,
    },
    {
      email: 'dr.zainab@recura.demo',
      name: 'Dr. Zainab Bibi, PT',
      speciality: "Women's Health & Pelvic Floor",
      reg: 'PK-PMR-61928',
      exp: 10,
      city: 'Peshawar',
      fee: 2800,
      bio: "Dedicated women's health physiotherapist focusing on pre/post-natal diastasis recti, pelvic girdle pain, and ergonomic postural recovery.",
      rating: 4.9,
    },
    {
      email: 'dr.hamza@recura.demo',
      name: 'Dr. Hamza Malik, PT',
      speciality: 'Geriatric & Joint Mobility',
      reg: 'PK-PMR-49012',
      exp: 7,
      city: 'Faisalabad',
      fee: 1800,
      bio: 'Specialist in osteoarthritis management, fall prevention, and gentle functional strengthening for senior citizens.',
      rating: 4.65,
    },
    {
      email: 'dr.nida@recura.demo',
      name: 'Dr. Nida Rashid, PT',
      speciality: 'Paediatric & Developmental Physio',
      reg: 'PK-PMR-82049',
      exp: 11,
      city: 'Multan',
      fee: 2600,
      bio: 'Gentle, play-based physical rehabilitation for torticollis, cerebral palsy, and juvenile postural corrections.',
      rating: 4.8,
    },
  ];

  for (const t of otherTherapists) {
    const userRes = insertUser.run(t.email, passwordHash, 'therapist');
    const uId = userRes.lastInsertRowid as number;
    const tRes = insertTherapist.run(uId, t.name, t.speciality, t.reg, t.exp, t.city, t.fee, t.bio, 'approved', t.rating);
    const thId = tRes.lastInsertRowid as number;

    // Weekday availability (Mon-Fri)
    for (let d = 1; d <= 5; d++) {
      insertAvailability.run(thId, d, '10:00', '18:00');
    }
  }

  // 4. Create Standard Tutorials for Dr. Ayesha Khan
  const tut1 = insertTutorial.run(
    demoTherapistId,
    'Cat-Cow Lumbar Mobilization',
    'Lower Back & Spine',
    8,
    JSON.stringify([
      'Begin on hands and knees with wrists under shoulders and knees under hips.',
      'Inhale: slowly drop your belly toward the floor, lifting chest and tailbone gently (Cow pose).',
      'Exhale: press the ground away, gently round your spine toward the ceiling, tucking your chin (Cat pose).',
      'Repeat smoothly with breath for 10 slow cycles. Never force through acute pain.'
    ]),
    'Stop immediately if pain radiates down the legs or feels sharp.',
    'https://www.youtube.com/watch?v=sI9f9jT5gRs'
  );
  const tut1Id = tut1.lastInsertRowid as number;

  const tut2 = insertTutorial.run(
    demoTherapistId,
    'Supine Glute Bridge & Core Stabilization',
    'Pelvis & Core',
    10,
    JSON.stringify([
      'Lie flat on your back with knees bent, feet flat on the floor hip-width apart.',
      'Engage your lower abdominal muscles gently as if pulling navel toward spine.',
      'Press through heels to lift hips until thighs and torso align. Hold for 3 seconds.',
      'Slowly lower down with control. Perform 3 sets of 10 repetitions.'
    ]),
    'Do not hyperextend your lower back at the top of the bridge.',
    'https://www.youtube.com/watch?v=wPM8icPu6H8'
  );
  const tut2Id = tut2.lastInsertRowid as number;

  const tut3 = insertTutorial.run(
    demoTherapistId,
    'Thoracic Extension & Foam Roller Decompression',
    'Mid Back & Posture',
    7,
    JSON.stringify([
      'Position foam roller or rolled towel across mid-back while seated with knees bent.',
      'Support your head with both hands, elbows pointing forward.',
      'Gently arch back over the roller without letting lower back sag.',
      'Hold the stretch for 5 deep breaths, shifting up and down one vertebra.'
    ]),
    'Keep your neck well supported throughout. Stop if you feel dizzy.',
    'https://www.youtube.com/watch?v=tI4QZ3N0p5U'
  );
  const tut3Id = tut3.lastInsertRowid as number;

  // 5. Primary Demo Patient: patient@recura.demo
  const primaryPatientUser = insertUser.run('patient@recura.demo', passwordHash, 'patient');
  const primaryPatientId = primaryPatientUser.lastInsertRowid as number;
  insertPatientProfile.run(
    primaryPatientId,
    'Hamza Abbasi',
    '+92 300 1234567',
    '1992-06-15',
    'Male',
    'Karachi',
    178,
    76,
    'None known',
    'Desk worker with 8+ hours screen time daily; mild lower lumbar tightness.',
    'Lower Back',
    '3 months',
    85
  );
  // Give primary patient Basic plan
  insertPlan.run(primaryPatientId, 'basic', 'monthly', 0);
  insertGoal.run(primaryPatientId, 'Sit 45 mins without lower back stiffness', '2026-12-01', 'in_progress');
  insertGoal.run(primaryPatientId, 'Resume 30-minute evening jog', '2026-12-15', 'in_progress');

  // Assign exercises to primary patient
  const asgn1 = insertAssignment.run(primaryPatientId, tut1Id, 3, 10, 'Perform every morning upon waking up.', demoTherapistId, 1);
  const asgn2 = insertAssignment.run(primaryPatientId, tut2Id, 3, 12, 'Strengthen glutes before bedtime.', demoTherapistId, 1);

  // Seed 14 days of history for primary patient
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Pain trending down from 7 to 3
    const score = Math.max(1, Math.min(10, Math.round(7 - (13 - i) * 0.3 + (i % 2 === 0 ? 0.5 : -0.5))));
    const painRes = insertPainEntry.run(
      primaryPatientId,
      dateStr,
      score,
      'Lower Back',
      i === 0 ? 'Feeling noticeably more mobile after stretches.' : 'Stiff in morning, eased after walking.',
      i % 2 === 0 ? 'Morning' : 'Evening'
    );

    // Exercise logs
    if (i !== 4 && i !== 9) { // 2 rest days
      insertExerciseLog.run(primaryPatientId, asgn1.lastInsertRowid as number, dateStr, 1, Math.max(0, score - 1));
      insertExerciseLog.run(primaryPatientId, asgn2.lastInsertRowid as number, dateStr, 1, Math.max(0, score - 1));
    }

    // Add therapist comment on a recent entry
    if (i === 2) {
      insertComment.run(painRes.lastInsertRowid as number, demoTherapistId, 'Great improvement Hamza! Noticeable stability gain in your lumbar lordosis.');
    }
  }

  // Appointment for primary patient with demo therapist
  insertAppointment.run(
    primaryPatientId,
    demoTherapistId,
    'in-clinic',
    new Date(today.getTime() + 86400000 * 2).toISOString().split('T')[0],
    '10:30',
    'upcoming',
    'Follow-up assessment on lumbar mobility and core progression.',
    'Bring previous MRI scans and exercise log.'
  );

  insertNotification.run(
    primaryPatientId,
    'welcome',
    'Welcome to RECURA!',
    'Your account is ready. Complete your profile and start logging your daily pain score.',
    0
  );

  // 6. Three Extra Demo Patients linked to Demo Therapist (Ali, Sara, Tariq)
  const extraPatients = [
    {
      email: 'ali.patient@recura.demo',
      name: 'Ali Ahmed',
      phone: '+92 321 4455667',
      dob: '1988-04-12',
      gender: 'Male',
      city: 'Karachi',
      complaint: 'Lower Back',
      duration: '6 months',
      basePain: 6,
      trend: -0.25,
      plan: 'premium',
    },
    {
      email: 'sara.patient@recura.demo',
      name: 'Sara Siddiqui',
      phone: '+92 333 9876543',
      dob: '1995-11-20',
      gender: 'Female',
      city: 'Karachi',
      complaint: 'Neck & Shoulders',
      duration: '1 month',
      basePain: 8,
      trend: -0.35,
      plan: 'premium',
    },
    {
      email: 'tariq.patient@recura.demo',
      name: 'Tariq Mahmood',
      phone: '+92 345 5551234',
      dob: '1970-08-05',
      gender: 'Male',
      city: 'Karachi',
      complaint: 'Shoulder',
      duration: '1 year',
      basePain: 7,
      trend: -0.2,
      plan: 'basic',
    },
  ];

  for (const ep of extraPatients) {
    const userRes = insertUser.run(ep.email, passwordHash, 'patient');
    const uId = userRes.lastInsertRowid as number;

    insertPatientProfile.run(
      uId,
      ep.name,
      ep.phone,
      ep.dob,
      ep.gender,
      ep.city,
      172,
      74,
      'No allergies',
      `Chronic ${ep.complaint} stiffness under regular physical therapy care.`,
      ep.complaint,
      ep.duration,
      95
    );

    insertPlan.run(uId, ep.plan, 'monthly', 1);

    // Assign tutorials
    const a1 = insertAssignment.run(uId, tut1Id, 3, 10, 'Twice daily.', demoTherapistId, 1);
    const a2 = insertAssignment.run(uId, tut3Id, 2, 8, 'Gentle range of motion.', demoTherapistId, 1);

    // 14 days of pain & exercise history
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const score = Math.max(1, Math.min(10, Math.round(ep.basePain + i * ep.trend)));
      const pEntry = insertPainEntry.run(
        uId,
        dateStr,
        score,
        ep.complaint,
        `Day ${14 - i} protocol followed diligently.`,
        'Morning'
      );

      // Exercise log
      insertExerciseLog.run(uId, a1.lastInsertRowid as number, dateStr, 1, Math.max(0, score - 1));
      insertExerciseLog.run(uId, a2.lastInsertRowid as number, dateStr, 1, Math.max(0, score - 1));

      if (i === 1) {
        insertComment.run(pEntry.lastInsertRowid as number, demoTherapistId, 'Excellent compliance! Keep maintaining this routine.');
      }
    }

    // Link patient to demo therapist via appointment
    insertAppointment.run(
      uId,
      demoTherapistId,
      'in-clinic',
      new Date(today.getTime() - 86400000 * 4).toISOString().split('T')[0],
      '11:00',
      'completed',
      'Initial clinical evaluation and postural assessment',
      'Patient responded very well to soft tissue release.'
    );
  }

  console.log('Seeding completed successfully!');
}

// If run directly via command line
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase().catch((err) => {
    console.error('Error seeding database:', err);
    process.exit(1);
  });
}
