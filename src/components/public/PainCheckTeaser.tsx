import React, { useState } from 'react';
import { Activity, ShieldAlert, ArrowRight, Stethoscope, AlertTriangle } from 'lucide-react';

interface PainCheckTeaserProps {
  onFindPhysio: () => void;
}

export const PainCheckTeaser: React.FC<PainCheckTeaserProps> = ({ onFindPhysio }) => {
  const [score, setScore] = useState<number>(4);

  const getPainLevelInfo = (val: number) => {
    if (val === 0) {
      return {
        emoji: '😊',
        label: 'No Pain',
        category: 'Healthy & Mobile',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
        message: 'You have full functional mobility and zero active pain.',
        nextStep: 'Regular posture resets and preventative core exercises are ideal to stay injury-free.',
      };
    }
    if (val <= 3) {
      return {
        emoji: '😐',
        label: 'Mild Discomfort (1 - 3)',
        category: 'Mild',
        color: 'text-teal-600 dark:text-teal-400',
        bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
        message: 'Noticeable tightness, postural stiffness, or dull aching after work or sleep.',
        nextStep: 'A 10-minute guided daily stretching protocol helps prevent muscle spasm from worsening.',
      };
    }
    if (val <= 6) {
      return {
        emoji: '😣',
        label: 'Moderate Pain (4 - 6)',
        category: 'Moderate',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
        message: 'Pain interferes with exercise, lifting, prolonged sitting, or sleep quality.',
        nextStep: 'Early clinical physiotherapy assessment prevents chronic joint compensation and disc irritation.',
      };
    }
    if (val <= 8) {
      return {
        emoji: '😫',
        label: 'High Pain (7 - 8)',
        category: 'High',
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
        message: 'Severe restriction in daily activities, walking, or neck rotation. Movement triggers sharp pain.',
        nextStep: 'Clinical evaluation by a licensed physical therapist is strongly recommended this week.',
      };
    }
    return {
      emoji: '🚨',
      label: 'Severe / Critical (9 - 10)',
      category: 'Severe',
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      message: 'Excruciating pain, possible nerve compression, or acute trauma requiring immediate medical attention.',
      nextStep: 'Seek urgent hospital evaluation if accompanied by loss of bowel/bladder sensation or progressive motor weakness.',
    };
  };

  const info = getPainLevelInfo(score);

  return (
    <section className="py-12 bg-zinc-50 dark:bg-zinc-950/60 border-y border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 text-xs font-bold mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Interactive Self-Check</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            How Much Pain Are You Experiencing Today?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl mx-auto">
            Drag the slider across the standardized 0-10 Visual Analogue Scale (VAS) used by clinical physiotherapists across Pakistan.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
          {/* Slider and Live Display */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl sm:text-5xl select-none" role="img" aria-label={info.label}>
                {info.emoji}
              </span>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-zinc-400">
                  Current Pain Score
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white">
                    {score}
                  </span>
                  <span className={`text-sm sm:text-base font-bold ${info.color}`}>
                    / 10 — {info.label}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onFindPhysio}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Connect with a Physio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Range Input */}
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              aria-label="Pain severity slider from 0 to 10"
              className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-[11px] font-bold text-zinc-400 dark:text-zinc-500 px-1">
              <span>0 (None)</span>
              <span>2 (Mild)</span>
              <span>5 (Moderate)</span>
              <span>8 (Severe)</span>
              <span>10 (Emergency)</span>
            </div>
          </div>

          {/* Dynamic Insight Card */}
          <div className={`mt-6 p-4 rounded-2xl border transition-all ${info.bg}`}>
            <p className="text-xs font-bold text-zinc-900 dark:text-white mb-1">
              Clinical Context:
            </p>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {info.message}
            </p>

            <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex items-start gap-2">
              <span className="text-xs font-extrabold text-teal-700 dark:text-teal-400 shrink-0">
                Recommended Action:
              </span>
              <span className="text-xs text-zinc-600 dark:text-zinc-300">
                {info.nextStep}
              </span>
            </div>
          </div>

          {/* Prominent Medical Disclaimer */}
          <div className="mt-5 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <p className="leading-relaxed">
              <strong>Medical Disclaimer:</strong> Recura does not diagnose or replace emergency care. Always consult a physician for acute unexplained trauma or sudden paralysis.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
