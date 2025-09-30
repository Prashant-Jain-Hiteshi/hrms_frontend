import axios from 'axios';
import { getAuthHeaders } from './tokenUtils';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

/**
 * Notification API service
 */
class NotificationAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/notifications`;
  }

  /**
   * Get authorization headers with JWT token
   */
  getAuthHeaders() {
    return getAuthHeaders(); // Use centralized token utility
  }

  /**
   * Get all notifications for the current user
   */
  async getNotifications(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 20,
        ...(params.category && { category: params.category }),
        ...(params.type && { type: params.type }),
        ...(params.isRead !== undefined && { isRead: params.isRead }),
        ...(params.search && { search: params.search })
      });

      const response = await axios.get(`${this.baseURL}?${queryParams}`, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    try {
      const response = await axios.get(`${this.baseURL}/unread-count`, {
        headers: this.getAuthHeaders()
      });

      return response.data.unreadCount;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(notificationId) {
    try {
      console.log('🔍 Frontend markAsRead called with ID:', notificationId, 'Type:', typeof notificationId);
      
      // Validate notification ID
      if (!notificationId || notificationId === 'undefined' || notificationId === 'null') {
        console.error('❌ Frontend: Invalid notification ID provided:', notificationId);
        throw new Error('Invalid notification ID provided');
      }

      const response = await axios.put(`${this.baseURL}/${notificationId}/read`, {}, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ Frontend: Notification marked as read successfully:', notificationId);
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const response = await axios.put(`${this.baseURL}/mark-all-read`, {}, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a specific notification
   */
  async deleteNotification(notificationId) {
    try {
      const response = await axios.delete(`${this.baseURL}/${notificationId}`, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications by category (for filtering)
   */
  async getNotificationsByCategory(category, params = {}) {
    return this.getNotifications({ ...params, category });
  }

  /**
   * Get leave-related notifications
   */
  async getLeaveNotifications(params = {}) {
    return this.getNotificationsByCategory('Leave', params);
  }

  /**
   * Get payroll-related notifications
   */
  async getPayrollNotifications(params = {}) {
    return this.getNotificationsByCategory('Payroll', params);
  }

  /**
   * Get only unread notifications
   */
  async getUnreadNotifications(params = {}) {
    return this.getNotifications({ ...params, isRead: false });
  }

  /**
   * Search notifications
   */
  async searchNotifications(searchTerm, params = {}) {
    return this.getNotifications({ ...params, search: searchTerm });
  }
}

// Create singleton instance
const notificationAPI = new NotificationAPI();

export default notificationAPI;
