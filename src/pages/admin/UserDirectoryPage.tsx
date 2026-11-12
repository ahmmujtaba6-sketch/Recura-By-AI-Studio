import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, ShieldCheck, User, Calendar, MapPin } from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';

interface DirectoryUser {
  id: number;
  email: string;
  role: 'patient' | 'therapist' | 'admin';
  created_at: string;
  patient_name?: string;
  patient_phone?: string;
  patient_city?: string;
  therapist_name?: string;
  therapist_city?: string;
  therapist_status?: string;
  patient_plan?: string;
}

export const UserDirectoryPage: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/users', window.location.origin);
      if (roleFilter !== 'all') url.searchParams.set('role', roleFilter);
      if (searchTerm.trim()) url.searchParams.set('search', searchTerm.trim());

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        showToast('Failed to load user directory', 'error');
      }
    } catch {
      showToast('Error loading users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            Platform User Directory
          </h1>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Unified ledger of all registered patient profiles, practitioners, and administrators on RECURA.
        </p>
      </div>

      {/* Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        {/* Role Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'patient', label: 'Patients' },
            { id: 'therapist', label: 'Therapists' },
            { id: 'admin', label: 'Admins' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                roleFilter === tab.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search email, name, city..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 w-52 sm:w-64"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">Loading user directory...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">No users found matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-[10px] uppercase font-bold text-zinc-400">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Plan / Status</th>
                  <th className="py-3 px-4">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {users.map((u) => {
                  const displayName = u.therapist_name || u.patient_name || 'System User';
                  const city = u.therapist_city || u.patient_city || 'Pakistan';
                  const roleBadgeClass =
                    u.role === 'admin'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : u.role === 'therapist'
                      ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';

                  return (
                    <tr key={u.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900 dark:text-white">{displayName}</div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleBadgeClass}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{city}</td>
                      <td className="py-3 px-4">
                        {u.role === 'patient' && (
                          <span className="capitalize font-bold text-teal-600 dark:text-teal-400">
                            {u.patient_plan || 'free'} Tier
                          </span>
                        )}
                        {u.role === 'therapist' && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              u.therapist_status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {u.therapist_status}
                          </span>
                        )}
                        {u.role === 'admin' && <span className="text-zinc-400">Superuser</span>}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-[11px]">
                        {new Date(u.created_at).toLocaleDateString('en-PK')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
