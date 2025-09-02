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

  // Get leave balance for current user
  balance: () => api.get('/leave/balance'),

  // Get monthly ledger (deducted and LWP by month) for a date range
  // Admin/HR can optionally pass employeeId; others default to self
  monthlyLedger: ({ from, to, employeeId } = {}) =>
    api.get('/leave/monthly-ledger', { params: { ...(from ? { from } : {}), ...(to ? { to } : {}), ...(employeeId ? { employeeId } : {}) } }),

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

  // Leave Types Management (Admin only)
  leaveTypes: {
    // Get all leave types
    getAll: (params = {}) => api.get('/leave-types', { params }),

    // Get leave type by ID
    getById: (id) => api.get(`/leave-types/${id}`),

    // Create new leave type
    create: (data) => api.post('/leave-types', data),

    // Update leave type
    update: (id, data) => api.put(`/leave-types/${id}`, data),

    // Delete leave type
    delete: (id) => api.delete(`/leave-types/${id}`),

    // Toggle leave type status
    toggleStatus: (id) => api.put(`/leave-types/${id}/toggle-status`),

    // Search leave types
    search: (searchTerm) => api.get('/leave-types', { params: { search: searchTerm } }),

    // Get by eligibility
    getByEligibility: (eligibility) => api.get('/leave-types', { params: { eligibility } }),
  },
};
