import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import {
  Activity,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  Sparkles,
  Calendar,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
  Info,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';

const BODY_AREAS = [
  'Lower Back',
  'Neck & Shoulders',
  'Knee',
  'Shoulder',
  'Ankle & Foot',
  'Hip & Pelvis',
  'Mid Back',
  'Wrist & Hand',
];

const TIME_TAGS = ['Morning', 'Afternoon', 'Evening', 'Night'] as const;

interface PainEntryItem {
  id: number;
  date: string;
  score: number;
  area: string;
  note: string;
  time_of_day: string;
  therapist_comment?: string;
  commenting_therapist_name?: string;
}

export const PainTrackerPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [entries, setEntries] = useState<PainEntryItem[]>([]);
  const [trendline, setTrendline] = useState<{ date: string; score: number; area: string }[]>([]);
  const [avgThisWeek, setAvgThisWeek] = useState<number | null>(null);
  const [avgLastWeek, setAvgLastWeek] = useState<number | null>(null);
  const [isGated, setIsGated] = useState<boolean>(false);
  const [hiddenCount, setHiddenCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [score, setScore] = useState<number>(3);
  const [area, setArea] = useState<string>(user?.patient_profile?.primary_complaint_area || BODY_AREAS[0]);
  const [note, setNote] = useState<string>('');
  const [timeOfDay, setTimeOfDay] = useState<typeof TIME_TAGS[number]>('Morning');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [highPainAlert, setHighPainAlert] = useState<boolean>(false);

  const fetchPainData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pain');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setTrendline(data.trendline || []);
        setAvgThisWeek(data.avgThisWeek);
        setAvgLastWeek(data.avgLastWeek);
        setIsGated(data.isGated);
        setHiddenCount(data.hiddenRecordsCount || 0);

        if (data.todayEntry) {
          setScore(data.todayEntry.score);
          setArea(data.todayEntry.area);
          setNote(data.todayEntry.note || '');
          setTimeOfDay(data.todayEntry.time_of_day || 'Morning');
          if (data.todayEntry.score >= 8) {
            setHighPainAlert(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load pain history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPainData();
  }, []);

  const getScoreInfo = (val: number) => {
    if (val <= 3) {
      return {
        label: 'Mild (0 - 3)',
        color: 'text-teal-600 dark:text-teal-400',
        bg: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800',
        badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
        desc: 'Tolerable stiffness or dull ache. Mobility preserved.',
      };
    }
    if (val <= 6) {
      return {
        label: 'Moderate (4 - 6)',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        desc: 'Interferes with prolonged sitting, lifting, or walking.',
      };
    }
    return {
      label: 'High (7 - 10)',
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      desc: 'Severe restriction, sharp or radiating irritation. Requires clinical review.',
    };
  };

  const currentInfo = getScoreInfo(score);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area) {
      showToast('Please select a body area.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/pain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          area,
          note: note.trim(),
          time_of_day: timeOfDay,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to record pain entry.', 'error');
        return;
      }

      if (data.alertTriggered) {
        setHighPainAlert(true);
        showToast(
          `High pain score of ${score}/10 recorded. Automated clinical alerts were sent to your linked therapists.`,
          'warning',
          'High Pain Warning'
        );
      } else {
        setHighPainAlert(false);
        showToast('Daily pain entry recorded successfully!', 'success', 'Pain Logged');
      }

      fetchPainData();
    } catch (err) {
      showToast('Network error while logging pain.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SVG Chart Dimensions & Calculation
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 25;

  const points = trendline.map((item, index) => {
    const x = padding + (index / Math.max(1, trendline.length - 1)) * (chartWidth - padding * 2);
    // Y-axis: 0 at bottom, 10 at top
    const y = chartHeight - padding - (item.score / 10) * (chartHeight - padding * 2);
    return { x, y, score: item.score, date: item.date, area: item.area };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, curr, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '')
    : '';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Daily Pain Tracking
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Record your pain score once per day. Monitor your 14-day recovery trendline and keep your physiotherapist informed.
        </p>
      </div>

      {/* High Pain Alert Banner (Score >= 8) */}
      {highPainAlert && (
        <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-400 dark:border-rose-800 text-rose-900 dark:text-rose-200 shadow-md animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">
                  High Pain Score Alert (Score: {score}/10)
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                  A pain score of 8 or higher indicates significant joint or neural inflammation. An automated clinical alert has been sent to your treating physiotherapist.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs">
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Contact Your Therapist</span>
                  </div>
                  <span className="text-xs text-rose-600 dark:text-rose-300 font-medium">
                    Rest from heavy exercises until your therapist reviews your symptoms.
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setHighPainAlert(false)}
              className="text-rose-400 hover:text-rose-600 p-1"
              title="Dismiss warning"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Form + Trend Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Daily Pain Log Form (5 Cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Log Today's Pain Score
            </h2>
            <span className="text-[11px] font-semibold text-zinc-400">
              One entry per day
            </span>
          </div>

          {/* 0-10 Selector with Live Label */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Severity Score (0 - 10)
              </label>
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${currentInfo.badge}`}>
                {currentInfo.label}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-zinc-900 dark:text-white w-8 text-center">
                {score}
              </span>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                aria-label="Daily pain severity score from 0 to 10"
                className="w-full accent-teal-600 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
              />
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
              {currentInfo.desc}
            </p>
          </div>

          {/* Body Area Chips */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Body Location
            </label>
            <div className="flex flex-wrap gap-1.5">
              {BODY_AREAS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setArea(a)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    area === a
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Time of Day Tag */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Time of Day
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              {TIME_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTimeOfDay(tag)}
                  className={`py-1.5 rounded-xl text-center font-semibold transition-all ${
                    timeOfDay === tag
                      ? 'bg-teal-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note (Max 140 chars) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Daily Note (Optional)
              </label>
              <span className={`text-[11px] ${note.length > 130 ? 'text-amber-500 font-bold' : 'text-zinc-400'}`}>
                {note.length} / 140
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={140}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Sharp pain when standing up from desk. Less stiff after walking."
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/25 transition-all disabled:opacity-60"
          >
            <Activity className="w-4 h-4" />
            <span>{isSubmitting ? 'Recording Entry...' : "Save Today's Pain Score"}</span>
          </button>
        </form>

        {/* RIGHT: Trend Card & Weekly Comparison (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Trendline Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                  14-Day Recovery Trendline
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Visual pain trajectory across recent logs
                </p>
              </div>

              {/* Weekly Comparison Badge */}
              {avgThisWeek !== null && avgLastWeek !== null && (
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs">
                  {avgThisWeek < avgLastWeek ? (
                    <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      Avg: {avgThisWeek} this wk vs {avgLastWeek} last wk
                    </span>
                    <span className="text-[10px] text-zinc-500 block">
                      {avgThisWeek < avgLastWeek
                        ? `${Math.round((avgLastWeek - avgThisWeek) * 10) / 10} point improvement`
                        : 'Elevated pain detected'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SVG Line Chart */}
            {trendline.length > 1 ? (
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-44 text-teal-600 dark:text-teal-400"
                >
                  {/* Grid Lines */}
                  <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
                  <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
                  <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="currentColor" strokeOpacity="0.2" />

                  {/* Y Axis Labels */}
                  <text x={padding - 5} y={padding + 4} textAnchor="end" className="text-[9px] fill-zinc-400">10</text>
                  <text x={padding - 5} y={chartHeight / 2 + 3} textAnchor="end" className="text-[9px] fill-zinc-400">5</text>
                  <text x={padding - 5} y={chartHeight - padding + 3} textAnchor="end" className="text-[9px] fill-zinc-400">0</text>

                  {/* Shaded Area Under Curve */}
                  <path
                    d={`${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`}
                    fill="currentColor"
                    fillOpacity="0.12"
                  />

                  {/* Line Chart */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {points.map((pt, i) => (
                    <g key={i}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="3.5"
                        fill="currentColor"
                        className="hover:r-5 transition-all cursor-pointer"
                      >
                        <title>{`${pt.date}: ${pt.score}/10 (${pt.area})`}</title>
                      </circle>
                      {/* Date label on first and last points */}
                      {(i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2)) && (
                        <text
                          x={pt.x}
                          y={chartHeight - 6}
                          textAnchor="middle"
                          className="text-[9px] fill-zinc-400 font-mono"
                        >
                          {pt.date.slice(5)}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                Log at least 2 entries to display your 14-day visual trendline.
              </div>
            )}
          </div>

          {/* Plan History Gating Notice */}
          {isGated && (
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-teal-800 dark:text-teal-200">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  <strong>Free Plan:</strong> Showing last 7 days of pain entries
                  {hiddenCount > 0 ? ` (${hiddenCount} older entries preserved)` : ''}.
                </span>
              </div>
              <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 uppercase shrink-0">
                Upgrade for Full History
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pain Entries History Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            Pain Entry Log History
          </h2>
          <span className="text-xs text-zinc-500">
            {entries.length} record{entries.length === 1 ? '' : 's'}
          </span>
        </div>

        {entries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-zinc-700">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Body Area</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Patient Note</th>
                  <th className="py-3 px-4">Therapist Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {entries.map((entry) => {
                  const scoreInfo = getScoreInfo(entry.score);
                  return (
                    <tr key={entry.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-zinc-800 dark:text-zinc-200">
                        {entry.date}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${scoreInfo.badge}`}>
                          {entry.score}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white">
                        {entry.area}
                      </td>
                      <td className="py-3 px-4 text-zinc-500">
                        {entry.time_of_day}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 max-w-xs truncate">
                        {entry.note || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {entry.therapist_comment ? (
                          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-[11px]">
                            <span className="font-bold block text-teal-900 dark:text-teal-100">
                              {entry.commenting_therapist_name || 'Dr. PT'}:
                            </span>
                            {entry.therapist_comment}
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">No feedback yet</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-zinc-500">
            No pain entries recorded yet. Use the form above to log your first score today!
          </div>
        )}
      </div>
    </div>
  );
};
