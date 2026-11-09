import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Activity,
  Dumbbell,
  FileText,
  Plus,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';
import { PatientClinicalModal } from '../../components/therapist/PatientClinicalModal.tsx';
import { AssignExerciseModal } from '../../components/therapist/AssignExerciseModal.tsx';

export const MyPatientsPage: React.FC = () => {
  const { showToast } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [assignPatientId, setAssignPatientId] = useState<number | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/therapist-workspace/patients');
      if (!res.ok) throw new Error('Failed to load patient roster');
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.primary_complaint_area?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q)
    );
  });

  // Render a clean SVG sparkline from the 7-day scores
  const renderSparkline = (sparkline: { date: string; score: number }[]) => {
    if (!sparkline || sparkline.length < 2) {
      return (
        <span className="text-[10px] text-zinc-400 italic">No trend data</span>
      );
    }

    const width = 80;
    const height = 24;
    const padding = 2;
    const maxScore = 10;
    const minScore = 0;

    const points = sparkline.map((item, index) => {
      const x = padding + (index / (sparkline.length - 1)) * (width - 2 * padding);
      // Invert Y so high score is at top
      const y = height - padding - ((item.score - minScore) / (maxScore - minScore)) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const lastScore = sparkline[sparkline.length - 1]?.score || 0;
    const strokeColor = lastScore >= 8 ? '#e11d48' : lastScore >= 4 ? '#f59e0b' : '#0d9488';

    return (
      <div className="flex items-center gap-1.5">
        <svg width={width} height={height} className="overflow-visible">
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Clinical Patient Caseload</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            My Linked Patients
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
            Monitor clinical recovery paths, inspect 7-day pain trajectories, review biometrics, and prescribe personalized physiotherapy protocols.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAssignPatientId(patients[0]?.id || null)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Prescribe Protocol</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patients by name, phone, or complaint area..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          Showing <strong>{filteredPatients.length}</strong> of {patients.length} registered patients
        </div>
      </div>

      {/* Patients Roster List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-medium">Loading clinical roster...</span>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <Users className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">No Patients Found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Try modifying your search criteria.'
              : 'Patients who book sessions or accept your invite codes will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredPatients.map((patient) => {
            const latestScore = patient.latestPain?.score;
            const isHigh = latestScore !== undefined && latestScore >= 8;
            const isModerate = latestScore !== undefined && latestScore >= 4 && latestScore < 8;

            return (
              <div
                key={patient.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500/60 transition-all shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Patient Identity & Complaint */}
                <div className="flex items-start gap-3.5 min-w-[260px]">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-lg shrink-0">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                        {patient.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {patient.plan} plan
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {patient.primary_complaint_area || 'Musculoskeletal'}
                      </span>
                      <span>•</span>
                      <span>Duration: {patient.primary_complaint_duration || 'Ongoing'}</span>
                      <span>•</span>
                      <span>{patient.city || 'Pakistan'}</span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-zinc-400">
                      <span>{patient.phone || 'No phone'}</span>
                      <span>•</span>
                      <span>{patient.gender || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                {/* Center: Clinical Status Metrics */}
                <div className="grid grid-cols-3 gap-3 border-t lg:border-t-0 border-zinc-100 dark:border-zinc-800/80 pt-3 lg:pt-0">
                  {/* Latest Pain Score */}
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider">
                      Latest VAS Pain
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      {latestScore !== undefined ? (
                        <>
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center text-white ${
                              isHigh
                                ? 'bg-rose-600'
                                : isModerate
                                ? 'bg-amber-500'
                                : 'bg-teal-600'
                            }`}
                          >
                            {latestScore}
                          </span>
                          <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                            / 10
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-zinc-400">No logs</span>
                      )}
                    </div>
                  </div>

                  {/* 7-Day Sparkline */}
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider">
                      7-Day Trend
                    </span>
                    <div className="mt-1">
                      {renderSparkline(patient.sparkline)}
                    </div>
                  </div>

                  {/* Exercise Compliance */}
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider">
                      Compliance (7d)
                    </span>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-sm font-black text-zinc-900 dark:text-white">
                        {patient.exerciseCompletionRate}%
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        ({patient.activeAssignmentsCount} active)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1 rounded-full mt-1 overflow-hidden">
                      <div
                        className="bg-teal-600 h-1 rounded-full"
                        style={{ width: `${patient.exerciseCompletionRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 border-t lg:border-t-0 border-zinc-100 dark:border-zinc-800/80 pt-3 lg:pt-0 shrink-0">
                  <button
                    onClick={() => setSelectedPatientId(patient.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Clinical File</span>
                  </button>

                  <button
                    onClick={() => setAssignPatientId(patient.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Prescribe</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Patient Clinical File Modal */}
      <PatientClinicalModal
        patientId={selectedPatientId}
        isOpen={Boolean(selectedPatientId)}
        onClose={() => setSelectedPatientId(null)}
        onRefresh={fetchPatients}
      />

      {/* Assign Exercise Modal */}
      <AssignExerciseModal
        isOpen={Boolean(assignPatientId)}
        onClose={() => setAssignPatientId(null)}
        defaultPatientId={assignPatientId}
        onSuccess={fetchPatients}
      />
    </div>
  );
};
