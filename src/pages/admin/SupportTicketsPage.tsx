import React, { useState, useEffect } from 'react';
import { LifeBuoy, CheckCircle2, Clock, AlertCircle, MessageSquare, Filter } from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';

interface SupportTicket {
  id: number;
  user_id: number | null;
  name: string;
  email: string;
  category: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
}

export const SupportTicketsPage: React.FC = () => {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/tickets', window.location.origin);
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);
      if (categoryFilter !== 'all') url.searchParams.set('category', categoryFilter);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      } else {
        showToast('Failed to load tickets', 'error');
      }
    } catch {
      showToast('Error loading support tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter]);

  const handleUpdateStatus = async (id: number, status: 'open' | 'in_progress' | 'resolved') => {
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        showToast(`Ticket #${id} marked as ${status}`, 'success');
        fetchTickets();
      } else {
        showToast('Failed to update ticket status', 'error');
      }
    } catch {
      showToast('Network error updating ticket', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      case 'resolved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            Help Center & Support Ticket Triage
          </h1>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Review patient, practitioner, and visitor inquiries regarding bookings, payments, and platform policies.
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['all', 'open', 'in_progress', 'resolved'].map((s) => (
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
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 font-semibold">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="billing">Billing & Payments</option>
            <option value="appointments">Appointments</option>
            <option value="exercises">Exercises</option>
            <option value="therapist_verification">PMR Verification</option>
            <option value="other">General / Other</option>
          </select>
        </div>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading support queue...</div>
      ) : tickets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
          No support tickets in this queue.
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
                    #{t.id}
                  </span>
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">
                    {t.name}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">({t.email})</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(t.status)}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 capitalize">
                    {t.category.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  {t.message}
                </p>

                <p className="text-[10px] text-zinc-400">
                  Submitted: {new Date(t.created_at).toLocaleString('en-PK')}
                </p>
              </div>

              {/* Status Actions */}
              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                {t.status !== 'in_progress' && t.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(t.id, 'in_progress')}
                    className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold transition-colors"
                  >
                    Start Triage
                  </button>
                )}
                {t.status !== 'resolved' ? (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(t.id, 'resolved')}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    Resolve Ticket
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(t.id, 'open')}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 text-xs font-medium transition-colors"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
