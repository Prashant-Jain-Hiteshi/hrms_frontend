// Token utility to ensure consistent token key usage across the app
export const TOKEN_KEY = 'hrms_token';
export const USER_KEY = 'hrms_user';

/**
 * Get JWT token from localStorage
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Set JWT token in localStorage
 */
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Remove JWT token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Check if user is authenticated (has valid token)
 */
export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

/**
 * Get authorization headers for API requests
 */
export const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export default {
  TOKEN_KEY,
  USER_KEY,
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
  getAuthHeaders
};
