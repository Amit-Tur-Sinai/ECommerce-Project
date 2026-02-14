import { api } from './api';

export interface AppNotification {
  notification_id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  sender_email: string | null;
}

export const notificationService = {
  async getNotifications(): Promise<{
    notifications: AppNotification[];
    unread_count: number;
  }> {
    const response = await api.get('/auth/notifications');
    return response.data;
  },

  async getUnreadCount(): Promise<{ unread_count: number }> {
    const response = await api.get('/auth/notifications/unread-count');
    return response.data;
  },

  async markAsRead(notificationId: number): Promise<void> {
    await api.put(`/auth/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/auth/notifications/read-all');
  },
};
