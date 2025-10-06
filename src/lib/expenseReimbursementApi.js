import { api } from './api';

export const expenseReimbursementAPI = {
  // Employee APIs
  async getMyRequests() {
    try {
      const response = await api.get('/api/expense/reimbursements/my-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching my reimbursement requests:', error);
      throw error;
    }
  },

  async submitRequest(formData) {
    try {
      const response = await api.post('/api/expense/reimbursements', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting reimbursement request:', error);
      throw error;
    }
  },

  async calculateAmount(categoryId, amount) {
    try {
      const response = await api.post('/api/expense/reimbursements/calculate', {
        categoryId,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating approved amount:', error);
      throw error;
    }
  },

  async getRequestById(id) {
    try {
      const response = await api.get(`/api/expense/reimbursements/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reimbursement request:', error);
      throw error;
    }
  },

  async cancelRequest(id) {
    try {
      const response = await api.delete(`/api/expense/reimbursements/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling reimbursement request:', error);
      throw error;
    }
  },

  // Admin/Finance APIs
  async getAllRequests(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await api.get(`/api/expense/reimbursements?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all reimbursement requests:', error);
      throw error;
    }
  },

  async getPendingRequests() {
    try {
      const response = await api.get('/api/expense/reimbursements/pending');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending reimbursement requests:', error);
      throw error;
    }
  },

  async updateRequestStatus(id, status, comments) {
    try {
      const response = await api.put(`/api/expense/reimbursements/${id}/status`, {
        status,
        approverComments: comments
      });
      return response.data;
    } catch (error) {
      console.error('Error updating reimbursement status:', error);
      throw error;
    }
  },

  async getStatistics() {
    try {
      const response = await api.get('/api/expense/reimbursements/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching reimbursement statistics:', error);
      throw error;
    }
  },

  // Categories API
  async getActiveCategories() {
    try {
      const response = await api.get('/api/expense/categories/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active expense categories:', error);
      throw error;
    }
  }
};

export default expenseReimbursementAPI;
