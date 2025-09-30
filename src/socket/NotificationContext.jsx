import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initializeSocket, disconnectSocket, getSocket, isSocketConnected } from './socketConfig';
import { setupNotificationListeners, removeNotificationListeners, requestNotificationPermission } from './notificationEvents';
import notificationAPI from './notificationApi';

// Create notification context
const NotificationContext = createContext();

// Custom hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  // State management
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Socket connection management
  const initializeConnection = useCallback(async (token) => {
    try {
      console.log('🚀 Initializing notification system...');
      
      // Initialize socket with token
      const socket = initializeSocket(token);
      
      // Set up connection event handlers
      socket.on('connect', () => {
        setIsConnected(true);
        setError(null);
        console.log('✅ Notification system connected');
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('👋 Notification system disconnected');
      });

      socket.on('connect_error', (error) => {
        setIsConnected(false);
        setError(`Connection failed: ${error.message}`);
        console.error('❌ Notification system connection error:', error);
      });

      // Set up notification event listeners
      setupNotificationListeners({
        onNewNotification: handleNewNotification,
        onUnreadCountUpdate: handleUnreadCountUpdate,
        onNotificationRead: handleNotificationRead,
        onLeaveApproved: handleLeaveApproved,
        onLeaveRejected: handleLeaveRejected,
        onLeavePending: handleLeavePending,
        onCompensatoryLeaveAssigned: handleCompensatoryLeaveAssigned,
        onPayrollHRApproved: handlePayrollHRApproved,
        onPayrollFinanceApproved: handlePayrollFinanceApproved,
        onSalaryTransferInitiated: handleSalaryTransferInitiated,
        onSalaryTransferCompleted: handleSalaryTransferCompleted,
        onSalaryTransferFailed: handleSalaryTransferFailed,
        onAnnouncement: handleAnnouncement,
      });

      // Connect the socket
      socket.connect();

      // Request browser notification permission
      await requestNotificationPermission();

      // Load initial notifications
      await loadNotifications();

    } catch (error) {
      console.error('❌ Failed to initialize notification system:', error);
      setError(`Initialization failed: ${error.message}`);
    }
  }, []);

  // Disconnect socket
  const disconnect = useCallback(() => {
    removeNotificationListeners();
    disconnectSocket();
    setIsConnected(false);
    setNotifications([]);
    setUnreadCount(0);
    console.log('🔌 Notification system disconnected');
  }, []);

  // Load notifications from API
  const loadNotifications = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await notificationAPI.getNotifications(params);
      
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);

      console.log(`📋 Loaded ${response.notifications?.length || 0} notifications`);
    } catch (error) {
      console.error('❌ Failed to load notifications:', error);
      setError(`Failed to load notifications: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Event handlers
  const handleNewNotification = useCallback((notification) => {
    console.log('📧 Handling new notification:', notification);
    
    // Add to notifications list
    setNotifications(prev => [notification, ...prev]);
    
    // Update unread count
    setUnreadCount(prev => prev + 1);

    // Show toast notification (you can customize this)
    showToastNotification(notification);
  }, []);

  const handleUnreadCountUpdate = useCallback((count) => {
    setUnreadCount(count);
  }, []);

  const handleNotificationRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true, readAt: new Date().toISOString() }
          : notification
      )
    );
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Leave-specific handlers
  const handleLeaveApproved = useCallback((notification) => {
    console.log('✅ Leave approved:', notification);
    handleNewNotification(notification);
  }, [handleNewNotification]);

  const handleLeaveRejected = useCallback((notification) => {
    console.log('❌ Leave rejected:', notification);
    handleNewNotification(notification);
  }, [handleNewNotification]);

  const handleLeavePending = useCallback((notification) => {
    console.log('⏳ Leave pending:', notification);
    handleNewNotification(notification);
  }, [handleNewNotification]);

  const handleCompensatoryLeaveAssigned = useCallback((notification) => {
    console.log('💳 Compensatory leave assigned:', notification);
    handleNewNotification(notification);
  }, [handleNewNotification]);

  const handlePayrollHRApproved = useCallback((notification) => {
    console.log('💰 Payroll approved by HR:', notification);
    handleNewNotification(notification);
  }, [handleNewNotification]);

  const handlePayrollFinanceApproved = useCallback((notification) => {
    console.log('✅ Payroll finalized by Finance:', notification);
    handleNewNotification(notification);
  }, [handleNewNotification]);

  const handleSalaryTransferInitiated = useCallback((notification) => {
    console.log('🏦 Salary transfer initiated:', notification);
    handleNewNotification(notification);
  }, [handleNewNotification]);

  const handleSalaryTransferCompleted = useCallback((notification) => {
    console.log('💰 Salary transfer completed:', notification);
    handleNewNotification(notification);
  }, [handleNewNotification]);

  const handleSalaryTransferFailed = useCallback((notification) => {
    console.log('❌ Salary transfer failed:', notification);
    handleNewNotification(notification);
  }, [handleNewNotification]);

  const handleAnnouncement = useCallback((notification) => {
    console.log('📢 Company announcement:', notification);
    handleNewNotification(notification);
  }, [handleNewNotification]);

  // API methods
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      handleNotificationRead(notificationId);
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      setError(`Failed to mark as read: ${error.message}`);
    }
  }, [handleNotificationRead]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead();
      
      // Update all notifications to read
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          isRead: true, 
          readAt: new Date().toISOString() 
        }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('❌ Failed to mark all as read:', error);
      setError(`Failed to mark all as read: ${error.message}`);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      
      // Remove from local state
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if it was unread
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
      setError(`Failed to delete notification: ${error.message}`);
    }
  }, [notifications]);

  // Filter methods
  const getLeaveNotifications = useCallback(() => {
    return notifications.filter(n => n.category === 'Leave');
  }, [notifications]);

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.isRead);
  }, [notifications]);

  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  const getCompensatoryLeaveNotifications = useCallback(() => {
    return notifications.filter(n => n.type === 'compensatory_leave_assigned');
  }, [notifications]);

  const getPayrollNotifications = useCallback(() => {
    return notifications.filter(n => 
      n.type === 'payroll_hr_approved' || 
      n.type === 'payroll_finance_approved' ||
      n.type === 'salary_transfer_initiated' ||
      n.type === 'salary_transfer_completed' ||
      n.type === 'salary_transfer_failed' ||
      n.type === 'payslip_generated' ||
      n.type === 'salary_processed'
    );
  }, [notifications]);

  // Toast notification helper
  const showToastNotification = (notification) => {
    // You can integrate with your toast library here
    // For now, just log it
    console.log('🍞 Toast notification:', notification.title);
  };

  // Context value
  const contextValue = {
    // State
    notifications,
    unreadCount,
    isConnected,
    loading,
    error,
    
    // Connection methods
    initializeConnection,
    disconnect,
    
    // Data methods
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    
    // Filter methods
    getLeaveNotifications,
    getUnreadNotifications,
    getNotificationsByType,
    getCompensatoryLeaveNotifications,
    getPayrollNotifications,
    
    // Socket info
    isSocketConnected: () => isSocketConnected(),
    getSocket: () => getSocket(),
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
