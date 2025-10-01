import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLE_PERMISSIONS } from '../data/users';
import { AuthAPI, TOKEN_KEY, USER_KEY } from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on app load
    const token = localStorage.getItem(TOKEN_KEY);
    const userData = localStorage.getItem(USER_KEY);
    
    const bootstrap = async () => {
      try {
        if (token && userData) {
          setUser(JSON.parse(userData));
          return;
        }
        if (token && !userData) {
          // Try to fetch user from backend
          const { data } = await AuthAPI.me();
          if (data) {
            localStorage.setItem(USER_KEY, JSON.stringify(data));
            setUser(data);
            return;
          }
        }
      } catch (e) {
        // On any error, clear invalid token
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await AuthAPI.login(email, password);
      // data: { access_token, user }
      const token = data?.access_token;
      const loggedInUser = data?.user;

      if (!token || !loggedInUser) {
        return { success: false, error: 'Invalid server response' };
      }

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch (err) {
      const message = err?.response?.data?.message || 'Invalid credentials';
      return { success: false, error: Array.isArray(message) ? message.join(', ') : message };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  };

  const value = {
    user,
    login,
    logout,
    hasPermission,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
