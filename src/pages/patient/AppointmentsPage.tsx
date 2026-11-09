import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  Home,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  CalendarPlus,
  Star,
  MessageSquare,
  X,
  Send
} from 'lucide-react';

interface AppointmentItem {
  id: number;
  patient_id: number;
  therapist_id: number;
  therapist_name: string;
  therapist_speciality: string;
  therapist_city: string;
  therapist_fee: number;
  type: 'in-clinic' | 'home' | 'video';
  date: string;
  time: string;
  status: 'requested' | 'upcoming' | 'completed' | 'cancelled' | 'declined';
  reason: string;
  notes: string;
  review_id?: number;
  review_rating?: number;
  review_comment?: string;
}

export const AppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');

  // Reschedule Modal State
  const [rescheduleAppt, setRescheduleAppt] = useState<AppointmentItem | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Cancel Modal State
  const [cancelAppt, setCancelAppt] = useState<AppointmentItem | null>(null);
  const [cancelReason, setCancelReason] = useState('Schedule conflict');
  const [isCancelling, setIsCancelling] = useState(false);

  // Review Modal State
  const [reviewAppt, setReviewAppt] = useState<AppointmentItem | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Fetch slots for reschedule when date changes
  useEffect(() => {
    if (!rescheduleAppt || !newDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setNewTime('');
      try {
        const res = await fetch(`/api/appointments/slots/${rescheduleAppt.therapist_id}?date=${newDate}`);
        if (res.ok) {
          const data = await res.json();
          setRescheduleSlots(data.slots || []);
        }
      } catch (err) {
        console.error('Error fetching reschedule slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [rescheduleAppt, newDate]);

  // Reschedule submit
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleAppt || !newDate || !newTime) {
      showToast('Please select both a new date and open slot.', 'error');
      return;
    }

    setIsRescheduling(true);
    try {
      const res = await fetch(`/api/appointments/${rescheduleAppt.id}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate, time: newTime }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to reschedule appointment.', 'error');
        return;
      }

      showToast(`Appointment rescheduled to ${newDate} at ${newTime}.`, 'success', 'Rescheduled');
      setRescheduleAppt(null);
      fetchAppointments();
    } catch (err) {
      showToast('Error rescheduling appointment.', 'error');
    } finally {
      setIsRescheduling(false);
    }
  };

  // Cancel submit
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelAppt) return;

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/appointments/${cancelAppt.id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!res.ok) {
        showToast('Failed to cancel appointment.', 'error');
        return;
      }

      showToast('Appointment successfully cancelled.', 'info', 'Cancelled');
      setCancelAppt(null);
      fetchAppointments();
    } catch (err) {
      showToast('Error cancelling appointment.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  // Add to calendar (.ics download)
  const handleDownloadCalendar = (appointmentId: number) => {
    window.location.href = `/api/appointments/${appointmentId}/calendar`;
    showToast('Downloaded calendar invite (.ics).', 'success');
  };

  // Review submit
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAppt) return;

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/appointments/${reviewAppt.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to post review.', 'error');
        return;
      }

      showToast('Review submitted successfully! Thank you for your feedback.', 'success');
      setReviewAppt(null);
      fetchAppointments();
    } catch (err) {
      showToast('Error submitting review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Tab filtering
  const upcomingList = appointments.filter((a) => a.status === 'requested' || a.status === 'upcoming');
  const completedList = appointments.filter((a) => a.status === 'completed');
  const cancelledList = appointments.filter((a) => a.status === 'cancelled' || a.status === 'declined');

  const currentList =
    activeTab === 'upcoming' ? upcomingList : activeTab === 'completed' ? completedList : cancelledList;

  const getStatusBadge = (status: AppointmentItem['status']) => {
    switch (status) {
      case 'requested':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
            <Clock className="w-3 h-3" /> Awaiting Confirmation
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300">
            <XCircle className="w-3 h-3" /> Declined
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          My Physiotherapy Appointments
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your consultation schedule, reschedule slots, download calendar invites, and review completed care.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'upcoming'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <span>Upcoming</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'upcoming' ? 'bg-teal-800 text-white' : 'bg-zinc-200 dark:bg-zinc-700'
            }`}
          >
            {upcomingList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'completed'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <span>Completed</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'completed' ? 'bg-teal-800 text-white' : 'bg-zinc-200 dark:bg-zinc-700'
            }`}
          >
            {completedList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('cancelled')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'cancelled'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <span>Cancelled / Declined</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'cancelled' ? 'bg-teal-800 text-white' : 'bg-zinc-200 dark:bg-zinc-700'
            }`}
          >
            {cancelledList.length}
          </span>
        </button>
      </div>

      {/* Appointment Cards List */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading appointments...</span>
        </div>
      ) : currentList.length > 0 ? (
        <div className="space-y-4">
          {currentList.map((appt) => (
            <div
              key={appt.id}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 shrink-0">
                    {appt.type === 'video' ? (
                      <Video className="w-6 h-6" />
                    ) : appt.type === 'home' ? (
                      <Home className="w-6 h-6" />
                    ) : (
                      <Building2 className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white">
                      {appt.therapist_name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {appt.therapist_speciality} • {appt.therapist_city}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5">
                  {getStatusBadge(appt.status)}
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                    PKR {appt.therapist_fee?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Schedule and Reason details */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-zinc-400 uppercase font-semibold text-[10px] block mb-0.5">
                    Date & Time
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span>{appt.date}</span>
                    <span>at</span>
                    <span>{appt.time}</span>
                  </div>
                </div>

                <div>
                  <span className="text-zinc-400 uppercase font-semibold text-[10px] block mb-0.5">
                    Format
                  </span>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                    {appt.type === 'in-clinic'
                      ? 'In-Clinic Consultation'
                      : appt.type === 'home'
                      ? 'Home Physical Therapy'
                      : 'Telehealth Video Call'}
                  </p>
                </div>

                <div>
                  <span className="text-zinc-400 uppercase font-semibold text-[10px] block mb-0.5">
                    Reason
                  </span>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {appt.reason}
                  </p>
                </div>
              </div>

              {/* Patient/Clinical Notes if present */}
              {appt.notes && (
                <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/20 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/40 whitespace-pre-line">
                  {appt.notes}
                </div>
              )}

              {/* Review display if completed and reviewed */}
              {appt.review_rating && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(appt.review_rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="font-bold text-amber-900 dark:text-amber-200 ml-1">
                      Your Rating: {appt.review_rating} / 5
                    </span>
                  </div>
                  {appt.review_comment && (
                    <p className="text-zinc-700 dark:text-zinc-300 italic">
                      "{appt.review_comment}"
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadCalendar(appt.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-colors"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-teal-600" />
                    <span>Add to Calendar (.ics)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Reschedule & Cancel for upcoming */}
                  {(appt.status === 'requested' || appt.status === 'upcoming') && (
                    <>
                      <button
                        onClick={() => {
                          setRescheduleAppt(appt);
                          setNewDate(appt.date);
                          setNewTime(appt.time);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 text-xs font-semibold border border-teal-200 dark:border-teal-800 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reschedule</span>
                      </button>

                      <button
                        onClick={() => setCancelAppt(appt)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-900 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {/* Review for completed if not yet reviewed */}
                  {appt.status === 'completed' && !appt.review_rating && (
                    <button
                      onClick={() => {
                        setReviewAppt(appt);
                        setRating(5);
                        setComment('');
                      }}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <Star className="w-3.5 h-3.5 fill-white" />
                      <span>Write Review</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center max-w-md mx-auto">
          <Calendar className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-900 dark:text-white text-base">
            No {activeTab} appointments
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {activeTab === 'upcoming'
              ? 'You have no scheduled consultations. Book a session with a verified physiotherapist in your city.'
              : `No appointments found in ${activeTab}.`}
          </p>
        </div>
      )}

      {/* 1. RESCHEDULE MODAL */}
      {rescheduleAppt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setRescheduleAppt(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
              Reschedule Appointment
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              With {rescheduleAppt.therapist_name} • Updates your existing booking.
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Choose New Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Choose 30-Minute Slot
                </label>
                {loadingSlots ? (
                  <p className="text-xs text-zinc-400 py-3 text-center">Loading open slots...</p>
                ) : rescheduleSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1">
                    {rescheduleSlots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setNewTime(s.time)}
                        className={`p-2 rounded-xl text-xs font-semibold border ${
                          newTime === s.time
                            ? 'border-teal-600 bg-teal-600 text-white'
                            : s.available
                            ? 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-teal-500'
                            : 'border-zinc-100 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed line-through'
                        }`}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 py-2">No slots on this date.</p>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isRescheduling || !newTime}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {isRescheduling ? 'Rescheduling...' : `Confirm for ${newTime || '...'}`}
                </button>
                <button
                  type="button"
                  onClick={() => setRescheduleAppt(null)}
                  className="py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CANCEL MODAL */}
      {cancelAppt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
              Cancel Appointment
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              With {cancelAppt.therapist_name} on {cancelAppt.date} at {cancelAppt.time}.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Reason for Cancellation *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Schedule conflict">Schedule conflict</option>
                  <option value="Medical emergency">Medical emergency</option>
                  <option value="Feeling better / symptoms resolved">Feeling better / symptoms resolved</option>
                  <option value="Transportation or travel issue">Transportation or travel issue</option>
                  <option value="Other personal reason">Other personal reason</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
                <button
                  type="button"
                  onClick={() => setCancelAppt(null)}
                  className="py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold"
                >
                  Keep Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. REVIEW MODAL */}
      {reviewAppt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setReviewAppt(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
              Review {reviewAppt.therapist_name}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Your verified rating updates this practitioner's public score across Pakistan.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${star <= rating ? 'fill-amber-400' : 'text-zinc-300 dark:text-zinc-700'}`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 ml-2">
                    {rating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Clinical Feedback & Experience
                </label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details on diagnosis clarity, bedside manner, exercise guidance, and pain relief..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingReview || !comment.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Post Clinical Review'}
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAppt(null)}
                  className="py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
