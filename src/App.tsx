import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { ToastProvider, useToast } from './context/ToastContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastContainer } from './components/common/ToastContainer.tsx';
import { Navbar } from './components/common/Navbar.tsx';
import { Sidebar } from './components/common/Sidebar.tsx';
import { LandingPage } from './pages/public/LandingPage.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { RegisterPage } from './pages/auth/RegisterPage.tsx';
import { DashboardOverview } from './pages/dashboard/DashboardOverview.tsx';
import { PatientProfilePage } from './pages/patient/PatientProfilePage.tsx';
import { SearchPage } from './pages/patient/SearchPage.tsx';
import { AppointmentsPage } from './pages/patient/AppointmentsPage.tsx';
import { PainTrackerPage } from './pages/patient/PainTrackerPage.tsx';
import { ExercisesPage } from './pages/patient/ExercisesPage.tsx';
import { MyPatientsPage } from './pages/therapist/MyPatientsPage.tsx';
import { SchedulePage } from './pages/therapist/SchedulePage.tsx';
import { ExerciseLibraryPage } from './pages/therapist/ExerciseLibraryPage.tsx';
import { PatientInvitesPage } from './pages/therapist/PatientInvitesPage.tsx';
import { TherapistDetails } from './components/public/TherapistProfileModal.tsx';
import { CalendarCheck, Sparkles, CheckCircle2, ArrowRight, X } from 'lucide-react';

function MainApp() {
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();

  // Navigation states: 'landing' | 'portal' | 'login' | 'register'
  const [view, setView] = useState<'landing' | 'portal' | 'login' | 'register'>('landing');
  const [portalTab, setPortalTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Pending booking choice from visitor landing search
  const [pendingBooking, setPendingBooking] = useState<{
    therapist: TherapistDetails;
    area?: string;
  } | null>(null);

  // Show booking confirmation banner once authenticated
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);

  const handleStartBooking = (therapist: TherapistDetails, area?: string) => {
    setPendingBooking({ therapist, area });

    if (!user) {
      showToast(
        `Pre-selected ${therapist.name} (PKR ${therapist.fee}). Please sign in or register to complete your booking.`,
        'info',
        'Booking In Progress'
      );
      setView('register');
    } else {
      setShowBookingConfirmation(true);
      setView('portal');
    }
  };

  const handleAuthSuccess = () => {
    setView('portal');
    if (pendingBooking) {
      setShowBookingConfirmation(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-zinc-600 dark:text-zinc-400">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading RECURA...</p>
      </div>
    );
  }

  // Determine what to display
  // If not logged in and on 'login' or 'register', show auth pages.
  // Otherwise, if on 'landing' (or not logged in by default), show LandingPage.
  // If logged in and on 'portal', show Portal with Sidebar.
  const isViewingLanding = view === 'landing' || (!user && view !== 'login' && view !== 'register');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        onNavigateLogin={() => setView('login')}
        onNavigateRegister={() => setView('register')}
        onNavigateLanding={() => setView('landing')}
        onNavigateDashboard={() => setView('portal')}
        isViewingLanding={isViewingLanding}
      />

      {/* Booking Intent Confirmation Modal for newly logged in user */}
      {showBookingConfirmation && pendingBooking && user && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative">
            <button
              onClick={() => {
                setShowBookingConfirmation(false);
                setPendingBooking(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              aria-label="Dismiss booking confirmation"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-teal-600 dark:text-teal-400 mb-3">
              <CalendarCheck className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Booking In Progress (Pre-filled)
              </span>
            </div>

            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              Confirm Consultation with {pendingBooking.therapist.name}
            </h3>

            <div className="mt-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Therapist:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {pendingBooking.therapist.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Speciality:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {pendingBooking.therapist.speciality}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">City:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {pendingBooking.therapist.city}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Complaint Area:</span>
                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  {pendingBooking.area || user.patient_profile?.primary_complaint_area || 'Musculoskeletal'}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-bold text-sm">
                <span>Fee (PKR):</span>
                <span className="text-teal-600 dark:text-teal-400">
                  PKR {pendingBooking.therapist.fee.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
              Your appointment request will be registered with the therapist. Full slot grid and rescheduling will be enabled in Phase 3.
            </p>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setShowBookingConfirmation(false);
                  setPendingBooking(null);
                  showToast(
                    `Consultation choice with ${pendingBooking.therapist.name} saved!`,
                    'success',
                    'Choice Confirmed'
                  );
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Selection</span>
              </button>
              <button
                onClick={() => {
                  setShowBookingConfirmation(false);
                  setPendingBooking(null);
                }}
                className="py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Switcher */}
      {view === 'login' ? (
        <main className="flex-1 flex items-center justify-center p-4">
          <LoginPage
            onSwitchToRegister={() => setView('register')}
            onSuccess={handleAuthSuccess}
            bookingIntent={pendingBooking}
          />
        </main>
      ) : view === 'register' ? (
        <main className="flex-1 flex items-center justify-center p-4">
          <RegisterPage
            onSwitchToLogin={() => setView('login')}
            onSuccess={handleAuthSuccess}
            bookingIntent={pendingBooking}
          />
        </main>
      ) : isViewingLanding ? (
        <LandingPage
          onStartBooking={handleStartBooking}
          onNavigateLogin={() => setView('login')}
          onNavigateRegister={() => setView('register')}
        />
      ) : (
        /* Authenticated Portal */
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar
            currentView={portalTab}
            onNavigate={(tab) => {
              setPortalTab(tab);
            }}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {portalTab === 'dashboard' ? (
              <DashboardOverview onNavigate={(tab) => setPortalTab(tab)} />
            ) : portalTab === 'profile' ? (
              <PatientProfilePage />
            ) : portalTab === 'search' ? (
              <SearchPage />
            ) : portalTab === 'appointments' ? (
              <AppointmentsPage />
            ) : portalTab === 'pain' ? (
              <PainTrackerPage />
            ) : portalTab === 'exercises' ? (
              <ExercisesPage />
            ) : portalTab === 'patients' ? (
              <MyPatientsPage />
            ) : portalTab === 'schedule' ? (
              <SchedulePage />
            ) : portalTab === 'library' ? (
              <ExerciseLibraryPage />
            ) : portalTab === 'invites' ? (
              <PatientInvitesPage />
            ) : (
              <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center max-w-2xl mx-auto my-8">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold capitalize">
                  {portalTab.replace('-', ' ')}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Phase 5 (Therapist clinical workspace: caseload management, schedule & availability, exercise authoring & prescription, patient invites) is active.
                  This section expands in subsequent phases.
                </p>
                <button
                  onClick={() => setPortalTab('dashboard')}
                  className="mt-5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Return to Overview
                </button>
              </div>
            )}
          </main>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
