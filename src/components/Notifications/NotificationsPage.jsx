import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Filter, Search, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useNotifications } from '../../socket/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage = ({ onClose }) => {
  // Get real notification data from Socket.io context
  const {
    notifications: realNotifications,
    unreadCount,
    loading,
    error,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    deleteNotification: deleteNotificationFromAPI,
    loadNotifications
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Load notifications when component mounts
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Helper function to convert notification type to UI type
  const getUIType = (notification) => {
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
      case 'announcement':
        return 'info';
      default:
        return 'info';
    }
  };

  // Convert real notifications to UI format
  const notifications = realNotifications.map(notification => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    time: formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }),
    unread: !notification.isRead,
    type: getUIType(notification),
    category: notification.category,
    originalType: notification.type
  }));

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

  const deleteNotification = async (notificationId) => {
    try {
      await deleteNotificationFromAPI(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || 
                       (filterType === 'unread' && notification.unread) ||
                       (filterType === 'read' && !notification.unread) ||
                       notification.type === filterType;
    const matchesCategory = filterCategory === 'all' || notification.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const categories = [...new Set(notifications.map(n => n.category))];

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10';
      case 'error': return 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10';
      default: return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Notifications</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {unreadCount} unread of {notifications.length} total
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">All Types</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="success">Success</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">❌</div>
              <p className="text-red-500 mb-2">Failed to load notifications</p>
              <p className="text-gray-500 text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => loadNotifications()}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || filterType !== 'all' || filterCategory !== 'all' 
                  ? 'No notifications match your filters' 
                  : 'No notifications found'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
                    notification.unread ? getTypeColor(notification.type) : 'border-l-gray-300'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="text-lg">{getTypeIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`text-sm font-medium ${
                              notification.unread 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.title}
                            </h3>
                            {notification.unread && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span>{notification.time}</span>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                              {notification.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {notification.unread && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-xs"
                          >
                            Mark as read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-red-500 hover:text-red-700 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
