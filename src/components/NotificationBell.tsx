/**
 * NotificationBell - Bell icon with dropdown showing notifications
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiBell, FiCheck, FiCheckCircle, FiInfo, FiAlertTriangle, FiXCircle, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  AppNotification,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '@/services/notificationService';

type UiNotification = AppNotification & {
  synthetic?: boolean;
};

const typeIcons = {
  info: FiInfo,
  success: FiCheckCircle,
  warning: FiAlertTriangle,
  error: FiXCircle,
};

const typeColors = {
  info: 'text-primary',
  success: 'text-primary',
  warning: 'text-secondary',
  error: 'text-destructive',
};

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    const realNotifications = await fetchNotifications(user.id);

    if (user.role !== 'admin') {
      setNotifications(realNotifications);
      return;
    }

    const { data: pendingRequests } = await supabase
      .from('password_reset_requests')
      .select('id, student_id, requested_at')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })
      .limit(20);

    let studentNameMap: Record<string, string> = {};
    const requestStudentIds = (pendingRequests || []).map((r) => r.student_id);

    if (requestStudentIds.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('student_id, full_name')
        .in('student_id', requestStudentIds);

      studentNameMap = (students || []).reduce((acc: Record<string, string>, student) => {
        acc[student.student_id] = student.full_name;
        return acc;
      }, {});
    }

    const resetNotifications: UiNotification[] = (pendingRequests || []).map((request) => ({
      id: `reset-${request.id}`,
      user_id: user.id,
      title: 'Password Reset Request',
      message: `${studentNameMap[request.student_id] || request.student_id} requested a password reset.`,
      type: 'warning',
      is_read: false,
      link: '/admin/settings',
      created_at: request.requested_at,
      synthetic: true,
    }));

    const merged = [...resetNotifications, ...realNotifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    setNotifications(merged);
  }, [user?.id, user?.role]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenNotification = async (notif: UiNotification) => {
    if (!notif.synthetic && !notif.is_read) {
      await markNotificationRead(notif.id);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
    }

    if (notif.link) navigate(notif.link);
    setIsOpen(false);
  };

  const handleMarkRead = async (id: string) => {
    const current = notifications.find((n) => n.id === id);
    if (!current || current.synthetic) return;

    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => (n.synthetic ? n : { ...n, is_read: true })));
  };

  const handleDelete = async (id: string) => {
    const current = notifications.find((n) => n.id === id);
    if (!current || current.synthetic) return;

    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <FiBell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[calc(100vw-1rem)] max-w-[22rem] sm:w-96 bg-card rounded-2xl border border-border shadow-strong z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                >
                  <FiCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <FiBell className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 30).map((notif) => {
                  const Icon = typeIcons[notif.type] || FiInfo;
                  const iconColor = typeColors[notif.type] || 'text-primary';

                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 border-b border-border/50 hover:bg-muted/50 transition-colors ${
                        !notif.is_read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenNotification(notif)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            notif.type === 'error' ? 'bg-destructive/10' : 'bg-primary/10'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${iconColor}`} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenNotification(notif)}
                              className={`text-sm font-medium text-left text-foreground ${!notif.is_read ? 'font-semibold' : ''}`}
                            >
                              {notif.title}
                            </button>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground/70">{formatTimeAgo(notif.created_at)}</span>
                            {!notif.is_read && !notif.synthetic && (
                              <button
                                onClick={() => handleMarkRead(notif.id)}
                                className="text-xs text-primary hover:underline"
                              >
                                Mark read
                              </button>
                            )}
                            {!notif.synthetic && (
                              <button
                                onClick={() => handleDelete(notif.id)}
                                className="text-xs text-muted-foreground hover:text-destructive"
                              >
                                <FiTrash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
