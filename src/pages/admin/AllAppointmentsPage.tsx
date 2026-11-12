import React, { useState, useEffect } from 'react';
import { CalendarCheck, Filter, Video, Home, Building2, User, Clock, MapPin } from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';

interface AdminAppointmentRecord {
  id: number;
  patient_id: number;
  therapist_id: number;
  type: 'in-clinic' | 'home_visit' | 'video';
  date: string;
  time: string;
  status: 'requested' | 'upcoming' | 'completed' | 'cancelled' | 'declined';
  reason: string;
  notes: string;
  patient_name: string;
  patient_phone: string;
  patient_city: string;
  patient_email: string;
  therapist_name: string;
  therapist_city: string;
  speciality: string;
  fee: number;
}

export const AllAppointmentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<AdminAppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/appointments', window.location.origin);
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);
      if (typeFilter !== 'all') url.searchParams.set('type', typeFilter);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      } else {
        showToast('Failed to load appointments', 'error');
      }
    } catch {
      showToast('Error loading appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, typeFilter]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-3.5 h-3.5 text-indigo-500" />;
      case 'home_visit':
        return <Home className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-teal-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case 'completed':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300';
      case 'requested':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse';
      case 'cancelled':
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
      case 'declined':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            System-Wide Consultations Oversight
          </h1>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Monitor all scheduled, completed, and requested tele-rehab sessions across Pakistan.
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['all', 'requested', 'upcoming', 'completed', 'cancelled', 'declined'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 font-semibold">Mode:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="in-clinic">In-Clinic</option>
            <option value="home_visit">Home Visit</option>
            <option value="video">Video Call</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading platform appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
          No appointments found matching filter criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <div
              key={a.id}
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0 mt-0.5">
                  {getTypeIcon(a.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-zinc-900 dark:text-white">
                      {a.patient_name}
                    </span>
                    <span className="text-xs text-zinc-400">with</span>
                    <span className="font-bold text-sm text-teal-600 dark:text-teal-400">
                      {a.therapist_name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(a.status)}`}>
                      {a.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{a.date} at {a.time}</span>
                    </span>
                    <span>•</span>
                    <span className="capitalize">{a.type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{a.patient_city}</span>
                    </span>
                    <span>•</span>
                    <span className="font-bold text-teal-600">PKR {a.fee.toLocaleString()}</span>
                  </div>

                  {a.reason && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 italic">
                      &ldquo;{a.reason}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right text-[11px] text-zinc-400 shrink-0 self-start md:self-auto">
                <p>Speciality: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{a.speciality}</span></p>
                <p className="mt-0.5 font-mono">Mobile: {a.patient_phone || 'N/A'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
