# RECURA by Physio Hub 🇵🇰

RECURA is the dedicated physiotherapy care and rehabilitation marketplace for Pakistan. Patients can discover verified physiotherapists matching their budget (PKR), log daily pain scores, follow video-guided exercise tutorials, book in-clinic/home/video sessions, and subscribe to care plans. Registered physiotherapists can manage their practice, schedule availability, prescribe exercise protocols, review patient recovery trends, and provide clinical feedback.

---

## 1. Quick Start & Run Steps

### Development Mode
Runs the unified full-stack Node.js + Express backend with Vite middleware on port 3000:
```bash
npm run dev
```

### Database Seeding
To manually re-run database migrations and seed all demo accounts, therapists, and 14-day patient logs:
```bash
npm run seed
```

### Production Build & Run
```bash
npm run build
npm start
```

### Code Quality Check
```bash
npm run lint
```

---

## 2. Environment Variables

Create or configure `.env` (refer to `.env.example`):

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server listening port | `3000` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `APP_URL` | Application root URL | `http://localhost:3000` |
| `GEMINI_API_KEY` | Optional AI capabilities key | Injected runtime secret |

---

## 3. Demo Accounts & Credentials

All demo accounts are pre-seeded with the password: **`Password123!`**

| Role | Email | Password | Details |
|---|---|---|---|
| **Patient** | `patient@recura.demo` | `Password123!` | Hamza Abbasi (Karachi), Basic Plan, Lower Back pain, 14-day history |
| **Therapist** | `therapist@recura.demo` | `Password123!` | Dr. Ayesha Khan, PT (Karachi, Musculoskeletal & Sports Rehab, Fee: PKR 2,500, Approved) |
| **Admin** | `admin@recura.demo` | `Password123!` | Platform Administrator with full oversight |

### Additional Approved Therapists (Pre-seeded across Pakistan)
1. **Dr. Bilal Tariq, PT** (`dr.bilal@recura.demo`) - Orthopaedic & Spine Rehab, Lahore, Fee: PKR 3,200
2. **Dr. Fatima Zahra, PT** (`dr.fatima@recura.demo`) - Neurological & Stroke Recovery, Islamabad, Fee: PKR 3,000
3. **Dr. Usman Farooq, PT** (`dr.usman@recura.demo`) - Sports Injury & Knee Rehab, Rawalpindi, Fee: PKR 2,200
4. **Dr. Zainab Bibi, PT** (`dr.zainab@recura.demo`) - Women's Health & Pelvic Floor, Peshawar, Fee: PKR 2,800
5. **Dr. Hamza Malik, PT** (`dr.hamza@recura.demo`) - Geriatric & Joint Mobility, Faisalabad, Fee: PKR 1,800
6. **Dr. Nida Rashid, PT** (`dr.nida@recura.demo`) - Paediatric & Developmental Physio, Multan, Fee: PKR 2,600

### Linked Demo Patients (with 14 days of pain and exercise logs)
- `ali.patient@recura.demo` - Ali Ahmed (Karachi, Premium Plan, Lower Back)
- `sara.patient@recura.demo` - Sara Siddiqui (Karachi, Premium Plan, Neck & Shoulders)
- `tariq.patient@recura.demo` - Tariq Mahmood (Karachi, Basic Plan, Shoulder)

*(A fast "Switch Demo" helper is available on the navigation bar in development to jump between roles instantly).*

---

## 4. Relational Data Model

Database engine: **SQLite via `better-sqlite3` with WAL mode and foreign key constraints enabled** (stored at `./data/recura.db`).

