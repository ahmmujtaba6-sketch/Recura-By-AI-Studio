import React, { useState } from 'react';
import { Check, X, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface PlansPreviewProps {
  onSelectPlan: (plan: 'free' | 'basic' | 'premium') => void;
}

export const PlansPreview: React.FC<PlansPreviewProps> = ({ onSelectPlan }) => {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      id: 'free',
      name: 'Free Recovery',
      price: 0,
      yearlyPrice: 0,
      description: 'Ideal for tracking initial recovery and finding local in-clinic physical therapists.',
      badge: 'Starter',
      popular: false,
      features: [
        { name: 'Pain log history', value: 'Last 7 days' },
        { name: 'Assigned exercises', value: 'Yes (Text only)' },
        { name: 'Exercise video tutorials', value: false },
        { name: 'Booking options', value: 'In-clinic only' },
        { name: 'Chat with therapist', value: false },
        { name: 'Included video calls', value: '0 calls' },
        { name: 'Therapist progress comments', value: false },
        { name: 'Printable progress report', value: false },
      ],
    },
    {
      id: 'basic',
      name: 'Basic Care',
      price: 1499,
      yearlyPrice: 1249,
      description: 'Comprehensive guided recovery with HD video exercise routines and in-app therapist chat.',
      badge: 'Most Popular',
      popular: true,
      features: [
        { name: 'Pain log history', value: 'Full history' },
        { name: 'Assigned exercises', value: 'Full protocols' },
        { name: 'Exercise video tutorials', value: true },
        { name: 'Booking options', value: 'In-clinic + Home visit' },
        { name: 'Chat with therapist', value: true },
        { name: 'Included video calls', value: '2 per month' },
        { name: 'Therapist progress comments', value: false },
        { name: 'Printable progress report', value: false },
      ],
    },
    {
      id: 'premium',
      name: 'Premium Rehab',
      price: 2999,
      yearlyPrice: 2499,
      description: 'Full clinical partnership with direct practitioner comments and formal printable recovery reports.',
      badge: 'Best Value',
      popular: false,
      features: [
        { name: 'Pain log history', value: 'Full history' },
        { name: 'Assigned exercises', value: 'Full protocols' },
        { name: 'Exercise video tutorials', value: true },
        { name: 'Booking options', value: 'In-clinic + Home + Priority' },
        { name: 'Chat with therapist', value: true },
        { name: 'Included video calls', value: '4 per month' },
        { name: 'Therapist progress comments', value: true },
        { name: 'Printable progress report', value: true },
      ],
    },
  ];

  return (
    <section className="py-16 bg-white dark:bg-zinc-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Transparent Subscription Plans
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight mt-1">
            Care Plans Tailored for Your Recovery
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Cancel anytime. All plans include access to Pakistan's verified physiotherapist directory.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="mt-6 inline-flex items-center p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                cycle === 'monthly'
                  ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setCycle('yearly')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                cycle === 'yearly'
                  ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <span>Yearly</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold">
                2 Months Free
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((p) => {
            const currentPrice = cycle === 'yearly' ? p.yearlyPrice : p.price;
            return (
              <div
                key={p.id}
                className={`relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl border transition-all ${
                  p.popular
                    ? 'bg-white dark:bg-zinc-900 border-teal-500 shadow-xl ring-2 ring-teal-500/20'
                    : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 shadow-xs'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-teal-600 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md">
                    {p.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{p.name}</h3>
                    {!p.popular && (
                      <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-200/60 dark:bg-zinc-700/60">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white">
                        PKR {currentPrice.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-zinc-500">
                        / month
                      </span>
                    </div>
                    {cycle === 'yearly' && p.price > 0 && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        Billed annually (save PKR {((p.price - p.yearlyPrice) * 12).toLocaleString()}/yr)
                      </p>
                    )}
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-3 mb-8 text-xs">
                    {p.features.map((feat, idx) => {
                      const isNegative = feat.value === false;
                      return (
                        <li key={idx} className="flex items-start gap-2.5">
                          {isNegative ? (
                            <X className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0 mt-0.5" />
                          ) : (
                            <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={
                              isNegative
                                ? 'text-zinc-400 dark:text-zinc-500 line-through'
                                : 'text-zinc-700 dark:text-zinc-200 font-medium'
                            }
                          >
                            {feat.name}:{' '}
                            <strong className="font-semibold text-zinc-900 dark:text-white">
                              {typeof feat.value === 'boolean'
                                ? feat.value
                                  ? 'Included'
                                  : 'Not included'
                                : feat.value}
                            </strong>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPlan(p.id as any)}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all ${
                    p.popular
                      ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/25'
                      : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100'
                  }`}
                >
                  <span>Select {p.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
