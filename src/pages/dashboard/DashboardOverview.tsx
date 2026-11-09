import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Activity,
  Calendar,
  Dumbbell,
  Search,
  Sparkles,
  ShieldCheck,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MapPin,
  Award
} from 'lucide-react';
import { TherapistDashboard } from '../therapist/TherapistDashboard.tsx';
import { RedeemInviteCard } from '../../components/patient/RedeemInviteCard.tsx';

interface DashboardOverviewProps {
  onNavigate: (view: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-700/15">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 4 Active: Pain Tracking & Exercises</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user.patient_profile?.name || user.therapist_profile?.name || user.email}!
            </h1>
            <p className="text-teal-100 text-sm mt-1 max-w-xl">
              {user.role === 'patient'
                ? 'Your evidence-based physiotherapy and rehabilitation space in Pakistan.'
                : user.role === 'therapist'
                ? 'Your clinical practice portal: monitor patients, prescribe exercise protocols, and manage appointments.'
                : 'Platform Administration Console: overseeing practitioners, appointments, and platform compliance.'}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-white/15 backdrop-blur-xs text-xs font-bold uppercase tracking-wider">
              Role: {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* PATIENT VIEW */}
      {user.role === 'patient' && (
        <>
          {/* Quick Metrics / Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => onNavigate('profile')}
              className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-teal-500 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Profile Health</span>
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-zinc-900 dark:text-white">
                  {user.patient_profile?.completion_percentage || 85}%
                </span>
                <span className="text-xs text-teal-600 font-medium">Complete</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-teal-600 h-1.5 rounded-full"
                  style={{ width: `${user.patient_profile?.completion_percentage || 85}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Primary Complaint</span>
                <Activity className="w-4 h-4 text-teal-600" />
              </div>
              <p className="mt-2 text-lg font-bold text-zinc-900 dark:text-white truncate">
                {user.patient_profile?.primary_complaint_area || 'Lower Back'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Duration: {user.patient_profile?.primary_complaint_duration || 'Ongoing'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Current Plan</span>
                <Award className="w-4 h-4 text-teal-600" />
              </div>
              <p className="mt-2 text-lg font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide">
                {user.plan?.plan || 'Basic'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 capitalize">
                Billed {user.plan?.cycle || 'monthly'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">City & Location</span>
                <MapPin className="w-4 h-4 text-teal-600" />
              </div>
              <p className="mt-2 text-lg font-bold text-zinc-900 dark:text-white">
                {user.patient_profile?.city || 'Karachi'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Local in-clinic therapists available
              </p>
            </div>
          </div>

          {/* Quick Action Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => onNavigate('search')}
              className="text-left p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500 dark:hover:border-teal-500 transition-all shadow-2xs group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Find a Physiotherapist</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Filter verified practitioners in your city by budget (PKR 1,000 - 5,000) and book slots.
              </p>
            </button>

            <button
              onClick={() => onNavigate('pain')}
              className="text-left p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500 dark:hover:border-teal-500 transition-all shadow-2xs group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Log Daily Pain</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Track 0-10 pain levels with body map chips and monitor your 14-day trendline.
              </p>
            </button>

            <button
              onClick={() => onNavigate('exercises')}
              className="text-left p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500 dark:hover:border-teal-500 transition-all shadow-2xs group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Dumbbell className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Rehab Protocol</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Follow guided exercises prescribed by your physiotherapist and maintain your streak.
              </p>
            </button>
          </div>

          {/* Connect Physio Invite Card */}
          <RedeemInviteCard onSuccess={() => {}} />
        </>
      )}

      {/* THERAPIST VIEW */}
      {user.role === 'therapist' && (
        <TherapistDashboard onNavigate={onNavigate} />
      )}

      {/* ADMIN VIEW */}
      {user.role === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500">Therapists Onboarded</span>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">7 Approved</p>
            <p className="text-xs text-emerald-600 mt-1">0 Pending Review</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500">Registered Demo Patients</span>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">4 Active</p>
            <p className="text-xs text-teal-600 mt-1">14-day logs populated</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500">System Status</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">Healthy</p>
            <p className="text-xs text-zinc-500 mt-1">SQLite DB + WAL Mode</p>
          </div>
        </div>
      )}
    </div>
  );
};
