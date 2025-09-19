import axios from 'axios';

// Base URL from Vite env
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

// LocalStorage keys
export const TOKEN_KEY = 'hrms_token';
export const USER_KEY = 'hrms_user';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach Authorization header if token exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      // Best-effort cleanup
      localStorage.removeItem(TOKEN_KEY);
0      // localStorage.removeItem(USER_KEY);
      // Redirect to login if we are in browser context
      if (typeof window !== 'undefined' && window.location) {
        if (!window.location.pathname.includes('/login')) {
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const AuthAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// Employees endpoints
export const EmployeesAPI = {
  list: (params = {}) => api.get('/employees', { params }),
  create: (data) => api.post('/employees', data),
  // Using PUT due to browser/PATCH issues
  update: (id, data) => api.put(`/employees/${id}`, data),
  remove: (id) => api.delete(`/employees/${id}`),
};

// Attendance endpoints
export const AttendanceAPI = {
  checkIn: (data = {}) => api.post('/attendance/check-in', data),
  checkOut: (data = {}) => api.post('/attendance/check-out', data),
  my: (params = {}) => api.get('/attendance/me', { params }),
  summary: (range = 'week') => api.get('/attendance/summary', { params: { range } }),
  listAll: (params = {}) => api.get('/attendance', { params }),
  status: (date) => api.get('/attendance/status', { params: date ? { date } : {} }),
  adminStatus: (userId, date) => api.get('/attendance/admin-status', { params: { userId, ...(date ? { date } : {}) } }),
  weekly: () => api.get('/attendance/weekly'),
  updateSession: ({ sessionId, startTime, endTime }) => api.put('/attendance/admin-session', { sessionId, startTime, endTime }),
  generateReport: async ({ type, date, from, to, format = 'excel' } = {}) => {
    const params = { type, format };
    if (type === 'daily' && date) params.date = date;
    if (type === 'monthly' && date) params.date = date; // yyyy-mm
    if (type === 'range') {
      if (from) params.from = from;
      if (to) params.to = to;
    }
    const res = await api.get('/attendance/report', { params, responseType: 'blob' });
    return res.data; // blob
  },
  // New endpoints for total present/absent data
  getEmployeeSummary: (params = {}) => api.get('/attendance/employee-summary', { params }),
  getOverallStats: (params = {}) => api.get('/attendance/overall-stats', { params }),
  getStatsByRange: (from, to) => api.get(`/attendance/stats-by-range?from=${from}&to=${to}`),
  addEmployeeAttendance: (attendanceData) => api.post('/attendance/add-employee-attendance', attendanceData),
  getAttendanceForDate: (date) => api.get(`/attendance/date-details?date=${date}`),
};

// Leave endpoints
export const LeaveAPI = {
  // Credit Configs
  getConfigs: () => api.get('/leave/credit-config'),
  createConfig: (data) => api.post('/leave/credit-config', data),
  // Using PUT due to browser/PATCH issues
  updateConfig: (leaveType, data) => api.put(`/leave/credit-config/${encodeURIComponent(leaveType)}`, data),
  deleteCreditConfig: (leaveType) => api.delete(`/leave/credit-config/${encodeURIComponent(leaveType)}`),
  // Trigger monthly credits processing (admin)
  triggerMonthlyCredits: () => api.post('/leave/trigger-monthly-credits'),
  // DOJ-based balance for current user
  myBalance: () => api.get('/leave/balance'),
  // Leave statistics; admin can pass employeeId to query others
  statistics: (employeeId) => api.get('/leave/statistics', { params: employeeId ? { employeeId } : {} }),
};

// Leave Calendar (Admin): holidays, weekends, working-days
// Department endpoints
export const DepartmentAPI = {
  list: (params = {}) => api.get('/departments', { params }),
  get: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Payroll endpoints
export const PayrollAPI = {
  list: (params = {}) => api.get('/payroll', { params }),
  get: (id) => api.get(`/payroll/${id}`),
  create: (data) => api.post('/payroll', data),
  update: (id, data) => api.put(`/payroll/${id}`, data),
  delete: (id) => api.delete(`/payroll/${id}`),
  process: (data) => api.post('/payroll/process', data),
};

export const CalendarAPI = {
  holidays: {
    list: (params = {}) => api.get('/leave/calendar/holidays', { params }),
    create: (data) => api.post('/leave/calendar/holidays', data),
    // Use PUT for updates per user preference
    update: (id, data) => api.put(`/leave/calendar/holidays/${encodeURIComponent(id)}`, data),
    remove: (id) => api.delete(`/leave/calendar/holidays/${encodeURIComponent(id)}`),
  },
  weekends: {
    get: () => api.get('/leave/calendar/weekends'),
    // payload: { weekends: [0-6] } where 0=Sun ... 6=Sat
    update: (data) => api.put('/leave/calendar/weekends', data),
  },
  workingDays: {
    // params: { month: 'yyyy-mm' }
    monthly: (params = {}) => api.get('/leave/calendar/working-days', { params }),
  },
};
