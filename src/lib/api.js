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
      // Optionally keep user for redirect context, but typically clear it too
      // localStorage.removeItem(USER_KEY);
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
};
