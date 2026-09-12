/**
 * Notification Service - Supabase CRUD for notifications
 */

import { supabase } from '@/lib/supabase';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export const fetchNotifications = async (userId: string): Promise<AppNotification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    console.warn('Notifications table may not exist yet:', error.message);
    return [];
  }
  return data || [];
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
};

export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
};

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: AppNotification['type'] = 'info',
  link?: string
): Promise<void> => {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    is_read: false,
    link,
  });
  if (error) console.warn('Failed to create notification:', error.message);
};

/**
 * Create notifications for multiple users at once
 */
export const createBulkNotifications = async (
  userIds: string[],
  title: string,
  message: string,
  type: AppNotification['type'] = 'info',
  link?: string
): Promise<void> => {
  if (userIds.length === 0) return;
  const records = userIds.map(uid => ({
    user_id: uid,
    title,
    message,
    type,
    is_read: false,
    link,
  }));
  const { error } = await supabase.from('notifications').insert(records);
  if (error) console.warn('Failed to create bulk notifications:', error.message);
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await supabase.from('notifications').delete().eq('id', notificationId);
};
