import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Stethoscope, ShieldAlert } from 'lucide-react';

import { TherapistDetails } from '../../components/public/TherapistProfileModal.tsx';

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onSuccess: () => void;
  bookingIntent?: { therapist: TherapistDetails; area?: string } | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister, onSuccess, bookingIntent }) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    const success = await login(email, password);
    if (success) {
      onSuccess();
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    const success = await login(demoEmail, 'Password123!');
    if (success) {
      onSuccess();
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-8 p-6 sm:p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl transition-all">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 text-white font-extrabold text-2xl shadow-lg shadow-teal-600/30 mb-3">
          R
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Welcome to RECURA
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Pakistan's Physiotherapy & Rehabilitation Platform
        </p>
      </div>

      {bookingIntent && (
        <div className="mb-5 p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs">
          <p className="font-bold text-teal-900 dark:text-teal-200">
            Booking with {bookingIntent.therapist.name}
          </p>
          <p className="text-teal-700 dark:text-teal-300 mt-0.5">
            Consultation Fee: <strong>PKR {bookingIntent.therapist.fee.toLocaleString()}</strong> ({bookingIntent.therapist.city})
          </p>
          <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-1">
            Sign in to your account to confirm your slot and finalize your appointment details.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Quick Demo Logins Bar */}
      <div className="mb-6 p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80">
        <p className="text-[11px] font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider mb-2">
          One-Click Demo Access
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('patient@recura.demo')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-white dark:bg-zinc-800 border border-teal-200 dark:border-teal-700 hover:border-teal-500 text-zinc-800 dark:text-zinc-200 text-xs font-semibold shadow-2xs hover:bg-teal-50/50 transition-all"
          >
            <UserCheck className="w-4 h-4 text-teal-600 mb-1" />
            <span>Patient</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('therapist@recura.demo')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-white dark:bg-zinc-800 border border-teal-200 dark:border-teal-700 hover:border-teal-500 text-zinc-800 dark:text-zinc-200 text-xs font-semibold shadow-2xs hover:bg-teal-50/50 transition-all"
          >
            <Stethoscope className="w-4 h-4 text-teal-600 mb-1" />
            <span>Therapist</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@recura.demo')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-white dark:bg-zinc-800 border border-teal-200 dark:border-teal-700 hover:border-teal-500 text-zinc-800 dark:text-zinc-200 text-xs font-semibold shadow-2xs hover:bg-teal-50/50 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-teal-600 mb-1" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@example.com"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/25 transition-all disabled:opacity-60"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
          >
            Register as Patient or Therapist
          </button>
        </p>
      </div>

      <div className="mt-4 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-500" />
        <span>Medical Disclaimer: Recura does not diagnose or replace emergency care.</span>
      </div>
    </div>
  );
};
