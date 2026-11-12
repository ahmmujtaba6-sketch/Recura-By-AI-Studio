import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  CalendarCheck,
  CreditCard,
  LifeBuoy,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';

interface AdminDashboardOverviewProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/metrics');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
      } else {
        showToast('Failed to load admin metrics', 'error');
      }
    } catch {
      showToast('Error loading platform metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-zinc-500">Loading platform metrics...</p>
      </div>
    );
  }

  const m = metrics || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              Executive Platform Administration
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300">
              Super Admin
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Real-time oversight of practitioner credential approvals, tele-rehab bookings, revenue ledgers, and support across Pakistan.
          </p>
        </div>

        {m.pendingApprovals > 0 && (
          <button
            type="button"
            onClick={() => onNavigate('approvals')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2 animate-pulse self-start sm:self-auto"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{m.pendingApprovals} Pending Approvals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Users</span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white">{m.totalUsers || 0}</p>
          <p className="text-[11px] text-zinc-500 mt-1">{m.totalPatients || 0} Patients / {m.totalTherapists || 0} Physios</p>
        </div>

        {/* Pending Approvals */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">PMR Approvals</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{m.pendingApprovals || 0}</p>
          <p className="text-[11px] text-zinc-500 mt-1">Pending clinical verification</p>
        </div>

        {/* Consultations */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Appointments</span>
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white">{m.totalAppointments || 0}</p>
          <p className="text-[11px] text-zinc-500 mt-1">Clinic, Home & Video sessions</p>
        </div>

        {/* Revenue */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Simulated PKR</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 truncate">
            PKR {(m.totalSimulatedRevenuePKR || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Via JazzCash / Easypaisa</p>
        </div>

        {/* Open Tickets */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Open Tickets</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <LifeBuoy className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white">{m.openTickets || 0}</p>
          <p className="text-[11px] text-zinc-500 mt-1">User inquiries & support</p>
        </div>

        {/* Quick Review */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Quick Action</span>
            <p className="text-xs font-bold mt-1">Therapist Verification</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('approvals')}
            className="mt-3 py-1.5 px-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-between transition-colors"
          >
            <span>Review</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Two Column Section: Plan Distribution & City Reach */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscriptions by Plan */}
        <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Active Plan Subscriptions</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Distribution of patient subscription tiers across RECURA</p>
            </div>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>

          <div className="space-y-3 mt-4">
            {m.planDistribution?.map((p: any) => {
              const tierName = p.plan.toUpperCase();
              const badgeClass =
                p.plan === 'premium'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : p.plan === 'basic'
                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';

              return (
                <div key={p.plan} className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${badgeClass}`}>
                      {tierName}
                    </span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-300">
                      {p.plan === 'premium' ? 'PKR 2,999/mo' : p.plan === 'basic' ? 'PKR 1,499/mo' : 'Free Tier'}
                    </span>
                  </div>
                  <span className="text-sm font-black text-zinc-900 dark:text-white">
                    {p.count} Patients
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* City Coverage */}
        <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Approved Practitioner Coverage</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Approved physiotherapists across 8 target cities in Pakistan</p>
            </div>
            <MapPin className="w-4 h-4 text-teal-600" />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {m.cityDistribution?.map((c: any) => (
              <div key={c.city} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{c.city}</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                  {c.count} Physios
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('approvals')}
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500 transition-colors text-left flex items-center justify-between group"
        >
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-teal-600 transition-colors">
              Therapist Approvals
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Verify PMR licenses & credentials</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-teal-600 transition-colors" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('users')}
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500 transition-colors text-left flex items-center justify-between group"
        >
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-teal-600 transition-colors">
              User Directory
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Manage accounts & roles</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-teal-600 transition-colors" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('appointments')}
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500 transition-colors text-left flex items-center justify-between group"
        >
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-teal-600 transition-colors">
              All Consultations
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Clinic, home & video sessions</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-teal-600 transition-colors" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('tickets')}
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500 transition-colors text-left flex items-center justify-between group"
        >
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-teal-600 transition-colors">
              Support Triage
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Resolve inquiries & tickets</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-teal-600 transition-colors" />
        </button>
      </div>
    </div>
  );
};
