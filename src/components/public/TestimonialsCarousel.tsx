import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote, ShieldAlert } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Kamran Javed',
    city: 'Karachi',
    condition: 'Chronic Lumbar Disc Bulge (L4-L5)',
    recoveryTime: '8 Weeks',
    quote: 'I had severe lower back stiffness from sitting 9 hours daily. Through Recura, I connected with Dr. Ayesha in Clifton. The daily 0-10 pain tracker and glute bridge protocols gave me structure. My morning pain dropped from an 8 to 2.',
    rating: 5,
  },
  {
    name: 'Amina Tariq',
    city: 'Lahore',
    condition: 'Post-ACL Knee Arthroscopy Rehabilitation',
    recoveryTime: '12 Weeks',
    quote: 'Finding a reliable sports physiotherapist in Gulberg within my PKR 3,000 budget was effortless. The video tutorials showed me exact knee extension angles without risking reinjury. The home visit option made the first 3 weeks stress-free.',
    rating: 5,
  },
  {
    name: 'Sohail Mansoor',
    city: 'Islamabad',
    condition: 'Cervical Neck Strain & Tension Headaches',
    recoveryTime: '4 Weeks',
    quote: 'The video consultation saved me from commuting during severe neck spasms. Dr. Fatima prescribed thoracic foam roller mobilizations and ergonomic desk adjustments. Recura made physiotherapy accessible and transparent.',
    rating: 5,
  },
];

export const TestimonialsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => {
    setCurrentIndex((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1));
  };

  const next = () => {
    setCurrentIndex((prev) => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1));
  };

  const current = TESTIMONIALS[currentIndex];

  return (
    <section className="py-16 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Real Recovery Journeys
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight mt-1">
            Stories from Patients Across Pakistan
          </h2>
        </div>

        <div className="relative p-6 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
          {/* Top Label */}
          <div className="flex items-center justify-between mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 text-xs font-extrabold">
              Sample story
            </span>
            <div className="flex items-center gap-1">
              {[...Array(current.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>

          <Quote className="w-10 h-10 text-teal-500/20 mb-3" />

          {/* Testimonial Quote */}
          <div aria-live="polite" className="min-h-[110px]">
            <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 leading-relaxed italic">
              "{current.quote}"
            </p>
          </div>

          {/* Patient Details */}
          <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-base">
                {current.name}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {current.city}, Pakistan • Condition: <strong className="text-teal-600 dark:text-teal-400 font-semibold">{current.condition}</strong>
              </p>
            </div>

            <div className="text-xs px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 text-teal-800 dark:text-teal-300 w-fit">
              Recovery: <strong>{current.recoveryTime}</strong>
            </div>
          </div>

          {/* Carousel Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    currentIndex === idx ? 'w-6 bg-teal-600' : 'w-2 bg-zinc-300 dark:bg-zinc-700'
                  }`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
