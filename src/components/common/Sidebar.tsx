import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Search,
  CalendarCheck,
  Activity,
  Dumbbell,
  TrendingUp,
  CreditCard,
  HelpCircle,
  Users,
  Clock,
  BookOpen,
  UserPlus,
  UserCheck,
  ShieldCheck,
  LifeBuoy,
  ChevronRight,
  Sparkles,
  BadgeAlert
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role;

  const patientNav = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'profile', label: 'My Clinical Profile', icon: UserCheck },
    { id: 'search', label: 'Find a Physio', icon: Search },
    { id: 'appointments', label: 'My Appointments', icon: CalendarCheck },
    { id: 'pain', label: 'Pain Tracker', icon: Activity },
    { id: 'exercises', label: 'Daily Exercises', icon: Dumbbell },
    { id: 'progress', label: 'Progress & Goals', icon: TrendingUp },
    { id: 'plans', label: 'Plans & Billing', icon: CreditCard },
    { id: 'help', label: 'Help & FAQ', icon: HelpCircle },
  ];

  const therapistNav = [
    { id: 'dashboard', label: 'Clinical Overview', icon: LayoutDashboard },
    { id: 'patients', label: 'My Patients', icon: Users },
    { id: 'schedule', label: 'Schedule & Slots', icon: Clock },
    { id: 'library', label: 'Exercise Library', icon: BookOpen },
    { id: 'invites', label: 'Patient Invites', icon: UserPlus },
    { id: 'help', label: 'Help & Policies', icon: HelpCircle },
  ];

  const adminNav = [
    { id: 'dashboard', label: 'Admin Overview', icon: LayoutDashboard },
    { id: 'approvals', label: 'Therapist Approvals', icon: ShieldCheck },
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'appointments', label: 'All Appointments', icon: CalendarCheck },
    { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy },
    { id: 'help', label: 'Platform FAQ', icon: HelpCircle },
  ];

  const navItems = role === 'patient' ? patientNav : role === 'therapist' ? therapistNav : adminNav;

  const handleSelect = (id: string) => {
    onNavigate(id);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-16 inset-y-0 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Status or Plan card */}
          {role === 'patient' && (
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/60 dark:to-emerald-950/40 border border-teal-200/80 dark:border-teal-800/60">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                  Current Plan
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-teal-600 text-white capitalize shadow-xs">
                  {user.plan?.plan || 'Free'}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-2">
                {user.plan?.plan === 'premium'
                  ? 'Full history, video sessions, therapist notes unlocked.'
                  : user.plan?.plan === 'basic'
                  ? 'Full pain history, exercise tutorials, 2 video calls.'
                  : '7-day history, in-clinic bookings only.'}
              </p>
              {user.plan?.plan !== 'premium' && (
                <button
                  onClick={() => handleSelect('plans')}
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade Plan
                </button>
              )}
            </div>
          )}

          {role === 'therapist' && (
            <div
              className={`p-3 rounded-xl border ${
                user.therapist_profile?.status === 'approved'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {user.therapist_profile?.status === 'approved' ? (
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <BadgeAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                )}
                <div>
                  <p className="text-xs font-bold capitalize">
                    Status: {user.therapist_profile?.status || 'Pending'}
                  </p>
                  <p className="text-[10px] opacity-80">
                    Reg: {user.therapist_profile?.registration_no || 'Pending review'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {role === 'admin' && (
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300">
              <p className="text-xs font-bold uppercase tracking-wider">Admin Portal</p>
              <p className="text-[10px] opacity-80 mt-0.5">Full marketplace oversight and approvals</p>
            </div>
          )}

          {/* Nav List */}
          <nav className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
              Navigation
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-600 text-white font-semibold shadow-xs'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
          <span>RECURA v1.0</span>
          <span>Pakistan</span>
        </div>
      </aside>
    </>
  );
};
