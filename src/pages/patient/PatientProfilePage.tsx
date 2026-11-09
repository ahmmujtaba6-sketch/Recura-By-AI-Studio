import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Activity,
  Heart,
  Stethoscope,
  Sparkles,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { TherapistDetails, TherapistProfileModal } from '../../components/public/TherapistProfileModal.tsx';
import { BookingModal } from '../../components/booking/BookingModal.tsx';

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

const DURATIONS = [
  'Less than 2 weeks',
  '2 to 6 weeks',
  '1 to 3 months',
  'Over 3 months',
];

export const PatientProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [city, setCity] = useState(CITIES[0]);
  const [height, setHeight] = useState<number>(0);
  const [weight, setWeight] = useState<number>(0);
  const [allergies, setAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [complaintArea, setComplaintArea] = useState(COMPLAINT_AREAS[0]);
  const [complaintDuration, setComplaintDuration] = useState(DURATIONS[0]);

  const [completionPercentage, setCompletionPercentage] = useState<number>(35);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Recommended therapist driven by primary complaint
  const [recommendedTherapist, setRecommendedTherapist] = useState<TherapistDetails | null>(null);
  const [selectedTherapistForModal, setSelectedTherapistForModal] = useState<TherapistDetails | null>(null);
  const [selectedTherapistForBooking, setSelectedTherapistForBooking] = useState<TherapistDetails | null>(null);

  // Load profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/patients/profile');
        if (res.ok) {
          const data = await res.json();
          const p = data.profile;
          if (p) {
            setName(p.name || '');
            setPhone(p.phone || '');
            setDob(p.dob || '');
            setGender(p.gender || 'Male');
            setCity(p.city || CITIES[0]);
            setHeight(p.height || 0);
            setWeight(p.weight || 0);
            setAllergies(p.allergies || '');
            setMedicalHistory(p.medical_history || '');
            setComplaintArea(p.primary_complaint_area || COMPLAINT_AREAS[0]);
            setComplaintDuration(p.primary_complaint_duration || DURATIONS[0]);
            setCompletionPercentage(p.completion_percentage || 35);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch recommended therapist when complaintArea or city changes
  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const res = await fetch('/api/patients/recommended-therapist');
        if (res.ok) {
          const data = await res.json();
          setRecommendedTherapist(data.recommended);
        }
      } catch (err) {
        console.error('Failed to fetch recommendation:', err);
      }
    };

    if (user?.role === 'patient') {
      fetchRecommendation();
    }
  }, [complaintArea, city, user]);

  // Client validation
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters.';
    }

    if (phone.trim()) {
      const phoneRegex = /^(\+92|0)?3[0-9]{9}$/;
      if (!phoneRegex.test(phone.trim().replace(/\s+/g, ''))) {
        newErrors.phone = 'Valid Pakistan mobile required (e.g. +92 300 1234567 or 03001234567).';
      }
    }

    if (dob) {
      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime()) || dobDate >= new Date()) {
        newErrors.dob = 'Date of birth cannot be today or in the future.';
      }
    }

    if (height < 0 || height > 250) {
      newErrors.height = 'Height must be between 50 and 250 cm.';
    }

    if (weight < 0 || weight > 300) {
      newErrors.weight = 'Weight must be between 20 and 300 kg.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix the validation errors before saving.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/patients/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          dob,
          gender,
          city,
          height: Number(height),
          weight: Number(weight),
          allergies: allergies.trim(),
          medical_history: medicalHistory.trim(),
          primary_complaint_area: complaintArea,
          primary_complaint_duration: complaintDuration,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to update profile.', 'error');
        return;
      }

      setCompletionPercentage(data.profile.completion_percentage);
      showToast('Profile and medical details saved successfully!', 'success', 'Profile Updated');
      refreshUser();
    } catch (err) {
      showToast('Network error while saving profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading your clinical profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header & Completion Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center font-black text-2xl shadow-inner">
              {name ? name[0].toUpperCase() : 'P'}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                {name || 'Patient Profile'}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-2">
                <span>{user?.email}</span>
                <span>•</span>
                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  {user?.plan?.plan ? `${user.plan.plan.toUpperCase()} Plan` : 'Free Plan'}
                </span>
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Profile Completion
            </span>
            <div className="flex items-baseline sm:justify-end gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                {completionPercentage}%
              </span>
              <span className="text-xs text-zinc-400">Complete</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* RECOMMENDED THERAPIST CARD DRIVEN BY PRIMARY COMPLAINT */}
      {recommendedTherapist && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/30 border border-teal-200 dark:border-teal-800/80 shadow-xs">
          <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Recommended Specialist for {complaintArea}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {recommendedTherapist.name}
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                {recommendedTherapist.speciality} • {recommendedTherapist.city} • Rating: {recommendedTherapist.rating} / 5.0
              </p>
              <p className="text-xs text-teal-700 dark:text-teal-400 font-semibold mt-1">
                Consultation Fee: PKR {recommendedTherapist.fee.toLocaleString()} (30 mins)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedTherapistForModal(recommendedTherapist)}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50"
              >
                View Bio
              </button>
              <button
                type="button"
                onClick={() => setSelectedTherapistForBooking(recommendedTherapist)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20"
              >
                Book Recommended
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
            Personal & Contact Information
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Used by your physical therapist for appointments and emergency identification.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Full Legal Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.name ? 'border-rose-500' : 'border-zinc-300 dark:border-zinc-700'
              }`}
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address (Account ID)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 text-xs sm:text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Mobile Phone (+92) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.phone ? 'border-rose-500' : 'border-zinc-300 dark:border-zinc-700'
                }`}
              />
            </div>
            {errors.phone && <p className="text-[11px] text-rose-500 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Date of Birth *
            </label>
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.dob ? 'border-rose-500' : 'border-zinc-300 dark:border-zinc-700'
              }`}
            />
            {errors.dob && <p className="text-[11px] text-rose-500 mt-1">{errors.dob}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              City in Pakistan *
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clinical Complaint Section */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
            Primary Musculoskeletal Complaint
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            This pre-selects your recommended therapist and guides your customized exercise plan.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Primary Complaint Area *
              </label>
              <select
                value={complaintArea}
                onChange={(e) => setComplaintArea(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                Complaint Duration *
              </label>
              <select
                value={complaintDuration}
                onChange={(e) => setComplaintDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Biometrics & Medical Background */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
            Biometrics & Clinical Background
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                min={0}
                max={250}
                value={height || ''}
                onChange={(e) => setHeight(Number(e.target.value))}
                placeholder="e.g. 175"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                min={0}
                max={300}
                value={weight || ''}
                onChange={(e) => setWeight(Number(e.target.value))}
                placeholder="e.g. 70"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Known Allergies or Sensitivities
            </label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Latex sensitivity, adhesive tape reaction"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Medical & Surgical History
            </label>
            <textarea
              rows={3}
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="e.g. Lumbar microdiscectomy in 2023, hypertension under control, sitting desk job 8 hours daily."
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Save CTA */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Changes update your active clinical record immediately.
          </p>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/25 transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </form>

      {/* Profile & Booking Modals */}
      <TherapistProfileModal
        therapist={selectedTherapistForModal}
        onClose={() => setSelectedTherapistForModal(null)}
        onBook={(t) => {
          setSelectedTherapistForModal(null);
          setSelectedTherapistForBooking(t);
        }}
      />

      <BookingModal
        therapist={selectedTherapistForBooking}
        initialArea={complaintArea}
        onClose={() => setSelectedTherapistForBooking(null)}
        onSuccess={() => setSelectedTherapistForBooking(null)}
      />
    </div>
  );
};
