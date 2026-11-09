import React from 'react';
import {
  ShieldCheck,
  CreditCard,
  LineChart,
  Video,
  Home,
  MessageSquare,
  Sparkles
} from 'lucide-react';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Verified PMDC / PCP Physiotherapists',
    description: 'Every practitioner undergoes license verification. Browse specialized spine, sports, stroke, and pelvic health experts.',
  },
  {
    icon: CreditCard,
    title: 'Transparent PKR Pricing',
    description: 'Fixed consultation fees (PKR 1,500 – 4,000) with simulated payment support for JazzCash, Easypaisa, Debit/Credit Card, and Cash.',
  },
  {
    icon: LineChart,
    title: 'Daily Pain Tracking & SVG Trendline',
    description: 'Track pain levels daily from 0-10 with body area chips. Automated notifications trigger when pain spikes to 8+.',
  },
  {
    icon: Video,
    title: 'Prescribed Exercise Video Tutorials',
    description: 'Never guess your rehabilitation form again. Follow step-by-step video instructions with reps, sets, and safety boundaries.',
  },
  {
    icon: Home,
    title: 'In-Clinic, Home Visits & Video Calls',
    description: 'Choose what fits your mobility. Visit a local clinic in 8 Pakistani cities or have certified care in your living room.',
  },
  {
    icon: MessageSquare,
    title: 'Direct Therapist Chat & Clinical Notes',
    description: 'Message your assigned physical therapist, receive progress comments, and export printable progress reports.',
  },
];

export const FeaturesGrid: React.FC = () => {
  return (
    <section className="py-16 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Comprehensive Platform</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Designed for Modern Physiotherapy Care
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Everything patients and physical therapists in Pakistan need for structured, evidence-guided musculoskeletal recovery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-teal-500 dark:hover:border-teal-500 transition-all hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
