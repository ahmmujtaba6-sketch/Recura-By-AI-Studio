import React, { useState, useEffect } from 'react';
import {
  Flame,
  TrendingDown,
  Dumbbell,
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  FileText,
  Download,
  Printer,
  Sparkles,
  Lock,
  Calendar,
  AlertCircle,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface ProgressMetrics {
  streak: number;
  totalExercisesLogged: number;
  initialAvgPain: number;
  currentAvgPain: number;
  painDropPercentage: number;
}

interface HeatmapRow {
  area: string;
  scoresByDate: {
    [date: string]: { score: number; note: string } | null;
  };
}

interface GoalItem {
  id: number;
  patient_id: number;
  title: string;
  target_date: string;
  status: 'in_progress' | 'achieved';
  created_at: string;
}

interface ProgressPageProps {
  onNavigatePlans?: () => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ onNavigatePlans }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapRow[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'basic' | 'premium'>('free');

  // Goals Form State
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  // Tooltip State for Heat Map
  const [activeTooltip, setActiveTooltip] = useState<{
    area: string;
    date: string;
    score: number;
    note: string;
    x: number;
    y: number;
  } | null>(null);

  // Report Preview State
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/progress/summary');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setDates(data.dates);
        setHeatmap(data.heatmap);
        setGoals(data.goals);
      }

      // Check current plan
      const planRes = await fetch('/api/plans/current');
      if (planRes.ok) {
        const planData = await planRes.json();
        setCurrentPlan(planData.plan || 'free');
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
      showToast('Failed to load progress summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    if (currentPlan !== 'premium') return;
    try {
      setLoadingReport(true);
      const res = await fetch('/api/progress/report');
      if (res.ok) {
        const data = await res.json();
        setReportData(data.report);
      }
    } catch (err) {
      console.error('Failed to fetch clinical report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (currentPlan === 'premium') {
      fetchReport();
    }
  }, [currentPlan]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) {
      showToast('Please enter a recovery goal', 'error');
      return;
    }

    try {
      setSavingGoal(true);
      const res = await fetch('/api/progress/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newGoalTitle.trim(),
          target_date: newGoalDate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Recovery goal saved!', 'success');
        setNewGoalTitle('');
        setNewGoalDate('');
        setGoals([data.goal, ...goals]);
      } else {
        showToast(data.error || 'Failed to create goal', 'error');
      }
    } catch {
      showToast('Network error creating goal', 'error');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleToggleGoal = async (goal: GoalItem) => {
    const nextStatus = goal.status === 'achieved' ? 'in_progress' : 'achieved';
    try {
      const res = await fetch(`/api/progress/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setGoals(goals.map((g) => (g.id === goal.id ? { ...g, status: nextStatus } : g)));
        showToast(nextStatus === 'achieved' ? 'Goal accomplished! 🎉' : 'Goal moved to in progress', 'success');
      }
    } catch {
      showToast('Failed to update goal', 'error');
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    try {
      const res = await fetch(`/api/progress/goals/${goalId}`, { method: 'DELETE' });
      if (res.ok) {
        setGoals(goals.filter((g) => g.id !== goalId));
        showToast('Goal deleted', 'info');
      }
    } catch {
      showToast('Failed to delete goal', 'error');
    }
  };

  const getHeatmapColor = (score: number | null) => {
    if (score === null) return 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400';
    if (score === 0) return 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/50';
    if (score <= 3) return 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40';
    if (score <= 6) return 'bg-amber-200 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 border border-amber-300/40';
    return 'bg-rose-500 text-white font-bold shadow-xs';
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading your rehabilitation analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              Recovery Progress & Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300">
              14-Day View
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Track daily pain level drops, routine consistency, recovery goals, and clinical summaries.
          </p>
        </div>

        {/* Current Plan Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs flex items-center gap-2 shadow-xs">
            <span className="text-zinc-500">Plan:</span>
            <span className="font-extrabold capitalize text-teal-600 dark:text-teal-400">
              {currentPlan}
            </span>
            {currentPlan !== 'premium' && (
              <button
                type="button"
                onClick={onNavigatePlans}
                className="ml-2 font-bold text-teal-600 hover:text-teal-700 underline text-[11px]"
              >
                Upgrade
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 shrink-0">
            <Flame className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Exercise Streak</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">
              {metrics?.streak || 0} <span className="text-sm font-semibold text-zinc-500">Days</span>
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Active daily consistency</p>
          </div>
        </div>

        {/* Pain Reduction */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pain Reduction</p>
            <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-0.5">
              {metrics && metrics.painDropPercentage > 0 ? `-${metrics.painDropPercentage}%` : 'Stable'}
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {metrics ? `${metrics.initialAvgPain} initial → ${metrics.currentAvgPain} current` : '14-day comparison'}
            </p>
          </div>
        </div>

        {/* Total Exercises */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 shrink-0">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Completed Protocols</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">
              {metrics?.totalExercisesLogged || 0}
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Verified logged sessions</p>
          </div>
        </div>

        {/* Recovery Goals */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Milestones Achieved</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">
              {goals.filter((g) => g.status === 'achieved').length} / {goals.length}
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Personal functional goals</p>
          </div>
        </div>
      </div>

      {/* 6-Area x 14-Day Pain Heat Map */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                14-Day Anatomical Pain Heat Map
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Visual overview of logged VAS pain scores (0-10) across key musculoskeletal zones. Hover over any cell to view patient notes.
            </p>
          </div>

          {/* Color Scale Legend */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-teal-100 dark:bg-teal-950/60 border border-teal-300" />
              <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">0 None</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300" />
              <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">1-3 Mild</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-amber-200 dark:bg-amber-900/70 border border-amber-300" />
              <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">4-6 Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-rose-500" />
              <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">7-10 Severe</span>
            </div>
          </div>
        </div>

        {/* Heat Map Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[720px]">
            {/* Date Headers */}
            <div className="grid grid-cols-15 gap-1.5 text-center mb-2 items-center text-[10px] font-semibold text-zinc-400">
              <div className="col-span-3 text-left pl-2">Anatomical Zone</div>
              {dates.map((d) => {
                const dateObj = new Date(d + 'T00:00:00');
                const dayName = dateObj.toLocaleDateString('en-PK', { weekday: 'narrow' });
                const dayNum = dateObj.getDate();
                return (
                  <div key={d} className="flex flex-col items-center">
                    <span className="text-[9px] uppercase">{dayName}</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-bold">{dayNum}</span>
                  </div>
                );
              })}
            </div>

            {/* Heat Map Rows */}
            <div className="space-y-1.5">
              {heatmap.map((row) => (
                <div key={row.area} className="grid grid-cols-15 gap-1.5 items-center">
                  <div className="col-span-3 text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate pl-2">
                    {row.area}
                  </div>
                  {dates.map((d) => {
                    const entry = row.scoresByDate[d];
                    const score = entry ? entry.score : null;
                    const colorClass = getHeatmapColor(score);

                    return (
                      <div
                        key={d}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveTooltip({
                            area: row.area,
                            date: d,
                            score: score ?? 0,
                            note: entry?.note || (score !== null ? 'No additional clinical remarks.' : 'No entry logged for this day.'),
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className={`h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 cursor-pointer ${colorClass}`}
                      >
                        {score !== null ? score : '—'}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Heat Map Tooltip */}
        {activeTooltip && (
          <div
            className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 w-64 p-3 rounded-xl bg-zinc-900 text-white text-xs shadow-2xl border border-zinc-700 backdrop-blur-md"
            style={{ left: activeTooltip.x, top: activeTooltip.y - 8 }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1 mb-1.5">
              <span className="font-bold text-teal-300">{activeTooltip.area}</span>
              <span className="text-[10px] text-zinc-400">{activeTooltip.date}</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-zinc-400">Score:</span>
              <span className="font-black text-sm text-teal-400">{activeTooltip.score}/10</span>
            </div>
            <p className="text-[11px] text-zinc-300 line-clamp-3 leading-snug">
              {activeTooltip.note}
            </p>
          </div>
        )}
      </div>

      {/* Recovery Goals (CRUD) */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Personal Recovery Milestones & Goals
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Set functional targets with your physiotherapist (e.g., pain-free stair climbing, lifting without lower back discomfort).
            </p>
          </div>
        </div>

        {/* Add Goal Form */}
        <form onSubmit={handleCreateGoal} className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
          <div className="sm:col-span-7">
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              Goal Description
            </label>
            <input
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="e.g., Walk 30 minutes without knee stiffness"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              Target Date (Optional)
            </label>
            <input
              type="date"
              value={newGoalDate}
              onChange={(e) => setNewGoalDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={savingGoal}
              className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add Goal</span>
            </button>
          </div>
        </form>

        {/* Goals List */}
        <div className="space-y-2">
          {goals.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-xs">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-500" />
              <p className="font-semibold text-zinc-600 dark:text-zinc-400">No milestones set yet</p>
              <p className="text-[11px] mt-0.5">Add functional rehabilitation goals above to measure your quality of life improvement.</p>
            </div>
          ) : (
            goals.map((goal) => (
              <div
                key={goal.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  goal.status === 'achieved'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleGoal(goal)}
                    className="shrink-0 text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform"
                    title={goal.status === 'achieved' ? 'Mark in progress' : 'Mark accomplished'}
                  >
                    {goal.status === 'achieved' ? (
                      <CheckCircle2 className="w-5 h-5 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-400" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold truncate ${
                        goal.status === 'achieved'
                          ? 'line-through text-zinc-400 dark:text-zinc-500'
                          : 'text-zinc-900 dark:text-white'
                      }`}
                    >
                      {goal.title}
                    </p>
                    {goal.target_date && (
                      <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>Target: {goal.target_date}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      goal.status === 'achieved'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {goal.status === 'achieved' ? 'Accomplished' : 'In Progress'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1 text-zinc-400 hover:text-rose-600 transition-colors rounded"
                    title="Delete goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Clinical Progress Report Export Section */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Certified Clinical Progress Report
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Official summary of patient VAS ratings, rehabilitation protocol compliance, and physiotherapist notes.
            </p>
          </div>

          {currentPlan === 'premium' ? (
            <div className="flex items-center gap-2">
              <a
                href="/api/progress/report/csv"
                download="recura-14day-recovery-data.csv"
                className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </a>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onNavigatePlans}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:from-teal-700 hover:to-emerald-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unlock on Premium</span>
            </button>
          )}
        </div>

        {currentPlan === 'premium' ? (
          <div>
            {loadingReport ? (
              <div className="p-8 text-center text-xs text-zinc-400">Loading clinical report...</div>
            ) : reportData ? (
              <div id="printable-clinical-report" className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-zinc-50/50 dark:bg-zinc-800/30">
                {/* Clinical Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-700">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg text-teal-600 dark:text-teal-400">RECURA CLINICAL SUMMARY</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                        OFFICIAL RECORD
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">Physio Hub Tele-Rehab Network Pakistan</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold text-zinc-900 dark:text-white">Supervising Practitioner:</p>
                    <p className="text-teal-600 dark:text-teal-400 font-bold">{reportData.therapist?.name}</p>
                    <p className="text-[10px] text-zinc-400">PMR Reg: {reportData.therapist?.registration_no} ({reportData.therapist?.city})</p>
                  </div>
                </div>

                {/* Patient Profile Sub-header */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs border-b border-zinc-200 dark:border-zinc-700">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Patient Name</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{reportData.patient?.name || user?.email}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Primary Complaint</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{reportData.patient?.primary_complaint_area || 'Musculoskeletal'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Exercises Completed</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{reportData.totalCompletedExercises} Sessions</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Report Date</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{new Date(reportData.generatedAt).toLocaleDateString('en-PK')}</span>
                  </div>
                </div>

                {/* 14-Day Log with Comments */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-2">
                    14-Day VAS Pain Progression & Clinical Feedback
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-700 text-zinc-400 text-[10px] uppercase">
                          <th className="py-2 px-2">Date</th>
                          <th className="py-2 px-2">Zone</th>
                          <th className="py-2 px-2">VAS (0-10)</th>
                          <th className="py-2 px-2">Patient Symptoms</th>
                          <th className="py-2 px-2">Physiotherapist Feedback</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-700/60">
                        {reportData.painEntries?.map((entry: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white dark:hover:bg-zinc-800">
                            <td className="py-2 px-2 font-medium">{entry.date}</td>
                            <td className="py-2 px-2">{entry.area}</td>
                            <td className="py-2 px-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-black ${
                                  entry.score >= 7
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                    : entry.score >= 4
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                                }`}
                              >
                                {entry.score}/10
                              </span>
                            </td>
                            <td className="py-2 px-2 text-zinc-600 dark:text-zinc-400">{entry.note || '—'}</td>
                            <td className="py-2 px-2 font-medium text-teal-700 dark:text-teal-300">
                              {entry.therapist_comment ? (
                                <span>💬 {entry.therapist_comment}</span>
                              ) : (
                                <span className="text-zinc-400 italic text-[11px]">No remarks</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Report Disclaimer */}
                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-400">
                  <p className="font-semibold text-zinc-500">Medical Notice:</p>
                  <p>{reportData.disclaimer}</p>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* Locked State for Free & Basic */
          <div className="p-8 rounded-2xl border border-dashed border-teal-200 dark:border-teal-900 bg-teal-50/40 dark:bg-teal-950/20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
              Clinical Progress Reports are a Premium Feature
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto mb-4 leading-relaxed">
              You are currently on the <strong className="capitalize text-zinc-900 dark:text-white">{currentPlan}</strong> plan.
              Upgrade to <strong>Premium (PKR 2,999/mo)</strong> to unlock certified clinical progress reports, printable PDF summaries for your physician, CSV raw data export, and direct physiotherapist progress commentary.
            </p>

            <div className="flex flex-wrap justify-center gap-3 text-xs mb-6">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" /> Printable PDF Report
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" /> CSV Raw Data Export
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" /> Physiotherapist Progress Notes
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" /> 4 Video Calls / Month
              </span>
            </div>

            <button
              type="button"
              onClick={onNavigatePlans}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>View Premium Plans & Pricing</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
