import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  Search,
  Filter,
  MapPin,
  Briefcase,
  Award,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';

interface TherapistApprovalRecord {
  id: number;
  user_id: number;
  name: string;
  speciality: string;
  registration_no: string;
  experience: number;
  city: string;
  fee: number;
  bio: string;
  status: 'pending' | 'approved' | 'rejected';
  rating: number;
  email: string;
  registered_at: string;
}

export const TherapistApprovalsPage: React.FC = () => {
  const { showToast } = useToast();
  const [therapists, setTherapists] = useState<TherapistApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Reject Modal State
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTherapists = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/therapists', window.location.origin);
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);
      if (searchTerm.trim()) url.searchParams.set('search', searchTerm.trim());

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setTherapists(data.therapists || []);
      } else {
        showToast('Failed to load therapists', 'error');
      }
    } catch {
      showToast('Error loading therapist data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTherapists();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTherapists();
  };

  const handleUpdateStatus = async (id: number, nextStatus: 'approved' | 'rejected', reason?: string) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/admin/therapists/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, reason }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          nextStatus === 'approved'
            ? 'Physiotherapist PMR credentials approved and verified!'
            : 'Therapist registration rejected.',
          'success'
        );
        setRejectingId(null);
        setRejectReason('');
        fetchTherapists();
      } else {
        showToast(data.error || 'Failed to update therapist status', 'error');
      }
    } catch {
      showToast('Network error updating status', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            Therapist PMR Credential Approvals
          </h1>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Review practitioner licensing, Pakistan Physical Therapy Council / PMR registrations, and approve marketplace listings.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Registrations' },
            { id: 'pending', label: 'Pending Review' },
            { id: 'approved', label: 'Verified & Approved' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, city, PMR reg..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 w-52 sm:w-64"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Therapists List */}
      {loading ? (
        <div className="p-12 text-center text-zinc-500 text-xs">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span>Verifying credentials directory...</span>
        </div>
      ) : therapists.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
          <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-30 text-teal-600" />
          <p className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">No therapists found</p>
          <p className="text-[11px] mt-0.5">No profiles match the selected status filter or search query.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {therapists.map((t) => (
            <div
              key={t.id}
              className={`p-5 rounded-2xl border transition-all ${
                t.status === 'pending'
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 shadow-xs ring-1 ring-amber-300/40'
                  : t.status === 'approved'
                  ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                  : 'bg-zinc-50/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 opacity-80'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">
                      {t.name}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        t.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                          : t.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {t.status === 'pending' ? '⏳ Pending Approval' : t.status === 'approved' ? '✓ Approved' : '✕ Rejected'}
                    </span>
                    <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
                      PMR: {t.registration_no}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{t.speciality}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{t.city}, Pakistan</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{t.experience} Years Exp</span>
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      Fee: PKR {t.fee.toLocaleString()} / session
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed pt-1">
                    {t.bio}
                  </p>

                  <div className="pt-2 text-[11px] text-zinc-400">
                    Account: <span className="font-mono text-zinc-600 dark:text-zinc-300">{t.email}</span> • Registered on {new Date(t.registered_at).toLocaleDateString('en-PK')}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                  {t.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(t.id, 'approved')}
                        disabled={isSubmitting}
                        className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve PMR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(t.id)}
                        disabled={isSubmitting}
                        className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : t.status === 'approved' ? (
                    <button
                      type="button"
                      onClick={() => setRejectingId(t.id)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-rose-600 text-xs font-semibold transition-colors"
                    >
                      Revoke Approval
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(t.id, 'approved')}
                      className="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold transition-colors"
                    >
                      Re-Approve Credentials
                    </button>
                  )}
                </div>
              </div>

              {/* Reject Reason Modal / Input */}
              {rejectingId === t.id && (
                <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700 space-y-2">
                  <label className="block text-xs font-semibold text-rose-700 dark:text-rose-400">
                    Reason for rejection / license inquiry (will be sent to practitioner):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g., PMR registration number not found in Council records"
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(t.id, 'rejected', rejectReason)}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors"
                    >
                      Confirm Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason('');
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
