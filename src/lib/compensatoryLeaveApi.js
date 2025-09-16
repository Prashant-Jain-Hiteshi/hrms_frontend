import { API_BASE_URL } from './config';
import { TOKEN_KEY } from './api';

class CompensatoryLeaveAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/compensatory-leave`;
  }

  // Get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem(TOKEN_KEY);
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Handle API response
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // Create compensatory leave assignment (HR/Admin only)
  async create(data) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // Get all compensatory leave records (HR/Admin only)
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${this.baseURL}?${queryString}` : this.baseURL;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Get summary statistics (HR/Admin only)
  async getSummary() {
    const response = await fetch(`${this.baseURL}/summary`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Get current user's compensatory credits
  async getMyCredits(status = null) {
    const url = status ? `${this.baseURL}/my-credits?status=${status}` : `${this.baseURL}/my-credits`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Get total active credits for current user
  async getMyTotalCredits() {
    const response = await fetch(`${this.baseURL}/my-credits/total`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Get credits by month for current user
  async getMyCreditsByMonth() {
    const response = await fetch(`${this.baseURL}/my-credits/by-month`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Get compensatory leave record by ID
  async getById(id) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Update compensatory leave record (HR/Admin only)
  async update(id, data) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // Delete compensatory leave record (HR/Admin only)
  async delete(id) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return true; // DELETE returns no content on success
  }

  // Expire old credits (HR/Admin only)
  async expireOldCredits() {
    const response = await fetch(`${this.baseURL}/expire-old`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Helper methods for frontend integration
  
  // Get active credits for a specific employee (HR/Admin only)
  async getEmployeeCredits(employeeId) {
    return this.getAll({ employeeId, status: 'active' });
  }

  // Get credits expiring soon (HR/Admin only)
  async getExpiringSoon(days = 30) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    return this.getAll({ 
      status: 'active',
      endDate: endDate.toISOString().split('T')[0]
    });
  }

  // Bulk assign credits to multiple employees (HR/Admin only)
  async bulkAssign(assignments) {
    const promises = assignments.map(assignment => this.create(assignment));
    return Promise.all(promises);
  }
}

export const compensatoryLeaveAPI = new CompensatoryLeaveAPI();
export default compensatoryLeaveAPI;
