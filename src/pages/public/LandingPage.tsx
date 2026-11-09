import React, { useState } from 'react';
import { FindPhysioHeroCard } from '../../components/public/FindPhysioHeroCard.tsx';
import { PainCheckTeaser } from '../../components/public/PainCheckTeaser.tsx';
import { HowItWorksSection } from '../../components/public/HowItWorksSection.tsx';
import { FeaturesGrid } from '../../components/public/FeaturesGrid.tsx';
import { PlansPreview } from '../../components/public/PlansPreview.tsx';
import { TestimonialsCarousel } from '../../components/public/TestimonialsCarousel.tsx';
import { TrustCounters } from '../../components/public/TrustCounters.tsx';
import { FaqAccordion } from '../../components/public/FaqAccordion.tsx';
import { Footer } from '../../components/public/Footer.tsx';
import { TherapistProfileModal, TherapistDetails } from '../../components/public/TherapistProfileModal.tsx';
import { ArrowRight, Sparkles, ShieldCheck, Stethoscope, CheckCircle2, UserCheck } from 'lucide-react';

interface LandingPageProps {
  onStartBooking: (therapist: TherapistDetails, area?: string) => void;
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartBooking,
  onNavigateLogin,
  onNavigateRegister,
}) => {
  const [selectedTherapist, setSelectedTherapist] = useState<TherapistDetails | null>(null);

  const handleSelectTherapist = (therapist: TherapistDetails) => {
    setSelectedTherapist(therapist);
  };

  const handleBookFromCard = (therapist: TherapistDetails, area: string) => {
    onStartBooking(therapist, area);
  };

  const handleBookFromModal = (therapist: TherapistDetails) => {
    setSelectedTherapist(null);
    onStartBooking(therapist);
  };

  const scrollToHeroSearch = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-zinc-200 dark:border-zinc-800">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-teal-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 text-xs font-bold mb-4 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Pakistan's Premier Physiotherapy Care Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
              Regain Pain-Free Movement with{' '}
              <span className="text-teal-600 dark:text-teal-400">Verified Physiotherapists</span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-4 leading-relaxed max-w-2xl mx-auto">
              Find licensed physical therapists in Karachi, Lahore, Islamabad & across Pakistan.
              Book in-clinic, home visits, or video calls tailored to your budget. Track daily pain and follow video exercise routines.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={scrollToHeroSearch}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/25 transition-all"
              >
                <span>Find My Physio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onNavigateRegister}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-bold text-sm shadow-2xs transition-all"
              >
                <UserCheck className="w-4 h-4 text-teal-600" />
                <span>Create Free Account</span>
              </button>
            </div>
          </div>

          {/* Interactive Hero "Find my Physio" Card */}
          <div className="max-w-4xl mx-auto">
            <FindPhysioHeroCard
              onSelectTherapist={handleSelectTherapist}
              onBookTherapist={handleBookFromCard}
            />
          </div>
        </div>
      </section>

      {/* Trust Counters */}
      <TrustCounters />

      {/* Interactive Pain Check Teaser */}
      <PainCheckTeaser onFindPhysio={scrollToHeroSearch} />

      {/* How It Works Steps */}
      <HowItWorksSection />

      {/* Features Grid */}
      <FeaturesGrid />

      {/* Plans & Pricing Preview */}
      <PlansPreview onSelectPlan={() => onNavigateRegister()} />

      {/* Patient Testimonials */}
      <TestimonialsCarousel />

      {/* FAQ Accordion */}
      <FaqAccordion />

      {/* Final Call to Action */}
      <section className="py-16 bg-gradient-to-tr from-teal-800 via-teal-700 to-emerald-700 text-white transition-all">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-4 backdrop-blur-xs">
            <CheckCircle2 className="w-4 h-4 text-teal-200" />
            <span>Start Your Rehabilitation Today</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Take Your First Step Towards Recovery
          </h2>

          <p className="text-teal-100 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Join thousands of patients across Pakistan recovering with evidence-based physical therapy.
            Transparent PKR fees, certified doctors of physical therapy, and daily progress tracking.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onNavigateRegister}
              className="px-7 py-3.5 rounded-2xl bg-white hover:bg-zinc-100 text-teal-900 font-black text-sm shadow-xl transition-all"
            >
              Register as Patient
            </button>
            <button
              onClick={onNavigateLogin}
              className="px-6 py-3.5 rounded-2xl bg-teal-900/60 hover:bg-teal-900/80 text-white border border-teal-500/50 font-bold text-sm transition-all"
            >
              Sign In to Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Detailed Therapist Profile Modal */}
      <TherapistProfileModal
        therapist={selectedTherapist}
        onClose={() => setSelectedTherapist(null)}
        onBook={handleBookFromModal}
      />
    </div>
  );
};
