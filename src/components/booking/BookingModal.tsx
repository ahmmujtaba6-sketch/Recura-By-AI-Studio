import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { TherapistDetails } from '../public/TherapistProfileModal.tsx';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Home,
  Video,
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface BookingModalProps {
  therapist: TherapistDetails | null;
  initialArea?: string;
  onClose: () => void;
  onSuccess: () => void;
  onUpgradePlan?: () => void;
}

const CONSULTATION_REASONS = [
  'Initial Clinical Assessment & Diagnosis',
  'Follow-up Rehabilitation Session',
  'Post-Surgical Range of Motion Rehab',
  'Acute Pain Flare-up Treatment',
  'Ergonomic Posture & Workplace Screen',
  'Athletic Return-to-Sport Screening',
];

export const BookingModal: React.FC<BookingModalProps> = ({
  therapist,
  initialArea,
  onClose,
  onSuccess,
  onUpgradePlan,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [sessionType, setSessionType] = useState<'in-clinic' | 'home' | 'video'>('in-clinic');
  const [reason, setReason] = useState<string>(CONSULTATION_REASONS[0]);
  const [notes, setNotes] = useState<string>(initialArea ? `Primary complaint: ${initialArea}` : '');

  const [slots, setSlots] = useState<{ time: string; available: boolean; reason: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const patientPlan = user?.plan?.plan || 'free';

  // Fetch slots whenever therapist or selectedDate changes
  useEffect(() => {
    if (!therapist || !selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedTime('');
      try {
        const res = await fetch(`/api/appointments/slots/${therapist.id}?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || []);
        } else {
          setSlots([]);
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [therapist, selectedDate]);

  if (!therapist) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedDate) {
      setError('Please select an appointment date.');
      return;
    }
    if (!selectedTime) {
      setError('Please select an available 30-minute time slot.');
      return;
    }

    // Plan check
    if (patientPlan === 'free' && sessionType !== 'in-clinic') {
      setError('Home visits and video sessions require a Basic or Premium plan. Please choose In-Clinic or upgrade.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapist_id: therapist.id,
          date: selectedDate,
          time: selectedTime,
          type: sessionType,
          reason,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to book slot.');
        return;
      }

      showToast(
        `Consultation requested with ${therapist.name} for ${selectedDate} at ${selectedTime}. Status: Awaiting confirmation.`,
        'success',
        'Appointment Requested'
      );
      onSuccess();
      onClose();
    } catch (err) {
      setError('Network error while booking appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-700 to-teal-600 text-white flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-200">
              Book Appointment
            </span>
            <h2 id="booking-title" className="text-xl sm:text-2xl font-bold tracking-tight">
              {therapist.name}
            </h2>
            <p className="text-teal-100 text-xs mt-0.5">
              {therapist.speciality} • {therapist.city}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Session Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              1. Consultation Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSessionType('in-clinic')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  sessionType === 'in-clinic'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold ring-2 ring-teal-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Building2 className="w-5 h-5 mx-auto mb-1 text-teal-600 dark:text-teal-400" />
                <span className="text-xs block">In-Clinic</span>
                <span className="text-[10px] text-zinc-400">All plans</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (patientPlan === 'free') {
                    setError('Home visits require a Basic or Premium plan.');
                    return;
                  }
                  setSessionType('home');
                }}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  sessionType === 'home'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold ring-2 ring-teal-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
                } ${patientPlan === 'free' ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <Home className="w-5 h-5 mx-auto mb-1 text-teal-600 dark:text-teal-400" />
                <span className="text-xs block">Home Visit</span>
                <span className="text-[10px] text-zinc-400">
                  {patientPlan === 'free' ? 'Basic+' : 'Included'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (patientPlan === 'free') {
                    setError('Video calls require a Basic or Premium plan.');
                    return;
                  }
                  setSessionType('video');
                }}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  sessionType === 'video'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold ring-2 ring-teal-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
                } ${patientPlan === 'free' ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <Video className="w-5 h-5 mx-auto mb-1 text-teal-600 dark:text-teal-400" />
                <span className="text-xs block">Video Call</span>
                <span className="text-[10px] text-zinc-400">
                  {patientPlan === 'free' ? 'Basic+' : 'Included'}
                </span>
              </button>
            </div>
          </div>

          {/* 2. Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              2. Appointment Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
              <input
                type="date"
                min={todayStr}
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* 3. 30-Minute Time Slot Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>3. Select 30-Minute Slot</span>
              </label>
              <span className="text-[11px] text-zinc-500">
                {slots.filter((s) => s.available).length} open slots
              </span>
            </div>

            {loadingSlots ? (
              <div className="py-6 flex flex-col items-center justify-center text-zinc-400 gap-2">
                <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Checking live schedule...</span>
              </div>
            ) : slots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    onClick={() => {
                      setSelectedTime(s.time);
                      setError('');
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedTime === s.time
                        ? 'border-teal-600 bg-teal-600 text-white shadow-xs'
                        : s.available
                        ? 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-teal-500 hover:bg-teal-50/50'
                        : 'border-zinc-100 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 cursor-not-allowed line-through'
                    }`}
                  >
                    <span>{s.time}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 text-center text-xs text-zinc-500">
                Therapist does not have clinic hours scheduled for this day of the week. Please select another date.
              </div>
            )}
          </div>

          {/* 4. Reason Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              4. Primary Consultation Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {CONSULTATION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Additional Patient Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              5. Clinical Notes or Symptoms (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pain worsens after sitting for 30 minutes. Prior MRI shows mild bulge."
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Summary & Fee */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-zinc-500">Consultation Fee</p>
              <p className="text-base font-extrabold text-teal-600 dark:text-teal-400">
                PKR {therapist.fee.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-zinc-500">Booking Status</p>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                Requested (Awaiting Confirmation)
              </span>
            </div>
          </div>

          {/* Footer Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !selectedTime}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/25 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Registering Appointment...'
                : selectedTime
                ? `Confirm Booking for ${selectedTime}`
                : 'Select an Open Slot Above'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
