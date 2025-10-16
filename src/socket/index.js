// Socket.io configuration and connection management
export {
  initializeSocket,
  getSocket,
  connectSocket,
  disconnectSocket,
  isSocketConnected
} from './socketConfig';

// Notification event handlers and constants
export {
  NOTIFICATION_EVENTS,
  setupNotificationListeners,
  removeNotificationListeners,
  requestNotificationPermission
} from './notificationEvents';

// Notification API service
export { default as notificationAPI } from './notificationApi';

// Notification React Context and Provider
export {
  NotificationProvider,
  useNotifications,
  default as NotificationContext
} from './NotificationContext';

// Token utilities
export {
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
  getAuthHeaders,
  TOKEN_KEY,
  USER_KEY
} from './tokenUtils';

// Re-export everything as default for convenience
export default {
  // Config
  initializeSocket,
  getSocket,
  connectSocket,
  disconnectSocket,
  isSocketConnected,
  
  // Events
  NOTIFICATION_EVENTS,
  setupNotificationListeners,
  removeNotificationListeners,
  requestNotificationPermission,
  
  // API
  notificationAPI,
  
  // React Context
  NotificationProvider,
  useNotifications,
  NotificationContext
};
