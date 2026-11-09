import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  BadgeAlert,
  Sparkles,
  Phone,
  CalendarCheck,
  Dumbbell,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { PatientClinicalModal } from '../../components/therapist/PatientClinicalModal.tsx';
import { AssignExerciseModal } from '../../components/therapist/AssignExerciseModal.tsx';

interface TherapistDashboardProps {
  onNavigate: (tab: string) => void;
}

export const TherapistDashboard: React.FC<TherapistDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Quick Action Reschedule modal state
  const [rescheduleApt, setRescheduleApt] = useState<any>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Quick Action Decline modal state
  const [declineApt, setDeclineApt] = useState<any>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [isDeclining, setIsDeclining] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/therapist-workspace/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard data');
      const data = await res.json();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAppointment = async (aptId: number) => {
    try {
      const res = await fetch(`/api/therapist-workspace/appointments/${aptId}/action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept consultation');
      showToast('Appointment confirmed and patient notified!', 'success', 'Confirmed');
      fetchDashboard();
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
      if (!res.ok) throw new Error(data.error || 'Failed to decline consultation');
      showToast('Consultation declined.', 'info');
      setDeclineApt(null);
      setDeclineReason('');
      fetchDashboard();
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
      if (!res.ok) throw new Error(data.error || 'Failed to reschedule');
      showToast('Appointment rescheduled and patient notified!', 'success', 'Rescheduled');
      setRescheduleApt(null);
      setNewDate('');
      setNewTime('');
      setRescheduleReason('');
      fetchDashboard();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsRescheduling(false);
    }
  };

  const metrics = dashboardData?.metrics || {
    todayAppointmentsCount: 0,
    pendingRequestsCount: 0,
    totalPatientsCount: 0,
    needingAttentionCount: 0,
  };

  const needingAttention = dashboardData?.needingAttention || [];
  const todayAppointments = dashboardData?.todayAppointments || [];
  const pendingAppointments = dashboardData?.pendingAppointments || [];
  const therapistProfile = dashboardData?.therapist || user?.therapist_profile;

  const isApproved = therapistProfile?.status === 'approved';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 text-white shadow-lg shadow-teal-900/15">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 5: Clinical Workspace & Patient Supervision</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Khush Amdeed, {therapistProfile?.name || 'Doctor'}
            </h1>
            <p className="text-teal-100 text-sm mt-1 max-w-2xl leading-relaxed">
              Clinical practice console: supervise patient recovery trajectories, review VAS pain spikes, manage consultations, and prescribe exercise protocols.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span
              className={`px-3.5 py-1.5 rounded-xl backdrop-blur-xs text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isApproved
                  ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/30'
                  : 'bg-amber-500/30 text-amber-100 border border-amber-400/30'
              }`}
            >
              {isApproved ? <ShieldCheck className="w-4 h-4" /> : <BadgeAlert className="w-4 h-4" />}
              <span>{isApproved ? 'Verified Practitioner' : 'Verification Pending'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Practitioner Approval Status Alert (if pending) */}
      {!isApproved && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <BadgeAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-sm">Account Registration Under Review</p>
            <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              Your PMDC/PCP credentials (Reg: {therapistProfile?.registration_no}) are currently queued for verification by the Recura Administrative Board. While pending, your profile is hidden from visitor search, but you can configure your exercise library and manage practice schedules.
            </p>
          </div>
        </div>
      )}

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('schedule')}
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500 cursor-pointer shadow-2xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Today&apos;s Sessions</span>
            <Clock className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white mt-2">
            {metrics.todayAppointmentsCount}
          </p>
          <p className="text-[11px] text-teal-600 font-medium mt-1">
            {dashboardData?.today || new Date().toISOString().split('T')[0]}
          </p>
        </div>

        <div
          onClick={() => onNavigate('schedule')}
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500 cursor-pointer shadow-2xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Pending Requests</span>
            <CalendarCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {metrics.pendingRequestsCount}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Requires confirmation</p>
        </div>

        <div
          onClick={() => onNavigate('patients')}
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500 cursor-pointer shadow-2xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Linked Patients</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white mt-2">
            {metrics.totalPatientsCount}
          </p>
          <p className="text-[11px] text-teal-600 font-medium mt-1">Active caseload</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Clinical Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {metrics.needingAttentionCount}
          </p>
          <p className="text-[11px] text-rose-500 font-medium mt-1">High pain / Inactive logs</p>
        </div>
      </div>

      {/* PATIENTS NEEDING CLINICAL ATTENTION CARD */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/50 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              Patients Needing Clinical Attention
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              {needingAttention.length} Flagged
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Criteria: VAS Pain &ge; 8 in last 3 days OR No exercise logs for 3+ days
          </span>
        </div>

        {needingAttention.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>All linked patients are maintaining steady recovery without acute pain spikes.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {needingAttention.map((item: any, idx: number) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  item.flagType === 'high_pain'
                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                    : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                        {item.name}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.flagType === 'high_pain'
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {item.flagType === 'high_pain' ? 'High Pain Alert' : 'Rehab Inactivity'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 font-medium">
                      {item.reason}
                    </p>

                    <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span>Area: <strong className="text-teal-600 dark:text-teal-400">{item.complaint}</strong></span>
                      <span>•</span>
                      <span>{item.phone || 'No phone'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPatientId(item.patientId)}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-teal-700 dark:text-teal-300 border border-zinc-200 dark:border-zinc-700 text-xs font-bold shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <span>View Chart</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Pending Booking Requests & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests Column */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                  Pending Consultation Requests
                </h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {pendingAppointments.length} New
              </span>
            </div>

            {pendingAppointments.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                No pending requests. New patient booking requests will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAppointments.map((apt: any) => (
                  <div
                    key={apt.id}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-900 dark:text-white">
                            {apt.patient_name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full capitalize bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-semibold">
                            {apt.type}
                          </span>
                        </div>
                        <p className="text-zinc-500 mt-1">
                          Date: <strong className="text-zinc-800 dark:text-zinc-200">{apt.date}</strong> at <strong className="text-zinc-800 dark:text-zinc-200">{apt.time}</strong>
                        </p>
                        {apt.reason && (
                          <p className="text-zinc-600 dark:text-zinc-300 mt-1 italic">
                            Reason: &ldquo;{apt.reason}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-700/50 flex flex-wrap gap-2 justify-end">
                      <button
                        onClick={() => handleAcceptAppointment(apt.id)}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
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
                        className="px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition-colors"
                      >
                        Propose Time
                      </button>

                      <button
                        onClick={() => setDeclineApt(apt)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-semibold text-xs transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
            <button
              onClick={() => onNavigate('schedule')}
              className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1"
            >
              <span>View Full Schedule & Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Today's Schedule Column */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                  Today&apos;s Clinical Sessions
                </h3>
              </div>
              <span className="text-xs font-semibold text-zinc-400">
                {dashboardData?.today}
              </span>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                No sessions booked for today. You can invite patients or adjust weekly availability.
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayAppointments.map((apt: any) => (
                  <div
                    key={apt.id}
                    className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-1 rounded-lg">
                        {apt.time}
                      </span>
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-white">
                          {apt.patient_name}
                        </div>
                        <span className="text-[11px] text-zinc-500 capitalize">
                          {apt.type} • {apt.primary_complaint_area || 'Physio'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        apt.status === 'upcoming'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : apt.status === 'completed'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Fee: PKR {therapistProfile?.fee?.toLocaleString() || '2,500'} / session
            </span>
            <button
              onClick={() => onNavigate('schedule')}
              className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1"
            >
              <span>Manage Availability</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('patients')}
          className="text-left p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500 transition-all shadow-2xs group"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Patient Roster</h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            View 14-day history, sparklines & compliance
          </p>
        </button>

        <button
          onClick={() => setIsAssignModalOpen(true)}
          className="text-left p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500 transition-all shadow-2xs group"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <Dumbbell className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Prescribe Exercise</h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Assign sets, reps & clinical instructions
          </p>
        </button>

        <button
          onClick={() => onNavigate('library')}
          className="text-left p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500 transition-all shadow-2xs group"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Exercise Library</h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Create 3-6 step video exercise routines
          </p>
        </button>

        <button
          onClick={() => onNavigate('invites')}
          className="text-left p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500 transition-all shadow-2xs group"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <UserPlus className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Invite Patients</h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Generate REC-XXXX codes & SMS template
          </p>
        </button>
      </div>

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
                  placeholder="e.g. Schedule adjustment, clinic maintenance"
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
                  placeholder="e.g. Currently unavailable due to clinical commitments. Please book for tomorrow afternoon."
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

      {/* Patient Clinical Modal */}
      <PatientClinicalModal
        patientId={selectedPatientId}
        isOpen={Boolean(selectedPatientId)}
        onClose={() => setSelectedPatientId(null)}
        onRefresh={fetchDashboard}
      />

      {/* Assign Exercise Modal */}
      <AssignExerciseModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={fetchDashboard}
      />
    </div>
  );
};
