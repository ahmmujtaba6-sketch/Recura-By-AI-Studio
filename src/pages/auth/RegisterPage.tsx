import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserCheck, Stethoscope, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../../types/index.ts';

const CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Peshawar',
  'Quetta',
  'Faisalabad',
  'Multan',
];

const COMPLAINT_AREAS = [
  'Lower Back',
  'Neck & Shoulders',
  'Knee',
  'Shoulder & Rotator Cuff',
  'Ankle & Foot',
  'Hip & Pelvis',
  'Post-Surgery Rehab',
  'Sports Injury',
];

const SPECIALITIES = [
  'Musculoskeletal & Sports Rehabilitation',
  'Orthopaedic & Spine Rehabilitation',
  'Neurological & Stroke Recovery',
  'Sports Injury & Knee Rehab',
  "Women's Health & Pelvic Floor",
  'Geriatric & Joint Mobility',
  'Paediatric & Developmental Physio',
];

import { TherapistDetails } from '../../components/public/TherapistProfileModal.tsx';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
  bookingIntent?: { therapist: TherapistDetails; area?: string } | null;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin, onSuccess, bookingIntent }) => {
  const { register, isLoading } = useAuth();
  const [role, setRole] = useState<'patient' | 'therapist'>('patient');

  // Shared form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+92 3');
  const [city, setCity] = useState(bookingIntent?.therapist.city || CITIES[0]);

  // Patient state
  const [complaintArea, setComplaintArea] = useState(bookingIntent?.area || COMPLAINT_AREAS[0]);
  const [complaintDuration, setComplaintDuration] = useState('1 to 3 months');

  // Therapist state
  const [registrationNo, setRegistrationNo] = useState('');
  const [speciality, setSpeciality] = useState(SPECIALITIES[0]);
  const [experience, setExperience] = useState(5);
  const [fee, setFee] = useState(2500);

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client validation
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    const payload: any = {
      role,
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      city,
    };

    if (role === 'patient') {
      payload.primary_complaint_area = complaintArea;
      payload.primary_complaint_duration = complaintDuration;
    } else {
      if (!registrationNo.trim()) {
        setError('Please enter your PMDC / PCP Registration Number.');
        return;
      }
      payload.registration_no = registrationNo.trim();
      payload.speciality = speciality;
      payload.experience = Number(experience);
      payload.fee = Number(fee);
    }

    const success = await register(payload);
    if (success) {
      onSuccess();
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto my-8 p-6 sm:p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl transition-all">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Create your RECURA Account
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Join Pakistan's leading physiotherapy care marketplace
        </p>

        {bookingIntent && (
          <div className="mt-4 p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs text-left">
            <p className="font-bold text-teal-900 dark:text-teal-200">
              Booking Appointment with {bookingIntent.therapist.name}
            </p>
            <p className="text-teal-700 dark:text-teal-300 mt-0.5">
              Fee: <strong>PKR {bookingIntent.therapist.fee.toLocaleString()}</strong> in {bookingIntent.therapist.city}
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">
              We've pre-selected {bookingIntent.therapist.city} and your complaint area below.
            </p>
          </div>
        )}

        {/* Role toggle */}
        <div className="mt-5 grid grid-cols-2 gap-3 p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setRole('patient')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              role === 'patient'
                ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>I'm a Patient</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('therapist')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              role === 'therapist'
                ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>I'm a Physiotherapist</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
          {error}
        </div>
      )}

      {role === 'therapist' && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            Therapist credentials are professionally verified by Recura administrators. Your profile will be marked "pending" until verified.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={role === 'therapist' ? 'Dr. Sarah Ahmed, PT' : 'Ali Raza'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              City *
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@recura.pk"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Mobile Phone (+92)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Create Password (min 8 chars) *
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Patient specific fields */}
        {role === 'patient' && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Primary Pain / Complaint Area
                </label>
                <select
                  value={complaintArea}
                  onChange={(e) => setComplaintArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {COMPLAINT_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  How long have you had this issue?
                </label>
                <select
                  value={complaintDuration}
                  onChange={(e) => setComplaintDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Less than 2 weeks">Less than 2 weeks (Acute)</option>
                  <option value="2 to 6 weeks">2 to 6 weeks (Subacute)</option>
                  <option value="1 to 3 months">1 to 3 months</option>
                  <option value="Over 3 months">Over 3 months (Chronic)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Therapist specific fields */}
        {role === 'therapist' && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  PMDC / PCP Registration Number *
                </label>
                <input
                  type="text"
                  required
                  value={registrationNo}
                  onChange={(e) => setRegistrationNo(e.target.value)}
                  placeholder="e.g. PK-PMR-90812"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Clinical Speciality *
                </label>
                <select
                  value={speciality}
                  onChange={(e) => setSpeciality(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {SPECIALITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Years of Clinical Practice
                </label>
                <input
                  type="number"
                  min={1}
                  max={45}
                  value={experience}
                  onChange={(e) => setExperience(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Consultation Fee (PKR)
                </label>
                <input
                  type="number"
                  min={1000}
                  max={6000}
                  step={100}
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/25 transition-all disabled:opacity-60"
        >
          {isLoading ? 'Creating account...' : `Complete Registration as ${role === 'therapist' ? 'Physiotherapist' : 'Patient'}`}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Already registered?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
          >
            Sign in to your account
          </button>
        </p>
      </div>
    </div>
  );
};
