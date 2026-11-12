import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Send,
  MessageSquare,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const HelpPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState(
    user?.role === 'patient'
      ? user.patient_profile?.name || ''
      : user?.role === 'therapist'
      ? user.therapist_profile?.name || ''
      : ''
  );
  const [email, setEmail] = useState(user?.email || '');
  const [category, setCategory] = useState<'billing' | 'appointments' | 'exercises' | 'therapist_verification' | 'other'>('appointments');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFaqsAndTickets();
  }, []);

  const fetchFaqsAndTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/support/faqs');
      if (res.ok) {
        const data = await res.json();
        setFaqs(data.faqs || []);
      }

      if (user) {
        const tRes = await fetch('/api/support/tickets/my');
        if (tRes.ok) {
          const tData = await tRes.json();
          setMyTickets(tData.tickets || []);
        }
      }
    } catch {
      console.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Support ticket filed successfully! Our team will get back to you.', 'success');
        setMessage('');
        if (user) {
          setMyTickets([data.ticket, ...myTickets]);
        }
      } else {
        showToast(data.error || 'Failed to submit ticket', 'error');
      }
    } catch {
      showToast('Network error filing ticket', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            Help Center & Clinical Support
          </h1>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Frequently asked questions, verified billing policies, and direct technical & clinical assistance.
        </p>
      </div>

      {/* Prominent Medical Emergency Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-bold text-amber-950 dark:text-amber-100">
            Important Medical Notice & Emergency Hotline
          </p>
          <p className="mt-0.5">
            Recura does not diagnose or replace emergency care. If you are experiencing sudden severe chest pain, shortness of breath, acute spinal trauma, or unmanageable neurological deficits, please immediately call <strong>1122 (Pakistan Rescue)</strong> or proceed to the nearest emergency trauma department.
          </p>
        </div>
      </div>

      {/* Two-Column Grid: FAQs on left, Ticket submission on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* FAQs Accordion */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {faqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                    className="w-full text-left p-4 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-zinc-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-teal-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-100 dark:border-zinc-800">
                      <p>{faq.answer}</p>
                      <span className="inline-block mt-2 text-[10px] uppercase font-semibold text-teal-600 dark:text-teal-400">
                        Category: {faq.category}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pakistan Contact Info Card */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-teal-600" />
              <span>National Assistance Lines (Pakistan)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-zinc-600 dark:text-zinc-300 text-[11px]">
              <div>Emergency Rescue: <strong className="text-zinc-900 dark:text-white">1122</strong></div>
              <div>Edhi Ambulance: <strong className="text-zinc-900 dark:text-white">115</strong></div>
              <div>Chhipa Welfare: <strong className="text-zinc-900 dark:text-white">1020</strong></div>
            </div>
          </div>
        </div>

        {/* Submit Ticket Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Submit a Support Ticket
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Need assistance with an appointment, payment status, or practitioner onboarding? Send us a message.
            </p>

            <form onSubmit={handleSubmitTicket} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Hamza Abbasi"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="appointments">Appointments & Scheduling</option>
                  <option value="billing">Billing & Payments (JazzCash / Easypaisa)</option>
                  <option value="exercises">Exercise Protocols & Tutorials</option>
                  <option value="therapist_verification">Therapist PMR Licensing</option>
                  <option value="other">General Feedback / Inquiries</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Message Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting Ticket...' : 'File Support Ticket'}</span>
              </button>
            </form>
          </div>

          {/* User's Previous Tickets */}
          {user && myTickets.length > 0 && (
            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
              <h3 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">
                My Support Tickets ({myTickets.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {myTickets.map((t) => (
                  <div key={t.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-teal-600">#{t.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          t.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <p className="mt-1 text-zinc-700 dark:text-zinc-300 line-clamp-2">{t.message}</p>
                    <p className="mt-1 text-[10px] text-zinc-400">{new Date(t.created_at).toLocaleDateString('en-PK')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
