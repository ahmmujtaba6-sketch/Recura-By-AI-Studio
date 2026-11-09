import React from 'react';
import { CalendarCheck, Users, MapPin, Star, ShieldCheck } from 'lucide-react';

const COUNTERS = [
  {
    label: 'Sessions Completed',
    value: '1,200+',
    subtext: 'In-clinic, home & video calls',
    icon: CalendarCheck,
  },
  {
    label: 'Positive Recovery Rate',
    value: '98%',
    subtext: 'Based on post-session outcome forms',
    icon: Users,
  },
  {
    label: 'Cities Across Pakistan',
    value: '8 Cities',
    subtext: 'Karachi, Lahore, Islamabad, & more',
    icon: MapPin,
  },
  {
    label: 'Average Clinical Rating',
    value: '4.9 / 5.0',
    subtext: 'From verified patient appointments',
    icon: Star,
  },
];

export const TrustCounters: React.FC = () => {
  return (
    <section className="py-12 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Demo numbers
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {COUNTERS.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
                  {c.value}
                </p>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1">
                  {c.label}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {c.subtext}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
