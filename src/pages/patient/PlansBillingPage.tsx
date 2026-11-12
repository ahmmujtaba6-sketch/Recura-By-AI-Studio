import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  X as CloseIcon,
  Sparkles,
  ShieldCheck,
  Video,
  MessageSquare,
  Activity,
  Calendar,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { VideoCallModal } from '../../components/video/VideoCallModal.tsx';

export const PlansBillingPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlanData, setCurrentPlanData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<'basic' | 'premium'>('basic');
  const [selectedMethod, setSelectedMethod] = useState<'jazzcash' | 'easypaisa' | 'card'>('jazzcash');
  const [accountNumber, setAccountNumber] = useState('+92 300 1234567');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Video call launch state
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoRoomUrl, setVideoRoomUrl] = useState('');
  const [callsRemaining, setCallsRemaining] = useState<number | undefined>(undefined);

  useEffect(() => {
    fetchPlanData();
    fetchPayments();
  }, []);

  const fetchPlanData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/plans/current');
      if (res.ok) {
        const data = await res.json();
        setCurrentPlanData(data);
      }
    } catch (err) {
      console.error('Error fetching plan data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/plans/payments');
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setTotalSpent(data.totalSpent || 0);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  };

  const handleOpenUpgrade = (plan: 'basic' | 'premium') => {
    setSelectedPlanForUpgrade(plan);
    setIsUpgradeModalOpen(true);
  };

  const handleConfirmSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/plans/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlanForUpgrade,
          cycle,
          method: selectedMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process subscription');

      showToast(data.message || 'Plan upgraded successfully!', 'success', 'Subscription Active');
      setIsUpgradeModalOpen(false);
      fetchPlanData();
      fetchPayments();
      if (refreshUser) refreshUser();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartQuickVideo = async () => {
    try {
      const res = await fetch('/api/video/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.upgradeRequired) {
          showToast(data.error, 'info', 'Upgrade Plan Required');
          handleOpenUpgrade('basic');
          return;
        }
        throw new Error(data.error || 'Failed to start video call');
      }

      setVideoRoomUrl(data.roomUrl);
      setCallsRemaining(data.callsRemaining);
      setVideoModalOpen(true);
      fetchPlanData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const activePlanName = currentPlanData?.plan || user?.plan?.plan || 'free';
  const callsUsed = currentPlanData?.video_calls_used || 0;
  const callsLimit = currentPlanData?.video_calls_limit || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Care Plans & Subscriptions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            Plans & Feature Access
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
            Choose a care plan that fits your recovery trajectory. Upgrade anytime to unlock video tele-physio sessions, direct therapist chat, and complete 14-day history.
          </p>
        </div>

        {/* Quick Launch Video */}
        <button
          onClick={handleStartQuickVideo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all self-start sm:self-auto"
        >
          <Video className="w-4 h-4" />
          <span>Launch Tele-Physio Call</span>
        </button>
      </div>

      {/* Active Subscription Status Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-teal-800 to-teal-900 text-white shadow-xl shadow-teal-900/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
            Active Subscription
          </span>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl sm:text-3xl font-black capitalize tracking-tight">
              {activePlanName} Plan
            </h2>
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase">
              Billed {currentPlanData?.cycle || 'monthly'}
            </span>
          </div>
          <p className="text-teal-100 text-xs mt-2 max-w-xl">
            {activePlanName === 'premium'
              ? 'Unrestricted access: Full history, video calls (4/mo), direct chat, therapist progress reviews, and clinical PDF exports.'
              : activePlanName === 'basic'
              ? 'Comprehensive access: Full pain history, video tutorials, 2 video calls/mo, and direct therapist chat.'
              : 'Essential access: Last 7 days pain tracking, in-clinic bookings, and assigned exercise protocols.'}
          </p>
        </div>

        {/* Usage Meters */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 min-w-[240px] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-teal-200">Video Calls Used</span>
            <span className="font-black text-white">
              {callsUsed} / {callsLimit} calls
            </span>
          </div>
          <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-2 rounded-full transition-all"
              style={{
                width: callsLimit > 0 ? `${Math.min(100, (callsUsed / callsLimit) * 100)}%` : '0%',
              }}
            />
          </div>
          <span className="text-[11px] text-teal-200/80 block">
            {callsLimit > callsUsed ? `${callsLimit - callsUsed} sessions remaining this billing month` : activePlanName === 'free' ? 'Upgrade to unlock video calls' : 'All calls used for this cycle'}
          </span>
        </div>
      </div>

      {/* Monthly / Yearly Billing Toggle */}
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="inline-flex items-center p-1 rounded-2xl bg-zinc-200 dark:bg-zinc-800">
          <button
            onClick={() => setCycle('monthly')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              cycle === 'monthly'
                ? 'bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setCycle('yearly')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              cycle === 'yearly'
                ? 'bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <span>Yearly Billing</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
              2 Months Free
            </span>
          </button>
        </div>
        <p className="text-[11px] text-zinc-500">
          {cycle === 'yearly' ? '⚡ Save over 16% on annual rehabilitation coverage' : 'Simple monthly billing, cancel anytime'}
        </p>
      </div>

      {/* Plans Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FREE PLAN */}
        <div
          className={`p-6 rounded-3xl bg-white dark:bg-zinc-900 border flex flex-col justify-between transition-all ${
            activePlanName === 'free'
              ? 'border-teal-500 shadow-md ring-2 ring-teal-500/20'
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xl text-zinc-900 dark:text-white">Free</h3>
              {activePlanName === 'free' && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                  Current Plan
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Foundational pain logging & local visits.</p>

            <div className="my-5 flex items-baseline gap-1">
              <span className="text-3xl font-black text-zinc-900 dark:text-white">PKR 0</span>
              <span className="text-xs text-zinc-400">/ forever</span>
            </div>

            <ul className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Last 7 days pain history</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Assigned exercises (text guidelines)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>In-clinic bookings</span>
              </li>
              <li className="flex items-center gap-2 text-zinc-400 opacity-60">
                <CloseIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>No video tutorials</span>
              </li>
              <li className="flex items-center gap-2 text-zinc-400 opacity-60">
                <CloseIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>No chat with therapist</span>
              </li>
              <li className="flex items-center gap-2 text-zinc-400 opacity-60">
                <CloseIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>0 video call sessions</span>
              </li>
              <li className="flex items-center gap-2 text-zinc-400 opacity-60">
                <CloseIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>No therapist progress comments</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              disabled={activePlanName === 'free'}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold disabled:opacity-50"
            >
              {activePlanName === 'free' ? 'Active Tier' : 'Standard'}
            </button>
          </div>
        </div>

        {/* BASIC PLAN */}
        <div
          className={`p-6 rounded-3xl bg-white dark:bg-zinc-900 border flex flex-col justify-between transition-all relative ${
            activePlanName === 'basic'
              ? 'border-teal-500 shadow-md ring-2 ring-teal-500/20'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-teal-400/60'
          }`}
        >
          <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
            Most Popular
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xl text-zinc-900 dark:text-white">Basic</h3>
              {activePlanName === 'basic' && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                  Current Plan
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Guided video rehab & tele-physio.</p>

            <div className="my-5 flex items-baseline gap-1">
              <span className="text-3xl font-black text-teal-600 dark:text-teal-400">
                PKR {cycle === 'yearly' ? '1,249' : '1,499'}
              </span>
              <span className="text-xs text-zinc-400">/ month</span>
            </div>

            <ul className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span><strong>Full 14-day</strong> pain history & trendline</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span><strong>Video exercise tutorials</strong> unlocked</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>In-clinic + Home visit bookings</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span><strong>Direct Chat</strong> with assigned therapist</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span><strong>2 Video calls</strong> per month included</span>
              </li>
              <li className="flex items-center gap-2 text-zinc-400 opacity-60">
                <CloseIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Therapist progress comments (Premium)</span>
              </li>
              <li className="flex items-center gap-2 text-zinc-400 opacity-60">
                <CloseIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Progress report export (Premium)</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {activePlanName === 'basic' ? (
              <button
                disabled
                className="w-full py-2.5 px-4 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleOpenUpgrade('basic')}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Upgrade to Basic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* PREMIUM PLAN */}
        <div
          className={`p-6 rounded-3xl bg-white dark:bg-zinc-900 border flex flex-col justify-between transition-all ${
            activePlanName === 'premium'
              ? 'border-teal-500 shadow-md ring-2 ring-teal-500/20'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-teal-400/60'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xl text-zinc-900 dark:text-white">Premium</h3>
              {activePlanName === 'premium' && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                  Current Plan
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Full clinical oversight & priority slots.</p>

            <div className="my-5 flex items-baseline gap-1">
              <span className="text-3xl font-black text-teal-600 dark:text-teal-400">
                PKR {cycle === 'yearly' ? '2,499' : '2,999'}
              </span>
              <span className="text-xs text-zinc-400">/ month</span>
            </div>

            <ul className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Full unlimited pain history</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Full video exercise library</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span><strong>Priority Booking</strong> badge</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Direct therapist messaging & attachments</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span><strong>4 Video calls</strong> per month included</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span><strong>Therapist feedback & progress notes</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span><strong>Printable Progress Report Export</strong></span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {activePlanName === 'premium' ? (
              <button
                disabled
                className="w-full py-2.5 px-4 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleOpenUpgrade('premium')}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Upgrade to Premium</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment History & Invoices */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              Billing & Simulated Transaction Records
            </h3>
            <p className="text-xs text-zinc-500">
              Total Recorded Spending: <strong>PKR {totalSpent.toLocaleString()}</strong>
            </p>
          </div>
          <span className="text-[11px] text-zinc-400">
            All payments simulated via Pakistan mobile wallets & cards
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            No payments on record yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Transaction ID</th>
                  <th className="pb-3">Item / Service</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Amount (PKR)</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="py-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                      {p.transaction_id}
                    </td>
                    <td className="py-3 font-semibold text-zinc-900 dark:text-white capitalize">
                      {p.kind === 'plan' ? 'Subscription Care Plan' : 'Clinical Consultation Session'}
                    </td>
                    <td className="py-3 uppercase text-[11px] text-zinc-600 dark:text-zinc-300">
                      {p.method}
                    </td>
                    <td className="py-3 font-bold text-zinc-900 dark:text-white">
                      PKR {p.amount.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-400">
                      {p.created_at?.split(' ')[0] || p.created_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPGRADE / CHECKOUT MODAL */}
      {isUpgradeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 mb-1.5">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Simulated Checkout</span>
            </div>

            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              Upgrade to {selectedPlanForUpgrade.toUpperCase()} Plan
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Select your payment method. Payments are simulated in the Pakistan test sandbox.
            </p>

            <form onSubmit={handleConfirmSubscription} className="mt-5 space-y-4">
              {/* Plan & Cycle Summary Box */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-zinc-800 dark:text-zinc-200">
                  <span>Selected Tier:</span>
                  <span className="capitalize text-teal-600 dark:text-teal-400 font-bold">
                    {selectedPlanForUpgrade} Plan ({cycle})
                  </span>
                </div>
                <div className="flex items-center justify-between text-base font-black text-zinc-900 dark:text-white pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  <span>Total Due (PKR):</span>
                  <span>
                    PKR{' '}
                    {selectedPlanForUpgrade === 'basic'
                      ? cycle === 'yearly' ? '14,988' : '1,499'
                      : cycle === 'yearly' ? '29,988' : '2,999'}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'jazzcash', label: 'JazzCash' },
                    { id: 'easypaisa', label: 'Easypaisa' },
                    { id: 'card', label: 'Card' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id as any)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        selectedMethod === m.id
                          ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Method Details */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  {selectedMethod === 'card' ? 'Card Number (Simulated)' : 'Mobile Account Number'}
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={selectedMethod === 'card' ? '4111 2222 3333 4444' : '+92 300 1234567'}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300">
                🔒 <strong>Simulation Mode</strong>: Recura simulates mobile wallet transactions for Pakistan demonstration. No real currency is charged.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>{isSubmitting ? 'Authorizing...' : 'Authorize Upgrade'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        roomUrl={videoRoomUrl}
        callsRemaining={callsRemaining}
        maxCalls={currentPlanData?.video_calls_limit}
      />
    </div>
  );
};
