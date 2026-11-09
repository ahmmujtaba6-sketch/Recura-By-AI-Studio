import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import {
  Search as SearchIcon,
  Filter,
  MapPin,
  Star,
  Heart,
  Calendar,
  Clock,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { TherapistDetails, TherapistProfileModal } from '../../components/public/TherapistProfileModal.tsx';
import { BookingModal } from '../../components/booking/BookingModal.tsx';

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

const SPECIALITIES = [
  'All Specialities',
  'Musculoskeletal & Sports',
  'Orthopaedic & Spine',
  'Neurological & Stroke',
  'Sports Injury & Knee',
  "Women's Health & Pelvic",
  'Geriatric & Joint',
  'Paediatric',
];

export const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [allTherapists, setAllTherapists] = useState<TherapistDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(user?.patient_profile?.city || 'All Cities');
  const [selectedSpeciality, setSelectedSpeciality] = useState('All Specialities');
  const [budget, setBudget] = useState<number>(4000);
  const [enableBudgetLimit, setEnableBudgetLimit] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'best_match' | 'rating' | 'price_asc' | 'price_desc'>('best_match');
  const [availableTodayOnly, setAvailableTodayOnly] = useState<boolean>(false);
  const [showFavouritesOnly, setShowFavouritesOnly] = useState<boolean>(false);

  // Favourites list
  const [favourites, setFavourites] = useState<number[]>([]);

  // Modals state
  const [selectedTherapistForModal, setSelectedTherapistForModal] = useState<TherapistDetails | null>(null);
  const [selectedTherapistForBooking, setSelectedTherapistForBooking] = useState<TherapistDetails | null>(null);

  const todayWeekday = new Date().getDay(); // 0 is Sunday, 1 is Monday ...

  // Fetch therapists and favourites
  useEffect(() => {
    const fetchTherapists = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/therapists/public');
        if (res.ok) {
          const data = await res.json();
          setAllTherapists(data.therapists || []);
        }
      } catch (err) {
        console.error('Failed to load therapists:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchFavourites = async () => {
      if (user?.role === 'patient') {
        try {
          const res = await fetch('/api/patients/favourites');
          if (res.ok) {
            const data = await res.json();
            setFavourites(data.favourites || []);
          }
        } catch (err) {
          console.error('Failed to load favourites:', err);
        }
      }
    };

    fetchTherapists();
    fetchFavourites();
  }, [user]);

  // Toggle favourite
  const handleToggleFavourite = async (therapistId: number) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/patients/favourites/${therapistId}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.favourited) {
          setFavourites((prev) => [...prev, therapistId]);
          showToast('Added to favourite therapists!', 'success');
        } else {
          setFavourites((prev) => prev.filter((id) => id !== therapistId));
          showToast('Removed from favourites', 'info');
        }
      }
    } catch (err) {
      console.error('Failed to toggle favourite:', err);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCity('All Cities');
    setSelectedSpeciality('All Specialities');
    setBudget(4000);
    setEnableBudgetLimit(true);
    setSortBy('best_match');
    setAvailableTodayOnly(false);
    setShowFavouritesOnly(false);
    showToast('Search filters reset', 'info');
  };

  const patientComplaint = user?.patient_profile?.primary_complaint_area?.toLowerCase() || '';

  // Filter and sort therapists
  const filteredTherapists = useMemo(() => {
    return allTherapists
      .filter((t) => {
        // Query search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = t.name.toLowerCase().includes(q);
          const matchSpec = t.speciality.toLowerCase().includes(q);
          const matchBio = (t.bio || '').toLowerCase().includes(q);
          if (!matchName && !matchSpec && !matchBio) return false;
        }

        // City
        if (selectedCity !== 'All Cities' && t.city.toLowerCase() !== selectedCity.toLowerCase()) {
          return false;
        }

        // Speciality
        if (selectedSpeciality !== 'All Specialities') {
          if (!t.speciality.toLowerCase().includes(selectedSpeciality.toLowerCase().split(' ')[0])) {
            return false;
          }
        }

        // Budget
        if (enableBudgetLimit && t.fee > budget) {
          return false;
        }

        // Available Today
        if (availableTodayOnly) {
          const isAvailToday = t.availability?.some((a) => a.weekday === todayWeekday);
          if (!isAvailToday) return false;
        }

        // Favourites only
        if (showFavouritesOnly) {
          if (!favourites.includes(t.id)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'best_match') {
          // Score recommendation higher if matches patient complaint
          const aMatch = patientComplaint && a.speciality.toLowerCase().includes(patientComplaint) ? 1 : 0;
          const bMatch = patientComplaint && b.speciality.toLowerCase().includes(patientComplaint) ? 1 : 0;
          if (aMatch !== bMatch) return bMatch - aMatch;
          return b.rating - a.rating;
        }
        if (sortBy === 'rating') {
          return b.rating - a.rating;
        }
        if (sortBy === 'price_asc') {
          return a.fee - b.fee;
        }
        if (sortBy === 'price_desc') {
          return b.fee - a.fee;
        }
        return 0;
      });
  }, [
    allTherapists,
    searchQuery,
    selectedCity,
    selectedSpeciality,
    budget,
    enableBudgetLimit,
    sortBy,
    availableTodayOnly,
    showFavouritesOnly,
    favourites,
    patientComplaint,
    todayWeekday,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Find a Physiotherapist
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Browse licensed practitioners across Pakistan, filter by PKR budget, and book verified slots.
          </p>
        </div>

        <button
          onClick={handleResetFilters}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Filter Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
        {/* Search Input & City Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <SearchIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by therapist name, spine, knee, sports, manual therapy..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-3.5 text-zinc-400" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Speciality, Sort, and Budget Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Clinical Speciality
            </label>
            <select
              value={selectedSpeciality}
              onChange={(e) => setSelectedSpeciality(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {SPECIALITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Sort Therapists
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
            >
              <option value="best_match">Best Match (My Primary Complaint)</option>
              <option value="rating">Highest Clinical Rating (5.0 - 1.0)</option>
              <option value="price_asc">Fee: Low to High (PKR)</option>
              <option value="price_desc">Fee: High to Low (PKR)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Max Fee (PKR)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-teal-600 dark:text-teal-400">
                  {enableBudgetLimit ? `PKR ${budget.toLocaleString()}` : 'No Limit'}
                </span>
                <input
                  type="checkbox"
                  checked={enableBudgetLimit}
                  onChange={(e) => setEnableBudgetLimit(e.target.checked)}
                  title="Enable budget filter"
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
              </div>
            </div>
            <input
              type="range"
              min={1000}
              max={5000}
              step={100}
              disabled={!enableBudgetLimit}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              aria-label="Filter maximum consultation budget in PKR"
              className="w-full accent-teal-600 cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>

        {/* Toggles Bar: Available Today, Favourites */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={availableTodayOnly}
                onChange={(e) => setAvailableTodayOnly(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Available Today</span>
            </label>

            {user?.role === 'patient' && (
              <label className="flex items-center gap-2 font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFavouritesOnly}
                  onChange={(e) => setShowFavouritesOnly(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>Favourites Only ({favourites.length})</span>
                </span>
              </label>
            )}
          </div>

          <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            Showing <span className="text-teal-600 dark:text-teal-400 font-extrabold">{filteredTherapists.length}</span> practitioner{filteredTherapists.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Searching registered physiotherapists...</span>
        </div>
      ) : filteredTherapists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTherapists.map((therapist) => {
            const isFav = favourites.includes(therapist.id);
            const isAvailToday = therapist.availability?.some((a) => a.weekday === todayWeekday);
            const isBestMatch =
              patientComplaint &&
              therapist.speciality.toLowerCase().includes(patientComplaint.split(' ')[0]);

            return (
              <div
                key={therapist.id}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-teal-500 dark:hover:border-teal-500 flex flex-col justify-between transition-all hover:shadow-md group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap gap-1.5">
                      {isBestMatch && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300">
                          <Sparkles className="w-3 h-3" /> Recommended
                        </span>
                      )}
                      {isAvailToday && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                          <Clock className="w-3 h-3" /> Open Today
                        </span>
                      )}
                    </div>

                    {user?.role === 'patient' && (
                      <button
                        type="button"
                        onClick={() => handleToggleFavourite(therapist.id)}
                        className="p-1 rounded-full text-zinc-400 hover:text-rose-500 transition-colors"
                        title={isFav ? 'Remove from favourites' : 'Save to favourites'}
                      >
                        <Heart
                          className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Name & Speciality */}
                  <h3
                    onClick={() => setSelectedTherapistForModal(therapist)}
                    className="font-bold text-zinc-900 dark:text-white text-base group-hover:text-teal-600 cursor-pointer transition-colors"
                  >
                    {therapist.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 font-medium">
                    {therapist.speciality}
                  </p>

                  {/* Rating, City, Experience */}
                  <div className="mt-3 flex items-center justify-between text-xs py-2 border-y border-zinc-100 dark:border-zinc-800/80">
                    <span className="flex items-center gap-1 font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{therapist.rating} / 5.0</span>
                    </span>
                    <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      <span>{therapist.city}</span>
                    </span>
                    <span className="text-zinc-500">
                      {therapist.experience} yrs exp
                    </span>
                  </div>

                  {/* Short Bio snippet */}
                  <p className="mt-2.5 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {therapist.bio || 'Licensed physical therapist committed to targeted joint and soft tissue recovery.'}
                  </p>
                </div>

                {/* Bottom Fee & Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Fee</span>
                    <p className="text-sm sm:text-base font-black text-teal-600 dark:text-teal-400">
                      PKR {therapist.fee.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTherapistForModal(therapist)}
                      className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-200 transition-colors"
                    >
                      Bio
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTherapistForBooking(therapist)}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all"
                    >
                      Book Slot
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-900 dark:text-white text-base">
            No Physiotherapists Matched Your Filters
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            Try expanding your city, adjusting your PKR budget slider, or unchecking "Available Today".
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Modals */}
      <TherapistProfileModal
        therapist={selectedTherapistForModal}
        onClose={() => setSelectedTherapistForModal(null)}
        onBook={(t) => {
          setSelectedTherapistForModal(null);
          setSelectedTherapistForBooking(t);
        }}
      />

      <BookingModal
        therapist={selectedTherapistForBooking}
        initialArea={user?.patient_profile?.primary_complaint_area}
        onClose={() => setSelectedTherapistForBooking(null)}
        onSuccess={() => {
          setSelectedTherapistForBooking(null);
        }}
      />
    </div>
  );
};
