import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from './NotificationContext';
import { getToken } from './tokenUtils';

/**
 * Hook to manage notification system authentication
 * Automatically connects/disconnects socket based on auth state
 */
export const useNotificationAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const { initializeConnection, disconnect, isConnected } = useNotifications();

  useEffect(() => {
    // Don't do anything while auth is loading
    if (authLoading) {
      return;
    }

    // If user is authenticated, initialize notification system
    if (user) {
      const token = getToken(); // Use centralized token utility
      if (token && !isConnected) {
        console.log('🔐 User authenticated, initializing notifications...');
        initializeConnection(token);
      }
    } else {
      // If user is not authenticated, disconnect
      if (isConnected) {
        console.log('🔓 User logged out, disconnecting notifications...');
        disconnect();
      }
    }

    // Cleanup on unmount
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [user, authLoading, isConnected, initializeConnection, disconnect]);

  return {
    isAuthenticated: !!user,
    isConnected,
    user
  };
};

export default useNotificationAuth;
