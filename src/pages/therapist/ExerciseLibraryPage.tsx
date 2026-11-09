import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Play,
  Edit,
  Trash2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  X,
  ListOrdered,
  Dumbbell
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';
import { AssignExerciseModal } from '../../components/therapist/AssignExerciseModal.tsx';

const CATEGORIES = [
  'All Categories',
  'Lower Back & Spine',
  'Pelvis & Core',
  'Mid Back & Posture',
  'Neck & Shoulders',
  'Knee & Lower Limb',
  'Post-Surgical Rehab',
];

export const ExerciseLibraryPage: React.FC = () => {
  const { showToast } = useToast();

  const [tutorials, setTutorials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Create / Edit modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTutId, setEditingTutId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Lower Back & Spine');
  const [minutes, setMinutes] = useState(10);
  const [steps, setSteps] = useState<string[]>([
    'Position yourself comfortably with spine in neutral alignment.',
    'Slowly initiate movement while breathing out, engaging targeted stabilizers.',
    'Hold gently at end-range for 3-5 seconds without forcing against resistance.',
  ]);
  const [safetyNote, setSafetyNote] = useState('Stop immediately if pain increases sharply or radiates.');
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=sI9f9jT5gRs');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign modal state
  const [assignTutorialId, setAssignTutorialId] = useState<number | null>(null);

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/therapist-workspace/tutorials');
      if (!res.ok) throw new Error('Failed to load exercise tutorials');
      const data = await res.json();
      setTutorials(data.tutorials || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTutId(null);
    setTitle('');
    setCategory('Lower Back & Spine');
    setMinutes(10);
    setSteps([
      'Position yourself comfortably with spine in neutral alignment.',
      'Slowly initiate movement while breathing out, engaging targeted stabilizers.',
      'Hold gently at end-range for 3-5 seconds without forcing against resistance.',
    ]);
    setSafetyNote('Stop immediately if pain increases sharply or radiates.');
    setVideoUrl('https://www.youtube.com/watch?v=sI9f9jT5gRs');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (tut: any) => {
    setEditingTutId(tut.id);
    setTitle(tut.title);
    setCategory(tut.category);
    setMinutes(tut.minutes || 10);
    setSteps(Array.isArray(tut.steps) ? tut.steps : ['Step 1', 'Step 2', 'Step 3']);
    setSafetyNote(tut.safety_note || 'Stop immediately if pain increases sharply.');
    setVideoUrl(tut.video_url || '');
    setIsEditorOpen(true);
  };

  const handleAddStep = () => {
    if (steps.length >= 6) {
      showToast('Maximum 6 clinical steps allowed per routine', 'info');
      return;
    }
    setSteps([...steps, '']);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 3) {
      showToast('A minimum of 3 clinical steps is required for safety guidance', 'info');
      return;
    }
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);
    if (cleanSteps.length < 3) {
      showToast('Please provide at least 3 detailed clinical steps', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingTutId
        ? `/api/therapist-workspace/tutorials/${editingTutId}`
        : '/api/therapist-workspace/tutorials';
      const method = editingTutId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          minutes: Number(minutes),
          steps: cleanSteps,
          safety_note: safetyNote.trim(),
          video_url: videoUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save tutorial');

      showToast(data.message || 'Tutorial saved to library!', 'success');
      setIsEditorOpen(false);
      fetchTutorials();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tutId: number) => {
    if (!window.confirm('Are you sure you want to remove this tutorial from your library?')) return;

    try {
      const res = await fetch(`/api/therapist-workspace/tutorials/${tutId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete tutorial');
      showToast('Tutorial removed.', 'info');
      fetchTutorials();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredTutorials = tutorials.filter((t) => {
    if (selectedCategory === 'All Categories') return true;
    return t.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Clinical Protocols</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            Exercise Tutorial Library
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
            Author and organize evidence-based exercise routines with step-by-step instructions, safety guardrails, and instructional video demos for patient assignment.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Routine</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
              selectedCategory === cat
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tutorials Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs">Loading exercise library...</span>
        </div>
      ) : filteredTutorials.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <BookOpen className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">No Exercises in this Category</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Click &ldquo;Create New Routine&rdquo; to add a custom clinical protocol.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTutorials.map((tut) => {
            const stepsList: string[] = Array.isArray(tut.steps) ? tut.steps : [];

            return (
              <div
                key={tut.id}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-teal-500/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      {tut.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tut.is_mine
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {tut.is_mine ? 'My Routine' : 'RECURA Library'}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-zinc-900 dark:text-white mt-2">
                    {tut.title}
                  </h3>

                  <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>{tut.minutes || 10} Minutes</span>
                    <span>•</span>
                    <span>{stepsList.length} Steps</span>
                  </div>

                  {/* Steps preview */}
                  <div className="mt-3.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Instructions Preview
                    </span>
                    {stepsList.slice(0, 2).map((s, idx) => (
                      <p key={idx} className="line-clamp-2">
                        <strong className="text-zinc-800 dark:text-zinc-200">{idx + 1}.</strong> {s}
                      </p>
                    ))}
                    {stepsList.length > 2 && (
                      <span className="text-[10px] text-teal-600 font-semibold block pt-0.5">
                        +{stepsList.length - 2} more clinical steps
                      </span>
                    )}
                  </div>

                  {/* Safety note */}
                  {tut.safety_note && (
                    <div className="mt-2.5 p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                      <span className="line-clamp-2">{tut.safety_note}</span>
                    </div>
                  )}

                  {/* Video Link */}
                  {tut.video_url && (
                    <a
                      href={tut.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Watch Video Demonstration</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                    </a>
                  )}
                </div>

                {/* Card footer actions */}
                <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <button
                    onClick={() => setAssignTutorialId(tut.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign to Patient</span>
                  </button>

                  {tut.is_mine && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(tut)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                        title="Edit Tutorial"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tut.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-400 hover:text-rose-600 transition-colors"
                        title="Delete Tutorial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT TUTORIAL MODAL */}
      {isEditorOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditorOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Exercise Protocol Editor</span>
            </div>

            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              {editingTutId ? 'Edit Exercise Routine' : 'Create New Exercise Routine'}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Add clear 3-6 clinical execution steps and safety parameters.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Routine Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Quad Sets & Terminal Knee Extensions"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Anatomical Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Lower Back & Spine">Lower Back & Spine</option>
                    <option value="Pelvis & Core">Pelvis & Core</option>
                    <option value="Mid Back & Posture">Mid Back & Posture</option>
                    <option value="Neck & Shoulders">Neck & Shoulders</option>
                    <option value="Knee & Lower Limb">Knee & Lower Limb</option>
                    <option value="Post-Surgical Rehab">Post-Surgical Rehab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value) || 10))}
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <ListOrdered className="w-3.5 h-3.5 text-teal-600" />
                    <span>Step-by-Step Instructions ({steps.length}/6 steps)</span>
                  </label>
                  {steps.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddStep}
                      className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Step</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {steps.map((st, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-6 h-9 flex items-center justify-center font-bold text-xs text-zinc-400">
                        {i + 1}.
                      </span>
                      <textarea
                        rows={2}
                        value={st}
                        onChange={(e) => handleStepChange(i, e.target.value)}
                        placeholder={`Clinical instruction for step ${i + 1}...`}
                        className="flex-1 py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                        required
                      />
                      {steps.length > 3 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(i)}
                          className="p-2 text-zinc-400 hover:text-rose-500"
                          title="Remove Step"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Note */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Safety Warning & Contraindications
                </label>
                <input
                  type="text"
                  value={safetyNote}
                  onChange={(e) => setSafetyNote(e.target.value)}
                  placeholder="e.g. Stop immediately if numbness or shooting pain occurs down the leg."
                  className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Video Demonstration Link (YouTube, Vimeo, etc.)
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all"
                >
                  {isSubmitting ? 'Saving...' : editingTutId ? 'Update Routine' : 'Save Routine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      <AssignExerciseModal
        isOpen={Boolean(assignTutorialId)}
        onClose={() => setAssignTutorialId(null)}
        defaultTutorialId={assignTutorialId}
        onSuccess={fetchTutorials}
      />
    </div>
  );
};
