import React from 'react';
import { Search, CalendarCheck, Activity, Award, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Find Your Verified Physio',
    description: 'Filter certified practitioners by body complaint area, city, and your PKR budget. View credentials and experience transparently.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Book by Clinic, Home or Video',
    description: 'Pick convenient 30-minute slots. Choose in-clinic consultation, an at-home visit in your city, or telehealth video.',
    icon: CalendarCheck,
  },
  {
    step: '03',
    title: 'Log Daily Pain & Follow Protocols',
    description: 'Track your pain on the 0-10 scale in 30 seconds. Complete customized video exercise routines with sets and reps.',
    icon: Activity,
  },
  {
    step: '04',
    title: 'Recover with Guided Feedback',
    description: 'Your linked physiotherapist monitors your 14-day recovery trendline, comments on progress, and updates your routine.',
    icon: Award,
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-16 bg-white dark:bg-zinc-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Simple 4-Step Pathway
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight mt-1">
            How RECURA Works for You
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            No long clinic queues, no guesswork. Evidence-based physiotherapy recovery in Pakistan from day one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, index) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500 dark:hover:border-teal-500 transition-all hover:shadow-lg group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-zinc-300 dark:text-zinc-700">
                    {s.step}
                  </span>
                </div>

                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
                  {s.title}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {s.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
