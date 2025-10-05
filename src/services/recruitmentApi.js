import { api } from '../lib/api';

// Department APIs
export const departmentApi = {
  // Get all departments (auto-creates defaults)
  getAll: () => api.get('/departments'),
  
  // Create new department
  create: (data) => api.post('/departments', data),
  
  // Get department by ID
  getById: (id) => api.get(`/departments/${id}`),
  
  // Update department
  update: (id, data) => api.put(`/departments/${id}`, data),
  
  // Delete department (soft delete)
  delete: (id) => api.delete(`/departments/${id}`)
};

// Job APIs
export const jobApi = {
  // Get all jobs with filters and pagination
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add pagination
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    // Add search
    if (params.search) queryParams.append('search', params.search);
    
    // Add filters
    if (params.department) queryParams.append('department', params.department);
    if (params.status) queryParams.append('status', params.status);
    if (params.jobType) queryParams.append('jobType', params.jobType);
    
    const queryString = queryParams.toString();
    return api.get(`/recruitment/jobs${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get job statistics for dashboard
  getStats: () => api.get('/recruitment/jobs/stats'),
  
  // Create new job
  create: (data) => api.post('/recruitment/jobs', data),
  
  // Get job by ID
  getById: (id) => api.get(`/recruitment/jobs/${id}`),
  
  // Update job
  update: (id, data) => api.put(`/recruitment/jobs/${id}`, data),
  
  // Delete job
  delete: (id) => api.delete(`/recruitment/jobs/${id}`)
};

// Recruitment Dashboard APIs
export const recruitmentDashboardApi = {
  // Get overview stats (combines job stats with other metrics)
  getOverviewStats: async () => {
    try {
      const [jobStats, departments] = await Promise.all([
        jobApi.getStats(),
        departmentApi.getAll()
      ]);
      
      return {
        jobStats: jobStats.data,
        departments: departments.data,
        // Mock data for now (will be replaced with real APIs later)
        totalApplications: 105,
        interviewsScheduled: 18,
        hiredThisMonth: 8,
        recruitmentFunnel: [
          { name: 'Applied', value: 105, color: '#3b82f6' },
          { name: 'Shortlisted', value: 35, color: '#f59e0b' },
          { name: 'Interview', value: 18, color: '#10b981' },
          { name: 'Hired', value: 8, color: '#8b5cf6' },
          { name: 'Rejected', value: 44, color: '#ef4444' }
        ],
        monthlyHiring: [
          { month: 'Aug', hired: 5, applications: 85 },
          { month: 'Sep', hired: 7, applications: 92 },
          { month: 'Oct', hired: 4, applications: 78 },
          { month: 'Nov', hired: 6, applications: 95 },
          { month: 'Dec', hired: 3, applications: 65 },
          { month: 'Jan', hired: 8, applications: 105 }
        ]
      };
    } catch (error) {
      throw error;
    }
  }
};