- **`users`**: `id`, `email` (unique), `password_hash`, `role` (`patient`, `therapist`, `admin`), `created_at`
- **`sessions`**: `id`, `user_id` (FK `users`), `token` (unique), `expires_at`, `created_at`
- **`patient_profiles`**: `id`, `user_id` (unique FK `users`), `name`, `phone`, `dob`, `gender`, `city`, `height`, `weight`, `allergies`, `medical_history`, `primary_complaint_area`, `primary_complaint_duration`, `completion_percentage`, `created_at`, `updated_at`
- **`therapists`**: `id`, `user_id` (unique FK `users`), `name`, `speciality`, `registration_no` (unique), `experience`, `city`, `fee` (PKR), `bio`, `status` (`pending`, `approved`, `rejected`), `rating`, `created_at`, `updated_at`
- **`availability`**: `id`, `therapist_id` (FK `therapists`), `weekday` (0-6), `start_time`, `end_time`
- **`appointments`**: `id`, `patient_id` (FK `users`), `therapist_id` (FK `therapists`), `type` (`in-clinic`, `home`, `video`), `date`, `time`, `status` (`requested`, `upcoming`, `completed`, `cancelled`, `declined`), `reason`, `notes`, `created_at`, `updated_at`
- **`pain_entries`**: `id`, `patient_id` (FK `users`), `date`, `score` (0-10), `area`, `note` (max 140 chars), `time_of_day`, `created_at`, `UNIQUE(patient_id, date)`
- **`tutorials`**: `id`, `therapist_id` (FK `therapists`), `title`, `category`, `minutes`, `steps` (JSON array), `safety_note`, `video_url`, `created_at`
- **`assignments`**: `id`, `patient_id` (FK `users`), `tutorial_id` (FK `tutorials`), `sets`, `reps`, `note`, `assigned_by` (FK `therapists`), `active`, `created_at`
- **`exercise_logs`**: `id`, `patient_id` (FK `users`), `assignment_id` (FK `assignments`), `date`, `done`, `pain_after`, `created_at`
- **`plans`**: `id`, `patient_id` (unique FK `users`), `plan` (`free`, `basic`, `premium`), `cycle` (`monthly`, `yearly`), `started_at`, `video_calls_used`, `period_start`, `created_at`, `updated_at`
- **`payments`**: `id`, `patient_id` (FK `users`), `kind` (`session`, `plan`), `amount`, `method` (`jazzcash`, `easypaisa`, `card`, `cash`), `status`, `transaction_id`, `created_at`
- **`messages`**: `id`, `sender_id` (FK `users`), `receiver_id` (FK `users`), `text`, `created_at`, `read_at`
- **`notifications`**: `id`, `user_id` (FK `users`), `type`, `title`, `body`, `read`, `created_at`
- **`reviews`**: `id`, `appointment_id` (unique FK `appointments`), `patient_id`, `therapist_id`, `rating`, `comment`, `created_at`
- **`comments`**: `id`, `pain_entry_id` (FK `pain_entries`), `therapist_id` (FK `therapists`), `text`, `created_at`
- **`support_tickets`**: `id`, `user_id`, `name`, `email`, `category`, `message`, `status`, `created_at`
- **`invites`**: `id`, `code` (unique), `therapist_id` (FK `therapists`), `patient_name`, `patient_phone`, `used`, `created_at`
- **`goals`**: `id`, `patient_id` (FK `users`), `title`, `target_date`, `status`, `created_at`

---

## 5. Plans & Feature Matrix

| Feature | Free (PKR 0) | Basic (PKR 1,499/mo, 1,249 yearly) | Premium (PKR 2,999/mo, 2,499 yearly) |
|---|---|---|---|
| Pain log history | last 7 days | Full history | Full history |
| Assigned exercises | Yes, no tutorials | With video tutorials | With video tutorials |
| Booking | In-clinic only | In-clinic + Home visit | In-clinic + Home visit + Priority badge |
| Chat with therapist | ❌ | ✅ | ✅ |
| Video calls | 0 | 2 per month | 4 per month |
| Therapist comments on progress | ❌ | ❌ | ✅ |
| Progress report export | ❌ | ❌ | ✅ |

*Yearly subscription discount: 2 months free.*

---

## 6. Phase Implementation Status

- ✅ **Phase 1: Foundation** - Database migrations, SQLite with WAL mode, bcrypt session-cookie auth, role-based layouts, dark mode toggle, global toasts, demo switcher.
- ✅ **Phase 2: Public Landing & No-Login Search** - Sticky navbar, hero card with PKR budget slider (1,000 - 5,000), VAS 0-10 pain teaser, how it works, features grid, plans pricing with monthly/yearly toggle, testimonials carousel, trust counters, FAQ accordion, footer with 1122 medical disclaimer.
- ✅ **Phase 3: Patient Basics, Search & Booking** - Patient clinical profile with completion percentage meter, complaint-driven recommended therapist matching, search page with filters/budget/sorting, 30-minute slot grid booking with double-booking prevention, appointments tabbed management (Upcoming, Completed, Cancelled), rescheduling, cancellation with reason, .ics export, verified review submission.
- ✅ **Phase 4: Pain Tracking & Exercises** - Daily VAS 0-10 slider, body area chips, 140-char notes, time-of-day tags, 14-day SVG trendline with weekly delta, score >= 8 clinical notifications, consecutive day exercise streak calculator, past 7-day progress row, daily exercise completion logging with pain-after prompt, gated video tutorials, plan upgrade prompt for Free tier.
- ✅ **Phase 5: Therapist Workspace** - Clinical dashboard with KPIs, "Patients Needing Clinical Attention" card (flags patients with pain >= 8 in last 3 days or no exercise logged for 3+ days), patient roster with 7-day SVG sparklines and exercise compliance rates, patient clinical chart modal (biometrics, BMI, 14-day history, prescriptions), weekly availability scheduler, consultation requests management (Accept, Decline with reason, Propose new time / Reschedule), exercise routine library with 3-6 step editor and video links, exercise prescription modal, and single-use patient invite codes (REC-XXXX) with formatted WhatsApp/SMS templates.

---

## 7. Medical Disclaimer

> **Medical Disclaimer**: Recura does not diagnose or replace emergency medical care. Consult emergency medical services immediately for acute traumatic injuries, loss of bladder control, or sudden numbness. Call Rescue 1122 in Pakistan for medical emergencies.
