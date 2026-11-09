import React, { useState, useEffect } from 'react';
import { X, Dumbbell, User, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';

interface AssignExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultPatientId?: number | null;
  defaultTutorialId?: number | null;
}

export const AssignExerciseModal: React.FC<AssignExerciseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultPatientId,
  defaultTutorialId,
}) => {
  const { showToast } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>(defaultPatientId || '');
  const [selectedTutorialId, setSelectedTutorialId] = useState<number | ''>(defaultTutorialId || '');
  const [sets, setSets] = useState<number>(3);
  const [reps, setReps] = useState<number>(10);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (defaultPatientId) setSelectedPatientId(defaultPatientId);
      if (defaultTutorialId) setSelectedTutorialId(defaultTutorialId);
      fetchOptions();
    }
  }, [isOpen, defaultPatientId, defaultTutorialId]);

  const fetchOptions = async () => {
    setIsLoadingData(true);
    try {
      const [patientsRes, tutorialsRes] = await Promise.all([
        fetch('/api/therapist-workspace/patients'),
        fetch('/api/therapist-workspace/tutorials'),
      ]);

      if (patientsRes.ok) {
        const pData = await patientsRes.json();
        setPatients(pData.patients || []);
        if (!selectedPatientId && pData.patients?.length > 0 && !defaultPatientId) {
          setSelectedPatientId(pData.patients[0].id);
        }
      }

      if (tutorialsRes.ok) {
        const tData = await tutorialsRes.json();
        setTutorials(tData.tutorials || []);
        if (!selectedTutorialId && tData.tutorials?.length > 0 && !defaultTutorialId) {
          setSelectedTutorialId(tData.tutorials[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching assignment options:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedTutorialId) {
      showToast('Please select both a patient and an exercise tutorial', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/therapist-workspace/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: Number(selectedPatientId),
          tutorial_id: Number(selectedTutorialId),
          sets: Number(sets),
          reps: Number(reps),
          note: note.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign exercise protocol');
      }

      showToast(data.message || 'Exercise prescribed successfully!', 'success', 'Prescription Added');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTutObj = tutorials.find((t) => t.id === Number(selectedTutorialId));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-teal-600 dark:text-teal-400 mb-2">
          <Dumbbell className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Clinical Prescription</span>
        </div>

        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
          Assign Exercise Protocol
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Prescribe guided exercise routines directly to your linked patient&apos;s daily recovery plan.
        </p>

        {isLoadingData ? (
          <div className="py-12 flex flex-col items-center justify-center text-zinc-500">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs">Loading patients and library...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Patient Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Target Patient
              </label>
              <div className="relative">
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="" disabled>Select patient from roster</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone || p.email}) - {p.primary_complaint_area || 'Musculoskeletal'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Exercise Tutorial Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Exercise Tutorial
              </label>
              <select
                value={selectedTutorialId}
                onChange={(e) => setSelectedTutorialId(Number(e.target.value))}
                className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="" disabled>Select exercise routine</option>
                {tutorials.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.category} - {t.minutes} mins)
                  </option>
                ))}
              </select>

              {selectedTutObj && (
                <div className="mt-2 p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-teal-800 dark:text-teal-300">
                    <span>Category: {selectedTutObj.category}</span>
                    <span>{selectedTutObj.minutes} Mins Duration</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                    Safety: {selectedTutObj.safety_note || 'Perform slowly without sharp discomfort'}
                  </p>
                </div>
              )}
            </div>

            {/* Sets & Reps */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Target Sets
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={sets}
                  onChange={(e) => setSets(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Target Repetitions
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={reps}
                  onChange={(e) => setReps(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            {/* Clinical Note / Instructions */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Clinical Prescription Note (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="e.g. Perform 1 set in morning, 2 sets before bedtime. Emphasize slow exhalation during contraction."
                className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                maxLength={500}
              />
              <span className="text-[10px] text-zinc-400 block text-right mt-0.5">
                {note.length}/500 chars
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Prescribing...' : 'Prescribe Protocol'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
