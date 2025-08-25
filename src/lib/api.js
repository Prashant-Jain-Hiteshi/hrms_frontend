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
  update: (id, data) => api.patch(`/employees/${id}`, data),
  // Using PUT due to browser/PATCH issues
  // update: (id, data) => api.patch(`/employees/${id}`, data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  remove: (id) => api.delete(`/employees/${id}`),
};
