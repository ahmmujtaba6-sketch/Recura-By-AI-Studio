import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'How does booking an appointment work on Recura?',
    a: 'You can search verified physiotherapists by body pain area, city, and your PKR budget. Select a convenient date and 30-minute slot from their active availability schedule. You will choose whether you want an in-clinic visit, a home visit, or an online telehealth video session. Once submitted, your booking status is set to "Requested" until confirmed by the practitioner.',
  },
  {
    q: 'Which payment methods are accepted in Pakistan?',
    a: 'Recura supports simulated local payments via JazzCash, Easypaisa, Pakistani Debit/Credit Cards (PayPak, Visa, Mastercard), and direct cash at clinic. You receive an instant digital receipt and invoice.',
  },
  {
    q: 'What is the difference between In-Clinic, Home Visit, and Video Call?',
    a: 'In-clinic sessions take place at the therapist’s registered clinic with specialized clinical modalities. Home visits bring licensed physical therapy care directly to your residence (available on Basic and Premium plans). Video calls allow remote visual assessment, range of motion analysis, and exercise correction from anywhere.',
  },
  {
    q: 'Do I need a doctor referral or MRI to start physiotherapy?',
    a: 'No prior doctor referral is mandatory. Licensed physical therapists are primary contact healthcare practitioners qualified to conduct differential musculoskeletal evaluations. However, if you already have MRI or X-ray reports, you can share them with your physiotherapist during your session.',
  },
  {
    q: 'How does daily pain tracking and exercise logging help my recovery?',
    a: 'Tracking your pain daily on the 0-10 Visual Analogue Scale allows your therapist to detect whether protocols are improving joint mobility or aggravating inflammation. If your score spikes to 8 or above, an automated priority alert notifies both you and your therapist.',
  },
  {
    q: 'How are physical therapists verified on the platform?',
    a: 'All therapists must provide their Pakistan Medical and Dental Council (PMDC) or Pakistan Council of Physical Therapy (PCP) registration number, proof of clinical degree (DPT / MSPT), and clinical experience. Our administrative team manually verifies credentials before approving a therapist profile.',
  },
  {
    q: 'Can I reschedule or cancel my booked session?',
    a: 'Yes. You can reschedule or cancel directly from your "My Appointments" portal. Rescheduling lets you select any other open slot on the therapist’s schedule without penalty.',
  },
  {
    q: 'Is my health data and pain log history confidential?',
    a: 'Yes. In accordance with clinical privacy standards, only you and your linked treating physiotherapist have access to your daily pain entries, medical history, and clinical comments. Role-based server authorization strictly isolates patient records.',
  },
];

export const FaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="py-16 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 text-xs font-bold mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Got Questions? We've Got Answers
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Everything you need to know about booking, treatment plans, and our clinical care model.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-zinc-900 dark:text-white text-sm sm:text-base hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-teal-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/60 pt-3 animate-in fade-in duration-150">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
