import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../socket/NotificationContext';
import { useNotificationAuth } from '../../socket/useNotificationAuth';
import { Button } from '../ui/Button';
import NotificationsPage from '../Notifications/NotificationsPage';
import { formatDistanceToNow } from 'date-fns';
import { 
  Menu, Bell, Search, Sun, Moon, User, ChevronDown,
  Settings, LogOut
} from 'lucide-react';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  
  // Initialize notification authentication
  useNotificationAuth();
  
  // Get real notification data
  const {
    notifications: realNotifications,
    unreadCount,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    loadNotifications
  } = useNotifications();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationsPage, setShowNotificationsPage] = useState(false);

  // Load notifications when component mounts
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  // Helper function to get notification type for UI
  const getNotificationType = (notification) => {
    switch (notification.type) {
      case 'leave_approved':
        return 'success';
      case 'leave_rejected':
        return 'error';
      case 'leave_pending':
        return 'warning';
      case 'payslip_generated':
      case 'salary_processed':
        return 'info';
      default:
        return 'info';
    }
  };

  // Convert real notifications to header format (show only recent 4)
  const notifications = realNotifications.slice(0, 4).map(notification => {
    // Safely handle date formatting
    let timeText = 'Just now';
    try {
      if (notification.createdAt) {
        const date = new Date(notification.createdAt);
        if (!isNaN(date.getTime())) {
          timeText = formatDistanceToNow(date, { addSuffix: true });
        }
      }
    } catch (error) {
      console.warn('Invalid date in notification:', notification.createdAt);
    }

    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      time: timeText,
      unread: !notification.isRead,
      type: getNotificationType(notification)
    };
  });

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 header-gradient border-b border-gray-200 dark:border-gray-700 px-4 py-3 lg:left-64">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden text-white hover:bg-white/20"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                type="text"
                placeholder="Search employees, documents..."
                className="pl-10 pr-4 py-2 w-80 rounded-lg border border-white/30 bg-white/20 text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
              />
            </div>
          </div> */}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative text-white hover:bg-white/20"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative text-white hover:bg-white/20"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-l-4 ${
                          notification.unread 
                            ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-blue-500' 
                            : 'border-l-transparent'
                        } ${
                          notification.type === 'success' ? 'border-l-green-500' :
                          notification.type === 'warning' ? 'border-l-yellow-500' :
                          notification.type === 'error' ? 'border-l-red-500' :
                          'border-l-blue-500'
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                            notification.unread ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      onClick={() => {
                        setShowNotifications(false);
                        setShowNotificationsPage(true);
                      }}
                      className="text-xs text-primary hover:text-primary/80 font-medium w-full text-center"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <div className="bg-white/20 rounded-full p-2">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-white/80">
                  {user?.role?.toUpperCase()}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-white/80" />
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <button 
                  onClick={logout}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Page Modal */}
      {showNotificationsPage && (
        <NotificationsPage onClose={() => setShowNotificationsPage(false)} />
      )}
    </header>
  );
};

export default Header;
