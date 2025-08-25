import React, { useState } from 'react';
import { Bell, Check, Trash2, Filter, Search, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const NotificationsPage = ({ onClose }) => {
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Leave request approved', message: 'Your leave request for Dec 25-26 has been approved by HR department', time: '2 hours ago', unread: true, type: 'success', category: 'Leave' },
    { id: 2, title: 'New payslip generated', message: 'Your payslip for November 2024 is now available for download in the payroll section', time: '1 day ago', unread: true, type: 'info', category: 'Payroll' },
    { id: 3, title: 'Performance review due', message: 'Please complete your quarterly performance review by December 31st, 2024', time: '3 days ago', unread: false, type: 'warning', category: 'Performance' },
    { id: 4, title: 'Team meeting scheduled', message: 'Weekly team sync meeting tomorrow at 10 AM in Conference Room A', time: '1 week ago', unread: false, type: 'info', category: 'Meetings' },
    { id: 5, title: 'Document uploaded', message: 'New company policy document has been uploaded to the documents section', time: '2 weeks ago', unread: false, type: 'info', category: 'Documents' },
    { id: 6, title: 'Expense report rejected', message: 'Your expense report #EXP-2024-001 has been rejected. Please review and resubmit', time: '3 weeks ago', unread: false, type: 'error', category: 'Expenses' },
    { id: 7, title: 'Training reminder', message: 'Mandatory cybersecurity training must be completed by end of month', time: '1 month ago', unread: false, type: 'warning', category: 'Training' },
    { id: 8, title: 'Birthday celebration', message: 'Join us in celebrating Sarah\'s birthday today at 3 PM in the break room', time: '1 month ago', unread: false, type: 'info', category: 'Social' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, unread: false }))
    );
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
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
          {filteredNotifications.length === 0 ? (
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
