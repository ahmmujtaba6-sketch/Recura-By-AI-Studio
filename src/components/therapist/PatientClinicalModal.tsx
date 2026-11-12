import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Activity,
  Dumbbell,
  Calendar,
  AlertTriangle,
  Heart,
  FileText,
  Phone,
  Mail,
  MapPin,
  Clock,
  Plus,
  CheckCircle2,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';
import { AssignExerciseModal } from './AssignExerciseModal.tsx';

interface PatientClinicalModalProps {
  patientId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export const PatientClinicalModal: React.FC<PatientClinicalModalProps> = ({
  patientId,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'pain' | 'exercises' | 'appointments'>('overview');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingCommentEntryId, setEditingCommentEntryId] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (isOpen && patientId) {
      fetchPatientClinicalData();
    }
  }, [isOpen, patientId]);

  const fetchPatientClinicalData = async () => {
    if (!patientId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/therapist-workspace/patients/${patientId}`);
      if (!res.ok) throw new Error('Failed to load patient clinical file');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveAssignment = async (assignmentId: number) => {
    try {
      const res = await fetch(`/api/therapist-workspace/assignments/${assignmentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to archive assignment');
      showToast('Exercise protocol archived.', 'info');
      fetchPatientClinicalData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveComment = async (painEntryId: number) => {
    if (!commentInput.trim()) return;
    try {
      setIsSubmittingComment(true);
      const res = await fetch('/api/therapist-workspace/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pain_entry_id: painEntryId,
          text: commentInput.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        if (json.upgradeRequired) {
          showToast('Therapist comments require the patient to be on the Premium plan.', 'error');
        } else {
          showToast(json.error || 'Failed to submit comment', 'error');
        }
        return;
      }

      showToast('Clinical comment saved and patient notified!', 'success');
      setEditingCommentEntryId(null);
      setCommentInput('');
      fetchPatientClinicalData();
    } catch {
      showToast('Network error saving comment', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!isOpen || !patientId) return null;

  const patient = data?.patient;
  const painHistory = data?.painHistory || [];
  const assignments = data?.assignments || [];
  const exerciseLogs = data?.recentExerciseLogs || [];
  const appointments = data?.appointments || [];

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      >
        <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-850/50">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-lg">
                {patient?.name ? patient.name.charAt(0) : 'P'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                    {patient?.name || 'Patient Clinical Chart'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                    {patient?.plan || 'Free'} Plan
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-3">
                  <span>Complaint: <strong className="text-teal-600 dark:text-teal-400">{patient?.primary_complaint_area || 'Musculoskeletal'}</strong> ({patient?.primary_complaint_duration || 'Ongoing'})</span>
                  <span>•</span>
                  <span>{patient?.city || 'Pakistan'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Prescribe Exercise</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-5 border-b border-zinc-200 dark:border-zinc-800 flex gap-2 shrink-0 bg-white dark:bg-zinc-900">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'overview'
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Biometrics & History
            </button>
            <button
              onClick={() => setActiveTab('pain')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'pain'
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <span>14-Day Pain Trend</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {painHistory.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('exercises')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'exercises'
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <span>Prescriptions & Logs</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {assignments.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'appointments'
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <span>Consultations</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {appointments.length}
              </span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-zinc-500">
                <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-xs">Loading clinical chart...</span>
              </div>
            ) : !patient ? (
              <div className="py-12 text-center text-zinc-500 text-sm">
                No patient data found.
              </div>
            ) : activeTab === 'overview' ? (
              <div className="space-y-6">
                {/* Biometrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                    <span className="text-[11px] font-semibold text-zinc-400 block">Height & Weight</span>
                    <p className="text-base font-bold text-zinc-900 dark:text-white mt-1">
                      {patient.height ? `${patient.height} cm` : '—'} / {patient.weight ? `${patient.weight} kg` : '—'}
                    </p>
                    <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-0.5">
                      BMI: {patient.bmi ? `${patient.bmi} kg/m²` : 'N/A'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                    <span className="text-[11px] font-semibold text-zinc-400 block">Demographics</span>
                    <p className="text-base font-bold text-zinc-900 dark:text-white mt-1">
                      {patient.gender || 'Not specified'}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      DOB: {patient.dob || '—'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                    <span className="text-[11px] font-semibold text-zinc-400 block">Contact Mobile</span>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white mt-1 truncate">
                      {patient.phone || 'No phone'}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                      {patient.email}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                    <span className="text-[11px] font-semibold text-zinc-400 block">Profile Health</span>
                    <p className="text-base font-bold text-zinc-900 dark:text-white mt-1">
                      {patient.completion_percentage || 50}% Complete
                    </p>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-teal-600 h-1.5 rounded-full"
                        style={{ width: `${patient.completion_percentage || 50}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Medical History & Allergies */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm mb-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span>Past Medical History</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                      {patient.medical_history || 'No chronic systemic illnesses or surgical history recorded by patient.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Allergies & Sensitivities</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {patient.allergies || 'No drug or topical allergies noted.'}
                    </p>
                  </div>
                </div>

                {/* Primary Complaint Synopsis */}
                <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60">
                  <h4 className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider mb-1.5">
                    Primary Musculoskeletal Complaint
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-zinc-700 dark:text-zinc-300">
                    <div>
                      <span className="text-zinc-400">Anatomical Region:</span>{' '}
                      <span className="font-bold text-zinc-900 dark:text-white">{patient.primary_complaint_area || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Duration:</span>{' '}
                      <span className="font-bold text-zinc-900 dark:text-white">{patient.primary_complaint_duration || 'Ongoing'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'pain' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Full 14-Day Visual Analog Scale (VAS) Log
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    VAS Scores: 0 (No Pain) to 10 (Worst Discomfort)
                  </span>
                </div>

                {painHistory.length === 0 ? (
                  <div className="py-10 text-center text-zinc-400 text-xs">
                    No pain entries logged yet by this patient.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {painHistory.map((p: any) => {
                      const isHigh = p.score >= 8;
                      const isModerate = p.score >= 4 && p.score < 8;
                      return (
                        <div
                          key={p.id}
                          className={`p-3.5 rounded-2xl border transition-colors ${
                            isHigh
                              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                              : isModerate
                              ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                              : 'bg-zinc-50 dark:bg-zinc-850 border-zinc-200 dark:border-zinc-800'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                  isHigh
                                    ? 'bg-rose-600 text-white'
                                    : isModerate
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-teal-600 text-white'
                                }`}
                              >
                                {p.score}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-zinc-900 dark:text-white">
                                    {p.date}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                                    {p.time_of_day}
                                  </span>
                                  <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                                    {p.area}
                                  </span>
                                </div>
                                {p.note && (
                                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 italic">
                                    &ldquo;{p.note}&rdquo;
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Therapist Clinical Feedback Form / Display */}
                            {p.therapist_comment && editingCommentEntryId !== p.id && (
                              <div className="sm:max-w-xs p-2.5 rounded-xl bg-teal-100/70 dark:bg-teal-900/40 text-[11px] text-teal-900 dark:text-teal-200">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold">Your Clinical Feedback:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommentEntryId(p.id);
                                      setCommentInput(p.therapist_comment || '');
                                    }}
                                    className="text-[10px] text-teal-700 dark:text-teal-300 underline font-semibold ml-2"
                                  >
                                    Edit
                                  </button>
                                </div>
                                <span className="mt-0.5 block">{p.therapist_comment}</span>
                              </div>
                            )}

                            {!p.therapist_comment && editingCommentEntryId !== p.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentEntryId(p.id);
                                  setCommentInput('');
                                }}
                                className="px-2.5 py-1 rounded-lg border border-teal-300 dark:border-teal-800 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 self-start sm:self-center transition-colors flex items-center gap-1"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>+ Add Clinical Note</span>
                              </button>
                            )}

                            {editingCommentEntryId === p.id && (
                              <div className="w-full sm:max-w-xs space-y-1.5 mt-2 sm:mt-0">
                                <input
                                  type="text"
                                  value={commentInput}
                                  onChange={(e) => setCommentInput(e.target.value)}
                                  placeholder="Enter clinical advice..."
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                                />
                                <div className="flex items-center gap-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setEditingCommentEntryId(null)}
                                    className="px-2 py-0.5 text-[10px] rounded text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isSubmittingComment}
                                    onClick={() => handleSaveComment(p.id)}
                                    className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                                  >
                                    {isSubmittingComment ? 'Saving...' : 'Save'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeTab === 'exercises' ? (
              <div className="space-y-6">
                {/* Active Assignments */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Prescribed Clinical Exercise Protocols
                    </h4>
                    <button
                      onClick={() => setIsAssignModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Prescribe New Protocol</span>
                    </button>
                  </div>

                  {assignments.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
                      No exercise protocols prescribed yet. Click &ldquo;Prescribe New Protocol&rdquo; above.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {assignments.map((asgn: any) => (
                        <div
                          key={asgn.id}
                          className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                                {asgn.tutorial_category}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  asgn.active
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
                                }`}
                              >
                                {asgn.active ? 'Active' : 'Archived'}
                              </span>
                            </div>
                            <h5 className="font-bold text-sm text-zinc-900 dark:text-white mt-1">
                              {asgn.tutorial_title}
                            </h5>
                            <div className="mt-2 flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                              <span>Sets: <strong className="text-zinc-900 dark:text-white">{asgn.sets}</strong></span>
                              <span>•</span>
                              <span>Reps: <strong className="text-zinc-900 dark:text-white">{asgn.reps}</strong></span>
                              <span>•</span>
                              <span>Duration: {asgn.minutes}m</span>
                            </div>
                            {asgn.note && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 italic bg-white dark:bg-zinc-800 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                &ldquo;{asgn.note}&rdquo;
                              </p>
                            )}
                          </div>

                          {asgn.active === 1 && (
                            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-750 flex justify-end">
                              <button
                                onClick={() => handleArchiveAssignment(asgn.id)}
                                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Archive Protocol</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patient Logs History */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                    Recent Daily Completion Logs
                  </h4>
                  {exerciseLogs.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No exercise logs recorded yet.</p>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-1.5">
                      {exerciseLogs.map((log: any) => (
                        <div
                          key={log.id}
                          className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-semibold text-zinc-900 dark:text-white">
                              {log.exercise_title}
                            </span>
                            <span className="text-zinc-400">({log.date})</span>
                          </div>
                          <span className="text-zinc-500">
                            Post-exercise pain: <strong className="text-teal-600 font-bold">{log.pain_after}/10</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Past & Upcoming Consultations with Patient
                </h4>
                {appointments.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">No consultation appointments on record.</p>
                ) : (
                  <div className="space-y-2">
                    {appointments.map((apt: any) => (
                      <div
                        key={apt.id}
                        className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white">
                            <span>{apt.date} at {apt.time}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full capitalize bg-zinc-200 dark:bg-zinc-700">
                              {apt.type}
                            </span>
                          </div>
                          {apt.reason && (
                            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                              Reason: {apt.reason}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            apt.status === 'upcoming'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : apt.status === 'completed'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : apt.status === 'requested'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Exercise Modal Subcomponent */}
      <AssignExerciseModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        defaultPatientId={patientId}
        onSuccess={() => {
          fetchPatientClinicalData();
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
};
