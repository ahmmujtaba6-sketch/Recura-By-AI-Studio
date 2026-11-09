import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, ArrowRight, ShieldCheck, Check, AlertCircle, Sparkles } from 'lucide-react';
import { TherapistDetails } from './TherapistProfileModal.tsx';

const CITIES = [
  'All Cities',
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Peshawar',
  'Quetta',
  'Faisalabad',
  'Multan',
];

const BODY_AREAS = [
  'Lower Back',
  'Neck & Shoulders',
  'Knee',
  'Shoulder',
  'Ankle & Foot',
  'Post-Surgery',
];

interface FindPhysioHeroCardProps {
  onSelectTherapist: (therapist: TherapistDetails) => void;
  onBookTherapist: (therapist: TherapistDetails, area: string) => void;
}

export const FindPhysioHeroCard: React.FC<FindPhysioHeroCardProps> = ({
  onSelectTherapist,
  onBookTherapist,
}) => {
  const [selectedArea, setSelectedArea] = useState<string>(BODY_AREAS[0]);
  const [selectedCity, setSelectedCity] = useState<string>('Karachi');
  const [budget, setBudget] = useState<number>(3000);
  const [therapists, setTherapists] = useState<TherapistDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Initial fetch and on search triggers
  const fetchMatches = async (city: string, maxFee: number, area: string) => {
    setLoading(true);
    try {
      let url = `/api/therapists/public?maxFee=${maxFee}&limit=3`;
      if (city !== 'All Cities') {
        url += `&city=${encodeURIComponent(city)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTherapists(data.therapists || []);
      }
    } catch (err) {
      console.error('Failed to search therapists:', err);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  useEffect(() => {
    fetchMatches(selectedCity, budget, selectedArea);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMatches(selectedCity, budget, selectedArea);
  };

  const handleIncreaseBudget = () => {
    const newBudget = Math.min(5000, budget + 500);
    setBudget(newBudget);
    fetchMatches(selectedCity, newBudget, selectedArea);
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 backdrop-blur-md transition-all">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
              Find My Physiotherapist
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Filter licensed practitioners by your pain area and PKR budget
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex text-[11px] font-semibold text-teal-700 dark:text-teal-300 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800">
          Instant Matches
        </span>
      </div>

      <form onSubmit={handleSearch} className="space-y-5">
        {/* Body Area Chips */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            1. Select Body Area or Complaint
          </label>
          <div className="flex flex-wrap gap-2">
            {BODY_AREAS.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setSelectedArea(area)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedArea === area
                    ? 'bg-teal-600 text-white shadow-xs scale-102'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* City and Budget Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              2. Your City in Pakistan
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                3. Maximum Budget
              </label>
              <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400">
                PKR {budget.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={5000}
              step={100}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              aria-label="Consultation budget in Pakistani Rupees"
              className="w-full accent-teal-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              <span>PKR 1,000</span>
              <span>PKR 3,000</span>
              <span>PKR 5,000</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/25 transition-all"
        >
          <Search className="w-4 h-4" />
          <span>Show Matching Physiotherapists</span>
        </button>
      </form>

      {/* Live Results Section */}
      <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Top Available Matches {selectedCity !== 'All Cities' && `in ${selectedCity}`}
          </p>
          <span className="text-xs text-zinc-400">
            {therapists.length} result{therapists.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center text-zinc-400 gap-2">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Finding available therapists...</span>
          </div>
        ) : therapists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {therapists.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 hover:border-teal-500 dark:hover:border-teal-500 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                      <Check className="w-2.5 h-2.5" /> Within budget
                    </span>
                    <div className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{t.rating}</span>
                    </div>
                  </div>

                  <h3
                    onClick={() => onSelectTherapist(t)}
                    className="font-bold text-zinc-900 dark:text-white text-sm group-hover:text-teal-600 cursor-pointer transition-colors line-clamp-1"
                  >
                    {t.name}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                    {t.speciality}
                  </p>

                  <div className="mt-2 text-xs flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                      {t.city}
                    </span>
                    <span className="font-extrabold text-teal-600 dark:text-teal-400">
                      PKR {t.fee.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectTherapist(t)}
                    className="flex-1 text-center py-1.5 px-2 rounded-lg bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-xs font-semibold border border-zinc-200 dark:border-zinc-600 transition-colors"
                  >
                    View Bio
                  </button>
                  <button
                    type="button"
                    onClick={() => onBookTherapist(t, selectedArea)}
                    className="flex-1 text-center py-1.5 px-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                  >
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-center">
            <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              No matching physiotherapist found at PKR {budget.toLocaleString()} in {selectedCity}.
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
              Top specialized spine and neuro physiotherapists in this region start around PKR {(budget + 500).toLocaleString()}.
            </p>
            <button
              type="button"
              onClick={handleIncreaseBudget}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>No match, try +PKR 500</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
