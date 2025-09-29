import { getSocket } from './socketConfig';

/**
 * Notification event types
 */
export const NOTIFICATION_EVENTS = {
  // Incoming events from server
  NEW_NOTIFICATION: 'new_notification',
  UNREAD_COUNT: 'unread_count',
  NOTIFICATION_READ: 'notification_read',
  
  // Leave-specific events
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_REJECTED: 'leave_rejected',
  LEAVE_PENDING: 'leave_pending',
  LEAVE_REQUEST_NEW: 'leave_request_new',
  
  // Payroll events
  PAYSLIP_GENERATED: 'payslip_generated',
  SALARY_PROCESSED: 'salary_processed',
  
  // General events
  ANNOUNCEMENT: 'announcement',
};

/**
 * Set up notification event listeners
 */
export const setupNotificationListeners = (callbacks = {}) => {
  const socket = getSocket();
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket first.');
    return;
  }

  // Remove existing listeners to prevent duplicates
  removeNotificationListeners();

  // New notification received
  socket.on(NOTIFICATION_EVENTS.NEW_NOTIFICATION, (notification) => {
    console.log('📧 New notification received:', notification);
    
    if (callbacks.onNewNotification) {
      callbacks.onNewNotification(notification);
    }
    
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      showBrowserNotification(notification);
    }
  });

  // Unread count update
  socket.on(NOTIFICATION_EVENTS.UNREAD_COUNT, (data) => {
    console.log('🔢 Unread count updated:', data.count);
    
    if (callbacks.onUnreadCountUpdate) {
      callbacks.onUnreadCountUpdate(data.count);
    }
  });

  // Notification marked as read
  socket.on(NOTIFICATION_EVENTS.NOTIFICATION_READ, (data) => {
    console.log('✅ Notification marked as read:', data.notificationId);
    
    if (callbacks.onNotificationRead) {
      callbacks.onNotificationRead(data.notificationId);
    }
  });

  // Leave-specific events
  socket.on(NOTIFICATION_EVENTS.LEAVE_APPROVED, (notification) => {
    console.log('✅ Leave approved notification:', notification);
    
    if (callbacks.onLeaveApproved) {
      callbacks.onLeaveApproved(notification);
    }
  });

  socket.on(NOTIFICATION_EVENTS.LEAVE_REJECTED, (notification) => {
    console.log('❌ Leave rejected notification:', notification);
    
    if (callbacks.onLeaveRejected) {
      callbacks.onLeaveRejected(notification);
    }
  });

  socket.on(NOTIFICATION_EVENTS.LEAVE_PENDING, (notification) => {
    console.log('⏳ Leave pending notification:', notification);
    
    if (callbacks.onLeavePending) {
      callbacks.onLeavePending(notification);
    }
  });

  // Company announcements
  socket.on(NOTIFICATION_EVENTS.ANNOUNCEMENT, (notification) => {
    console.log('📢 Company announcement:', notification);
    
    if (callbacks.onAnnouncement) {
      callbacks.onAnnouncement(notification);
    }
  });

  console.log('🎧 Notification listeners set up successfully');
};

/**
 * Remove all notification event listeners
 */
export const removeNotificationListeners = () => {
  const socket = getSocket();
  if (!socket) return;

  Object.values(NOTIFICATION_EVENTS).forEach(event => {
    socket.off(event);
  });

  console.log('🔇 Notification listeners removed');
};

/**
 * Show browser notification
 */
const showBrowserNotification = (notification) => {
  try {
    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.type,
      requireInteraction: notification.category === 'Leave', // Keep leave notifications visible
    });

    // Auto close after 5 seconds for non-leave notifications
    if (notification.category !== 'Leave') {
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }

    // Handle notification click
    browserNotification.onclick = () => {
      window.focus();
      browserNotification.close();
      
      // Navigate to relevant page based on notification type
      if (notification.category === 'Leave') {
        window.location.hash = '#/leave-management';
      }
    };
  } catch (error) {
    console.warn('Failed to show browser notification:', error);
  }
};

/**
 * Request browser notification permission
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export default {
  NOTIFICATION_EVENTS,
  setupNotificationListeners,
  removeNotificationListeners,
  requestNotificationPermission
};
