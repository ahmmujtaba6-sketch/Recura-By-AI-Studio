import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import {
  Dumbbell,
  Flame,
  CheckCircle2,
  Lock,
  ExternalLink,
  PlayCircle,
  X,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';

interface ExerciseAssignment {
  assignment_id: number;
  tutorial_id: number;
  title: string;
  category: string;
  minutes: number;
  sets: number;
  reps: number;
  assignment_note: string;
  therapist_name: string;
  safety_note: string;
  isTutorialLocked: boolean;
  video_url: string | null;
  steps: string[];
  isDoneToday: boolean;
  painAfter: number | null;
}

interface WeekDayItem {
  date: string;
  dayLabel: string;
  done: boolean;
  count: number;
}

export const ExercisesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [assignments, setAssignments] = useState<ExerciseAssignment[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [weeklyRow, setWeeklyRow] = useState<WeekDayItem[]>([]);
  const [plan, setPlan] = useState<string>('free');
  const [loading, setLoading] = useState<boolean>(true);

  // Pain-after prompt modal state
  const [pendingLogAssignment, setPendingLogAssignment] = useState<ExerciseAssignment | null>(null);
  const [painAfterScore, setPainAfterScore] = useState<number>(0);
  const [isLogging, setIsLogging] = useState<boolean>(false);

  // Tutorial viewing modal state
  const [viewingTutorial, setViewingTutorial] = useState<ExerciseAssignment | null>(null);

  // Upgrade prompt modal state (when Free user clicks locked tutorial)
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exercises/assigned');
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
        setStreak(data.streak || 0);
        setWeeklyRow(data.weeklyRow || []);
        setPlan(data.plan || 'free');
      }
    } catch (err) {
      console.error('Failed to load exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const handleCheckboxClick = (asg: ExerciseAssignment) => {
    if (asg.isDoneToday) {
      // Toggle to uncompleted directly
      handleSaveLog(asg.assignment_id, false, 0);
    } else {
      // Prompt for pain score before completing
      setPainAfterScore(0);
      setPendingLogAssignment(asg);
    }
  };

  const handleSaveLog = async (assignmentId: number, done: boolean, painAfter: number) => {
    setIsLogging(true);
    try {
      const res = await fetch('/api/exercises/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          done,
          pain_after: painAfter,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to update exercise log.', 'error');
        return;
      }

      showToast(
        done ? 'Exercise completed and recovery streak updated!' : 'Exercise marked as incomplete.',
        'success'
      );
      setPendingLogAssignment(null);
      fetchExercises();
    } catch (err) {
      showToast('Network error updating exercise log.', 'error');
    } finally {
      setIsLogging(false);
    }
  };

  const handleOpenTutorial = (asg: ExerciseAssignment) => {
    if (asg.isTutorialLocked) {
      setShowUpgradeModal(true);
    } else {
      setViewingTutorial(asg);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Assigned Rehabilitation Exercises
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Perform your targeted protocols prescribed by your physical therapist. Mark them done daily to maintain your recovery streak.
        </p>
      </div>

      {/* STREAK & 7-DAY PROGRESS ROW CARD */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Flame className="w-7 h-7 fill-amber-500" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
                  {streak} Days
                </span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Active Recovery Streak
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {streak > 0
                  ? 'Consistent daily movement triggers tissue remodeling and disc healing.'
                  : 'Complete your exercises today to ignite your recovery streak!'}
              </p>
            </div>
          </div>

          <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 w-fit">
            Plan: <strong className="uppercase">{plan}</strong>
          </div>
        </div>

        {/* 7-Day Completion Bar Row */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2">
            Last 7 Days Progress
          </span>
          <div className="grid grid-cols-7 gap-2">
            {weeklyRow.map((day) => (
              <div
                key={day.date}
                className={`p-2.5 rounded-2xl border text-center transition-all ${
                  day.done
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                }`}
              >
                <span className="text-[10px] font-bold block">{day.dayLabel}</span>
                <div className="mt-1 flex items-center justify-center">
                  {day.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-zinc-300 dark:border-zinc-700" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ASSIGNED EXERCISES LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
            Today's Prescribed Exercises
          </h2>
          <span className="text-xs text-zinc-500">
            {assignments.length} exercise{assignments.length === 1 ? '' : 's'} assigned
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading assigned exercises...</span>
          </div>
        ) : assignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {assignments.map((asg) => (
              <div
                key={asg.assignment_id}
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                  asg.isDoneToday
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-teal-500'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900">
                        {asg.category}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mt-1.5">
                        {asg.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Assigned by <strong className="text-zinc-800 dark:text-zinc-200">{asg.therapist_name}</strong>
                      </p>
                    </div>

                    {/* Completion Checkbox Button */}
                    <button
                      type="button"
                      onClick={() => handleCheckboxClick(asg)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        asg.isDoneToday
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-teal-50 hover:text-teal-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{asg.isDoneToday ? 'Completed' : 'Mark Done'}</span>
                    </button>
                  </div>

                  {/* Sets, Reps, Duration row */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 my-3 border-y border-zinc-100 dark:border-zinc-800 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Sets</span>
                      <p className="font-extrabold text-zinc-800 dark:text-zinc-200">{asg.sets} sets</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Reps</span>
                      <p className="font-extrabold text-zinc-800 dark:text-zinc-200">{asg.reps} reps</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Time</span>
                      <p className="font-extrabold text-zinc-800 dark:text-zinc-200">~{asg.minutes} mins</p>
                    </div>
                  </div>

                  {/* Therapist Note */}
                  {asg.assignment_note && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 mb-3 italic">
                      Note: "{asg.assignment_note}"
                    </p>
                  )}

                  {/* Logged Pain Feedback if done today */}
                  {asg.isDoneToday && asg.painAfter !== null && (
                    <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold mb-3 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Logged pain during exercise: {asg.painAfter}/10</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action: Video Tutorial Modal / Plan Lock */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenTutorial(asg)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold transition-colors"
                  >
                    {asg.isTutorialLocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>View Video Tutorial (Basic / Premium)</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>Watch Video Form Tutorial</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center max-w-md mx-auto">
            <Dumbbell className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
            <h3 className="font-bold text-zinc-900 dark:text-white text-base">
              No Exercises Assigned Yet
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Once you book an appointment with a physical therapist, they will assess your mobility and prescribe targeted exercises here.
            </p>
          </div>
        )}
      </div>

      {/* 1. PAIN PROMPT MODAL WHEN MARKING DONE */}
      {pendingLogAssignment && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
              Mark Exercise Complete
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              {pendingLogAssignment.title}
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Pain during this exercise? (0 - 10)
                  </label>
                  <span className="text-sm font-black text-teal-600 dark:text-teal-400">
                    {painAfterScore} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={painAfterScore}
                  onChange={(e) => setPainAfterScore(Number(e.target.value))}
                  aria-label="Pain during exercise from 0 to 10"
                  className="w-full accent-teal-600 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                  <span>0 (None)</span>
                  <span>5 (Mild)</span>
                  <span>10 (Severe)</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  disabled={isLogging}
                  onClick={() =>
                    handleSaveLog(
                      pendingLogAssignment.assignment_id,
                      true,
                      painAfterScore
                    )
                  }
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isLogging ? 'Saving...' : 'Save & Complete'}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingLogAssignment(null)}
                  className="py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TUTORIAL MODAL (Basic / Premium Plan) */}
      {viewingTutorial && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-700 to-teal-600 text-white flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200">
                  {viewingTutorial.category} Tutorial
                </span>
                <h3 className="text-xl font-bold tracking-tight mt-0.5">
                  {viewingTutorial.title}
                </h3>
                <p className="text-xs text-teal-100 mt-0.5">
                  Target: {viewingTutorial.sets} sets × {viewingTutorial.reps} reps
                </p>
              </div>
              <button
                onClick={() => setViewingTutorial(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Mandatory Safety Note */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Safety Rule:</strong> {viewingTutorial.safety_note || 'Stop immediately if pain increases sharply. Never force through acute sharp or nerve sensation.'}
                </p>
              </div>

              {/* Step by Step Breakdown */}
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5">
                  Execution Steps
                </h4>
                <div className="space-y-2">
                  {viewingTutorial.steps && viewingTutorial.steps.length > 0 ? (
                    viewingTutorial.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3"
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-xs shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500">Perform with slow controlled breathing.</p>
                  )}
                </div>
              </div>

              {/* Video Link Button */}
              {viewingTutorial.video_url && (
                <div className="pt-2">
                  <a
                    href={viewingTutorial.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Watch HD Video Demo (Opens in New Tab)</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. UPGRADE PROMPT MODAL (When Free plan patient clicks locked tutorial) */}
      {showUpgradeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
              Upgrade to Unlock Video Tutorials
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              You are currently on the <strong>Free Plan</strong>. Free accounts can view assigned sets and reps, but video tutorials, telehealth calls, and full progress tracking require a Basic or Premium care subscription.
            </p>

            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-1 text-xs text-teal-900 dark:text-teal-200 mb-5">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Basic Care: PKR 1,499 / mo</span>
              </div>
              <p className="text-[11px] text-teal-700 dark:text-teal-300">
                Includes all HD video exercise tutorials, full pain history, and 2 video calls.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(false);
                  showToast('Redirecting to care plans...', 'info');
                }}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all"
              >
                View Care Plans
              </button>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
