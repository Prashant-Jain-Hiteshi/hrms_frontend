import { api } from './api';

export const LeaveAPI = {
  // Apply for leave
  create: (leaveData) => api.post('/leave', leaveData),

  // Get leave requests (role-based)
  list: () => api.get('/leave'),

  // Get leave requests for approval (TO users)
  forApproval: () => api.get('/leave/for-approval'),

  // Get leave requests where user is in CC
  ccRequests: () => api.get('/leave/cc-requests'),

  // Get leave requests where current user is mentioned (TO or CC)
  mentions: () => api.get('/leave/mentions'),

  // Get leave statistics
  statistics: (employeeId) => api.get('/leave/statistics', { params: { employeeId } }),

  // Get leave request by ID
  getById: (id) => api.get(`/leave/${id}`),

  // Update leave status (approve/reject)
  updateStatus: (id, statusData) => api.put(`/leave/${id}/status`, statusData),

  // Cancel own pending leave
  cancel: (id, payload = {}) => api.put(`/leave/${id}/cancel`, payload),

  // Mark CC leave request as read
  markAsRead: (id) => api.put(`/leave/${id}/mark-read`),

  // Delete leave request
  delete: (id) => api.delete(`/leave/${id}`),

  // Admin endpoints
  admin: {
    // Get all leave requests (Admin only)
    getAllRequests: () => api.get('/leave/admin/all'),

    // Get overall statistics (Admin only)
    getOverallStats: () => api.get('/leave/admin/statistics/all'),
  },
};
