import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Dumbbell, MessageSquare, AlertTriangle, Calendar, Info, Activity } from 'lucide-react';

interface NotificationItem {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  read: number;
  created_at: string;
}

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: 1 } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'DELETE' });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'exercise_assigned':
        return <Dumbbell className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'therapist_comment':
        return <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'high_pain_alert':
        return <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'appointment_request':
      case 'appointment_confirmed':
      case 'appointment_rescheduled':
      case 'appointment_reminder':
        return <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'chat_message':
        return <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Info className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-teal-600 text-white font-bold text-[10px] ring-2 ring-white dark:ring-zinc-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[460px]">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-800/40">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="px-2 py-1 rounded text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors flex items-center gap-1"
                  title="Mark all as read"
                >
                  <Check className="w-3 h-3" />
                  <span>Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-xs">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium text-zinc-600 dark:text-zinc-400">No notifications yet</p>
                <p className="text-[11px] mt-0.5">Appointment updates and clinical comments will show up here.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (n.read === 0) handleMarkAsRead(n.id);
                  }}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer text-left ${
                    n.read === 0
                      ? 'bg-teal-50/50 dark:bg-teal-950/20 hover:bg-teal-50 dark:hover:bg-teal-950/40'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0 mt-0.5">
                    {getIconForType(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-semibold leading-tight ${n.read === 0 ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-zinc-400 shrink-0">{formatTime(n.created_at)}</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-3">
                      {n.body}
                    </p>
                  </div>
                  {n.read === 0 && (
                    <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
