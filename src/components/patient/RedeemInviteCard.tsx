import React, { useState } from 'react';
import { UserPlus, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';

interface RedeemInviteCardProps {
  onSuccess?: () => void;
}

export const RedeemInviteCard: React.FC<RedeemInviteCardProps> = ({ onSuccess }) => {
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedTherapist, setLinkedTherapist] = useState<any>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      showToast('Please enter an invite code', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/patients/redeem-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to redeem invite code');

      showToast(data.message || 'Connected with physiotherapist!', 'success', 'Linked');
      setLinkedTherapist(data.therapist);
      setCode('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
      <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 mb-1.5">
        <UserPlus className="w-4 h-4" />
        <span className="text-[11px] font-bold uppercase tracking-wider">Connect Your Physio</span>
      </div>

      <h3 className="font-bold text-base text-zinc-900 dark:text-white">
        Have a Code from Your Physiotherapist?
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
        Enter your practitioner&apos;s 8-character invite code (e.g. <strong className="text-teal-600">REC-XXXX</strong>) to link your records and receive exercise prescriptions.
      </p>

      {linkedTherapist ? (
        <div className="mt-4 p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Connected with <strong>{linkedTherapist.name}</strong> ({linkedTherapist.speciality})
            </span>
          </div>
          <button
            onClick={() => setLinkedTherapist(null)}
            className="text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline"
          >
            Dismiss
          </button>
        </div>
      ) : (
        <form onSubmit={handleRedeem} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. REC-7821"
            className="flex-1 py-2 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-teal-500"
            maxLength={12}
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5"
          >
            <span>{isSubmitting ? 'Linking...' : 'Connect Physio'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
