import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserRole } from '../types/index.ts';
import { useToast } from './ToastContext.tsx';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching current session:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Login failed. Please check your credentials.', 'error', 'Login Failed');
        return false;
      }

      setUser(data.user);
      showToast(`Welcome back, ${data.user.patient_profile?.name || data.user.therapist_profile?.name || data.user.email}!`, 'success', 'Logged In');
      return true;
    } catch (err) {
      showToast('Network error during login. Please try again.', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        showToast(resData.error || 'Registration failed.', 'error', 'Registration Error');
        return false;
      }

      setUser(resData.user);
      showToast('Account registered successfully! Welcome to RECURA.', 'success', 'Welcome');
      return true;
    } catch (err) {
      showToast('Network error during registration.', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      showToast('You have been logged out successfully.', 'info');
    } catch (err) {
      setUser(null);
    }
  };

  const switchDemoRole = async (targetRole: UserRole): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/switch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        showToast(`Switched active view to demo ${targetRole}`, 'info', 'Demo Switch');
        return true;
      } else {
        showToast(data.error || 'Failed to switch demo account', 'error');
        return false;
      }
    } catch (err) {
      showToast('Failed to switch demo account', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
