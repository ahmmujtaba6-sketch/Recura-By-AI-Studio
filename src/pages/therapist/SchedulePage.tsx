import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Phone,
  User,
  MapPin,
  Video,
  Home
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';

const WEEKDAYS = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
  { id: 0, name: 'Sunday' },
];

export const SchedulePage: React.FC = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'appointments' | 'availability'>('appointments');
  const [aptFilter, setAptFilter] = useState<'requested' | 'upcoming' | 'completed' | 'declined'>('requested');

  // Appointments state
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoadingApts, setIsLoadingApts] = useState(true);

  // Availability state
  const [availabilitySlots, setAvailabilitySlots] = useState<{ weekday: number; start_time: string; end_time: string }[]>([]);
  const [isLoadingAvail, setIsLoadingAvail] = useState(true);
  const [isSavingAvail, setIsSavingAvail] = useState(false);

  // Reschedule & Decline modals
  const [rescheduleApt, setRescheduleApt] = useState<any>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  const [declineApt, setDeclineApt] = useState<any>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [isDeclining, setIsDeclining] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchAvailability();
  }, []);

  const fetchAppointments = async () => {
    setIsLoadingApts(true);
    try {
      const res = await fetch('/api/therapist-workspace/appointments');
      if (!res.ok) throw new Error('Failed to load appointments');
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoadingApts(false);
    }
  };

  const fetchAvailability = async () => {
    setIsLoadingAvail(true);
    try {
      const res = await fetch('/api/therapist-workspace/availability');
      if (!res.ok) throw new Error('Failed to load availability');
      const data = await res.json();
      setAvailabilitySlots(data.availability || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoadingAvail(false);
    }
  };

  const handleSaveAvailability = async () => {
    setIsSavingAvail(true);
    try {
      const res = await fetch('/api/therapist-workspace/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: availabilitySlots }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update availability schedule');
      showToast(data.message || 'Weekly availability saved!', 'success');
      fetchAvailability();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingAvail(false);
    }
  };

  const toggleDayAvailability = (weekday: number) => {
    const exists = availabilitySlots.find((s) => s.weekday === weekday);
    if (exists) {
      setAvailabilitySlots(availabilitySlots.filter((s) => s.weekday !== weekday));
    } else {
      setAvailabilitySlots([
        ...availabilitySlots,
        { weekday, start_time: '09:00', end_time: '17:00' },
      ]);
    }
  };

  const updateDayTimes = (weekday: number, field: 'start_time' | 'end_time', value: string) => {
    setAvailabilitySlots(
      availabilitySlots.map((s) => (s.weekday === weekday ? { ...s, [field]: value } : s))
    );
  };

  const handleAcceptAppointment = async (aptId: number) => {
    try {
      const res = await fetch(`/api/therapist-workspace/appointments/${aptId}/action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept appointment');
      showToast('Appointment confirmed and added to your upcoming schedule!', 'success');
      fetchAppointments();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineApt) return;
    setIsDeclining(true);
    try {
      const res = await fetch(`/api/therapist-workspace/appointments/${declineApt.id}/action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline', reason: declineReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to decline appointment');
      showToast('Consultation request declined.', 'info');
      setDeclineApt(null);
      setDeclineReason('');
      fetchAppointments();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsDeclining(false);
    }
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleApt || !newDate || !newTime) {
      showToast('Please select both a date and time slot', 'error');
      return;
    }
    setIsRescheduling(true);
    try {
      const res = await fetch(`/api/therapist-workspace/appointments/${rescheduleApt.id}/action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          date: newDate,
          time: newTime,
          reason: rescheduleReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reschedule appointment');
      showToast('Appointment updated to new time and patient notified!', 'success');
      setRescheduleApt(null);
      setNewDate('');
      setNewTime('');
      setRescheduleReason('');
      fetchAppointments();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsRescheduling(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (aptFilter === 'declined') {
      return apt.status === 'declined' || apt.status === 'cancelled';
    }
    return apt.status === aptFilter;
  });

  const pendingCount = appointments.filter((a) => a.status === 'requested').length;
  const upcomingCount = appointments.filter((a) => a.status === 'upcoming').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled' || a.status === 'declined').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Practice Calendar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            Schedule & Availability
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
            Configure your active weekly consultation hours and review consultation requests from patients across Pakistan.
          </p>
        </div>

        {/* View Switcher: Appointments vs Availability */}
        <div className="flex p-1 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'appointments'
                ? 'bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Consultations Schedule
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'availability'
                ? 'bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Weekly Availability Slots
          </button>
        </div>
      </div>

      {activeTab === 'appointments' ? (
        <div className="space-y-5">
          {/* Sub-tabs for Appointments */}
          <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <button
              onClick={() => setAptFilter('requested')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                aptFilter === 'requested'
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <span>Pending Requests</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black">
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setAptFilter('upcoming')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                aptFilter === 'upcoming'
                  ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <span>Upcoming Confirmed</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                {upcomingCount}
              </span>
            </button>

            <button
              onClick={() => setAptFilter('completed')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                aptFilter === 'completed'
                  ? 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <span>Completed</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                {completedCount}
              </span>
            </button>

            <button
              onClick={() => setAptFilter('declined')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                aptFilter === 'declined'
                  ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <span>Declined / Cancelled</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                {cancelledCount}
              </span>
            </button>
          </div>

          {/* Appointments List */}
          {isLoadingApts ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs">Loading appointments...</span>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <CalendarCheck className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                No {aptFilter} appointments found
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                {aptFilter === 'requested'
                  ? 'When patients book sessions with you, they will appear here for confirmation.'
                  : `There are currently no sessions in the ${aptFilter} category.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center gap-1">
                        {apt.type === 'video' ? <Video className="w-3 h-3" /> : apt.type === 'home' ? <Home className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        <span>{apt.type} session</span>
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          apt.status === 'requested'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : apt.status === 'upcoming'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : apt.status === 'completed'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-2">
                      {apt.patient_name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Phone: <strong className="text-zinc-700 dark:text-zinc-300">{apt.patient_phone || 'N/A'}</strong> • Area: <strong className="text-teal-600 dark:text-teal-400">{apt.primary_complaint_area || 'Musculoskeletal'}</strong>
                    </p>

                    <div className="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-white">
                        <span>Date: {apt.date}</span>
                        <span className="text-teal-600 dark:text-teal-400">{apt.time} (30 mins)</span>
                      </div>
                      {apt.reason && (
                        <p className="text-zinc-600 dark:text-zinc-300 italic pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                          &ldquo;{apt.reason}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions according to status */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-2 justify-end">
                    {apt.status === 'requested' && (
                      <>
                        <button
                          onClick={() => handleAcceptAppointment(apt.id)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>

                        <button
                          onClick={() => {
                            setRescheduleApt(apt);
                            setNewDate(apt.date);
                            setNewTime(apt.time);
                          }}
                          className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition-colors"
                        >
                          Propose Time
                        </button>

                        <button
                          onClick={() => setDeclineApt(apt)}
                          className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-semibold text-xs transition-colors"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {apt.status === 'upcoming' && (
                      <button
                        onClick={() => {
                          setRescheduleApt(apt);
                          setNewDate(apt.date);
                          setNewTime(apt.time);
                        }}
                        className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition-colors"
                      >
                        Reschedule
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* WEEKLY AVAILABILITY EDITOR */
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                Weekly Clinical Availability
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Patients will only be able to book 30-minute consultation slots within these active hours.
              </p>
            </div>

            <button
              onClick={handleSaveAvailability}
              disabled={isSavingAvail}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all self-start sm:self-auto"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingAvail ? 'Saving Schedule...' : 'Save Availability'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {WEEKDAYS.map((day) => {
              const activeSlot = availabilitySlots.find((s) => s.weekday === day.id);
              const isActive = Boolean(activeSlot);

              return (
                <div
                  key={day.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isActive
                      ? 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700'
                      : 'bg-zinc-50/40 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`day-${day.id}`}
                      checked={isActive}
                      onChange={() => toggleDayAvailability(day.id)}
                      className="w-4 h-4 text-teal-600 rounded-md border-zinc-300 focus:ring-teal-500 cursor-pointer"
                    />
                    <label
                      htmlFor={`day-${day.id}`}
                      className="font-bold text-sm text-zinc-900 dark:text-white cursor-pointer select-none"
                    >
                      {day.name}
                    </label>
                  </div>

                  {isActive ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-500">From</span>
                      <input
                        type="time"
                        value={activeSlot?.start_time || '09:00'}
                        onChange={(e) => updateDayTimes(day.id, 'start_time', e.target.value)}
                        className="py-1.5 px-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-semibold"
                      />
                      <span className="text-zinc-500">to</span>
                      <input
                        type="time"
                        value={activeSlot?.end_time || '17:00'}
                        onChange={(e) => updateDayTimes(day.id, 'end_time', e.target.value)}
                        className="py-1.5 px-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-semibold"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400 italic">Day Off (Unavailable)</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleApt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
              Propose New Appointment Time
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Patient: <strong className="text-zinc-800 dark:text-zinc-200">{rescheduleApt.patient_name}</strong>
            </p>

            <form onSubmit={handleConfirmReschedule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  New Time Slot (30 mins)
                </label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                  required
                >
                  <option value="">Select time</option>
                  {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Reason for Rescheduling
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule adjustment, clinical emergency"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setRescheduleApt(null)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRescheduling}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                >
                  {isRescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {declineApt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
              Decline Consultation Request
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Provide a helpful note to patient <strong className="text-zinc-800 dark:text-zinc-200">{declineApt.patient_name}</strong>.
            </p>

            <form onSubmit={handleConfirmDecline} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Reason for Decline
                </label>
                <textarea
                  rows={3}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g. Schedule fully booked on requested date. Please select an alternate slot."
                  className="w-full py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs resize-none"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setDeclineApt(null)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeclining}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  {isDeclining ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
