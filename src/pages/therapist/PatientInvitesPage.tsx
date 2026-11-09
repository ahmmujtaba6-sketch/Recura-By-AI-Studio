import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Copy,
  CheckCircle2,
  Share2,
  Clock,
  Sparkles,
  Phone,
  User,
  ShieldCheck,
  Send
} from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const PatientInvitesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [invites, setInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<{
    code: string;
    messageTemplate: string;
  } | null>(null);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/therapist-workspace/invites');
      if (!res.ok) throw new Error('Failed to load invites');
      const data = await res.json();
      setInvites(data.invites || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch('/api/therapist-workspace/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientName.trim(),
          patient_phone: patientPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate invite');

      setLastGenerated({
        code: data.code,
        messageTemplate: data.messageTemplate,
      });

      showToast(`Invite code ${data.code} generated!`, 'success');
      setPatientName('');
      setPatientPhone('');
      fetchInvites();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Invitation message copied to clipboard!', 'info', 'Copied');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Code ${code} copied!`, 'info', 'Copied');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-2">
          <UserPlus className="w-3.5 h-3.5" />
          <span>Patient Onboarding & Linking</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
          Invite Patients to RECURA
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
          Generate unique invite codes for your existing private clinic or home-visit patients. When they enter the code in their portal, their account automatically links to your clinical caseload.
        </p>
      </div>

      {/* Grid: Code Generator & Generated Code Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator Form */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-1">
            Create Patient Connection Code
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
            Generates a unique <code className="text-teal-600 font-bold">REC-XXXX</code> code and formatted WhatsApp invitation.
          </p>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Patient Name (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Asad Qureshi"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Patient Mobile Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="+92 300 1234567 or 03001234567"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? 'Generating Code...' : 'Generate Connection Code'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Recently Generated Code / Preview Box */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-50 via-emerald-50/50 to-white dark:from-teal-950/40 dark:via-zinc-900 dark:to-zinc-900 border border-teal-200/80 dark:border-teal-800/60 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                Ready to Send
              </span>
              <Share2 className="w-4 h-4 text-teal-600" />
            </div>

            {lastGenerated ? (
              <div className="space-y-3 animate-in fade-in">
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-850 border border-teal-200 dark:border-teal-800 text-center">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block tracking-widest">
                    Connection Code
                  </span>
                  <div className="text-3xl font-black text-teal-600 dark:text-teal-400 tracking-wider mt-1">
                    {lastGenerated.code}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    WhatsApp / SMS Invite Message:
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-white/80 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-700 leading-relaxed italic">
                    &ldquo;{lastGenerated.messageTemplate}&rdquo;
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleCopyMessage(lastGenerated.messageTemplate)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Message</span>
                  </button>
                  <button
                    onClick={() => handleCopyCode(lastGenerated.code)}
                    className="py-2.5 px-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs border border-zinc-200 dark:border-zinc-700 transition-colors"
                  >
                    Copy Code Only
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
                <Send className="w-8 h-8 text-teal-500/60 mx-auto" />
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  No invite code generated yet this session.
                </p>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                  Fill in the patient details on the left to produce a ready-to-share SMS/WhatsApp message.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-teal-200/60 dark:border-zinc-800 text-[11px] text-zinc-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Codes are single-use and automatically expire once redeemed by a patient.</span>
          </div>
        </div>
      </div>

      {/* Previously Generated Invites Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-zinc-900 dark:text-white">
            Connection Code History
          </h3>
          <span className="text-xs text-zinc-400">
            {invites.length} total codes issued
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-zinc-500">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs">Loading history...</span>
          </div>
        ) : invites.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            No invite codes created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Invite Code</th>
                  <th className="pb-3">Patient Name</th>
                  <th className="pb-3">Mobile</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {invites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 font-mono font-bold text-teal-600 dark:text-teal-400 text-sm">
                      {inv.code}
                    </td>
                    <td className="py-3 font-medium text-zinc-900 dark:text-white">
                      {inv.patient_name || '—'}
                    </td>
                    <td className="py-3 text-zinc-500">
                      {inv.patient_phone || '—'}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.used
                            ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {inv.used ? 'Redeemed' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-400">
                      {inv.created_at?.split(' ')[0] || inv.created_at}
                    </td>
                    <td className="py-3 text-right">
                      {!inv.used && (
                        <button
                          onClick={() => handleCopyCode(inv.code)}
                          className="text-teal-600 hover:text-teal-700 font-bold hover:underline"
                        >
                          Copy Code
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
