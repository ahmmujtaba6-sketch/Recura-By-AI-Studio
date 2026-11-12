import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { Sun, Moon, LogOut, User as UserIcon, ShieldAlert, Sparkles, Menu, X } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown.tsx';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onNavigateLogin?: () => void;
  onNavigateRegister?: () => void;
  onNavigateLanding?: () => void;
  onNavigateDashboard?: () => void;
  isViewingLanding?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onNavigateLogin,
  onNavigateRegister,
  onNavigateLanding,
  onNavigateDashboard,
  isViewingLanding,
}) => {
  const { user, logout, switchDemoRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const getDisplayName = () => {
    if (!user) return '';
    if (user.role === 'therapist') return user.therapist_profile?.name || user.email;
    if (user.role === 'patient') return user.patient_profile?.name || user.email;
    return 'Administrator';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label={isSidebarOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
              aria-expanded={isSidebarOpen}
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateLanding}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            aria-label="RECURA Homepage"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white font-black text-xl shadow-sm shadow-teal-500/20 group-hover:scale-105 transition-transform">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  RECURA
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300">
                  PK
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-none">by Physio Hub</p>
            </div>
          </button>
        </div>

        {/* Center: Disclaimer Banner (hidden on tiny screens) */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span className="font-medium truncate">Medical Disclaimer: Recura does not diagnose or replace emergency care.</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Switcher (Development helper) */}
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors"
              title="Fast switch demo role"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Demo:</span>
              <span className="capitalize">{user ? user.role : 'Guest'}</span>
            </button>

            {showDemoMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDemoMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl z-50 p-2 text-xs">
                  <div className="px-2 py-1.5 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                    Switch Demo Account
                  </div>
                  <button
                    onClick={() => {
                      switchDemoRole('patient');
                      setShowDemoMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between ${
                      user?.role === 'patient'
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold'
                        : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div>
                      <p className="font-medium">Patient Demo</p>
                      <p className="text-[10px] text-zinc-400">patient@recura.demo</p>
                    </div>
                    {user?.role === 'patient' && <span className="text-[10px] text-teal-600 font-bold">Active</span>}
                  </button>
                  <button
                    onClick={() => {
                      switchDemoRole('therapist');
                      setShowDemoMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between ${
                      user?.role === 'therapist'
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold'
                        : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div>
                      <p className="font-medium">Therapist Demo</p>
                      <p className="text-[10px] text-zinc-400">Dr. Ayesha Khan (Approved)</p>
                    </div>
                    {user?.role === 'therapist' && <span className="text-[10px] text-teal-600 font-bold">Active</span>}
                  </button>
                  <button
                    onClick={() => {
                      switchDemoRole('admin');
                      setShowDemoMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between ${
                      user?.role === 'admin'
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold'
                        : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div>
                      <p className="font-medium">Admin Demo</p>
                      <p className="text-[10px] text-zinc-400">admin@recura.demo</p>
                    </div>
                    {user?.role === 'admin' && <span className="text-[10px] text-teal-600 font-bold">Active</span>}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>

          {/* Notifications Dropdown for logged in users */}
          {user && <NotificationDropdown />}

          {/* Authenticated user menu vs Guest login/register */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              {isViewingLanding ? (
                <button
                  type="button"
                  onClick={onNavigateDashboard}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
                >
                  My Portal
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateLanding}
                  className="hidden sm:inline-flex px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors"
                >
                  Marketplace Home
                </button>
              )}

              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-tight truncate max-w-[140px]">
                  {getDisplayName()}
                </p>
                <p className="text-[10px] text-teal-600 dark:text-teal-400 capitalize font-medium">
                  {user.role}
                </p>
              </div>

              <button
                onClick={logout}
                className="p-2 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onNavigateLogin}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={onNavigateRegister}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
