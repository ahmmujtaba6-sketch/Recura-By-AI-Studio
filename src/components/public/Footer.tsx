import React from 'react';
import { ShieldAlert, Heart, MapPin } from 'lucide-react';

const CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Peshawar',
  'Quetta',
  'Faisalabad',
  'Multan',
];

export const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-900 text-zinc-400 border-t border-zinc-800 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-teal-400 flex items-center justify-center text-white font-extrabold text-lg">
                R
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                RECURA
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Pakistan's modern physiotherapy and rehabilitation network. Connecting patients with verified practitioners for in-clinic, home, and video care.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-teal-400 font-semibold">
              <Heart className="w-3.5 h-3.5 fill-teal-400" />
              <span>Dedicated to accessible healthcare in Pakistan</span>
            </div>
          </div>

          {/* Cities served */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>Cities Covered</span>
            </h4>
            <ul className="grid grid-cols-2 gap-1.5 text-xs text-zinc-400">
              {CITIES.map((c) => (
                <li key={c} className="hover:text-white transition-colors cursor-pointer">
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {/* Supported Simulated Payments */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Payment Methods (Simulated)
            </h4>
            <div className="space-y-2 text-xs">
              <p className="text-zinc-300 font-semibold">Supported local methods:</p>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200">JazzCash</span>
                <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200">Easypaisa</span>
                <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200">PayPak / Cards</span>
                <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200">Cash at Clinic</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                All transactions are purely simulated for demonstration. Never process real payments.
              </p>
            </div>
          </div>

          {/* Quick links & Contact */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Platform & Legal
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li className="hover:text-white transition-colors cursor-pointer">Patient Guidelines</li>
              <li className="hover:text-white transition-colors cursor-pointer">Therapist Verification Code</li>
              <li className="hover:text-white transition-colors cursor-pointer">Privacy & Data Isolation</li>
              <li className="hover:text-white transition-colors cursor-pointer">Terms of Service</li>
            </ul>
          </div>
        </div>

        {/* Prominent Medical Disclaimer Banner in Footer */}
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-900/60 text-amber-200 text-xs flex items-start gap-3 mb-8">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Mandatory Medical Notice:</strong> Recura does not diagnose or replace emergency care. If you experience sudden chest tightness, progressive lower extremity weakness, loss of bowel or bladder control, or traumatic bone fractures, contact national emergency services (1122) or your nearest tertiary emergency room immediately.
          </p>
        </div>

        <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>© {new Date().getFullYear()} RECURA by Physio Hub. All rights reserved.</p>
          <p>Built with Node.js, Express, React, Tailwind CSS, & SQLite (WAL mode).</p>
        </div>
      </div>
    </footer>
  );
};
