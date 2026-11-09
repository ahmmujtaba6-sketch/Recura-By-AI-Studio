import React from 'react';
import { X, Star, MapPin, Calendar, Clock, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AvailabilitySlot {
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface TherapistDetails {
  id: number;
  name: string;
  speciality: string;
  registration_no: string;
  experience: number;
  city: string;
  fee: number;
  bio: string;
  rating: number;
  availability?: AvailabilitySlot[];
}

interface TherapistProfileModalProps {
  therapist: TherapistDetails | null;
  onClose: () => void;
  onBook: (therapist: TherapistDetails) => void;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TherapistProfileModal: React.FC<TherapistProfileModalProps> = ({
  therapist,
  onClose,
  onBook,
}) => {
  if (!therapist) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="therapist-name"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-teal-700 to-teal-600 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold w-fit mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified PMDC / PCP Practitioner</span>
            </div>
            <h2 id="therapist-name" className="text-xl sm:text-2xl font-bold tracking-tight">
              {therapist.name}
            </h2>
            <p className="text-teal-100 text-xs sm:text-sm mt-0.5">{therapist.speciality}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Key Quick Badges */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 text-center">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">City</span>
              <p className="text-xs font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                {therapist.city}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 text-center">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Rating</span>
              <p className="text-xs font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-1 mt-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                {therapist.rating} / 5.0
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 text-center">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Session Fee</span>
              <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                PKR {therapist.fee.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Registration & Experience */}
          <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Registration Number:</span>
              <span className="ml-1.5 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                {therapist.registration_no}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Experience:</span>
              <span className="ml-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                {therapist.experience} years
              </span>
            </div>
          </div>

          {/* Clinical Bio */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
              Clinical Background
            </h4>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50/50 dark:bg-zinc-800/30 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
              {therapist.bio || 'Experienced physical therapist specializing in evidence-based rehabilitation protocols.'}
            </p>
          </div>

          {/* Weekly Availability */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Weekly Clinic & Online Hours</span>
            </h4>
            {therapist.availability && therapist.availability.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {therapist.availability.map((slot, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
                  >
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {WEEKDAYS[slot.weekday]}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                      {slot.start_time} - {slot.end_time}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">Available Monday to Friday by standard appointment.</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-zinc-500">Consultation Fee</p>
            <p className="text-base sm:text-lg font-black text-teal-600 dark:text-teal-400">
              PKR {therapist.fee.toLocaleString()}{' '}
              <span className="text-[11px] font-normal text-zinc-500">/ 30 mins</span>
            </p>
          </div>
          <button
            onClick={() => onBook(therapist)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-teal-600/25 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Book Consultation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
