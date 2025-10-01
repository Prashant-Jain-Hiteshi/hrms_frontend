/**
 * Dashboard Refresh Utility
 * 
 * This utility manages the one-time hard refresh functionality for dashboards.
 * It ensures that when a user logs in and navigates to any dashboard,
 * the application performs a hard refresh only once per session.
 */

const REFRESH_FLAG_KEY = 'dashboard_refreshed';

/**
 * Check if dashboard has been refreshed in this session
 */
export const hasRefreshedThisSession = () => {
  try {
    return sessionStorage.getItem(REFRESH_FLAG_KEY) === 'true';
  } catch (error) {
    console.error('Error checking refresh status:', error);
    return false;
  }
};

/**
 * Mark dashboard as refreshed for this session
 */
export const markAsRefreshed = () => {
  try {
    sessionStorage.setItem(REFRESH_FLAG_KEY, 'true');
    console.log('✅ Dashboard marked as refreshed for this session');
  } catch (error) {
    console.error('Error marking dashboard as refreshed:', error);
  }
};

/**
 * Clear the refresh flag (usually called on logout)
 */
export const clearRefreshFlag = () => {
  try {
    sessionStorage.removeItem(REFRESH_FLAG_KEY);
    console.log('🧹 Dashboard refresh flag cleared');
  } catch (error) {
    console.error('Error clearing refresh flag:', error);
  }
};

/**
 * Perform one-time hard refresh for dashboard
 * @param {string} dashboardType - Type of dashboard (admin, employee, hr, finance)
 * @param {number} delay - Delay before refresh in milliseconds (default: 100)
 */
export const performOneTimeRefresh = (dashboardType = 'dashboard', delay = 100) => {
  try {
    // Check if already refreshed this session
    if (hasRefreshedThisSession()) {
      console.log(`🔍 ${dashboardType} dashboard already refreshed this session`);
      return false;
    }

    const currentPath = window.location.pathname;
    
    console.log(`🔍 ${dashboardType} Dashboard refresh check:`, {
      currentPath,
      dashboardType,
      hasRefreshed: hasRefreshedThisSession()
    });

    // Check if we're on a dashboard page
    const isDashboardPage = currentPath.includes(dashboardType.toLowerCase()) || 
                           currentPath === '/dashboard' || 
                           currentPath === '/';

    if (isDashboardPage) {
      console.log(`🔄 Performing one-time hard refresh for ${dashboardType} dashboard...`);
      
      // Mark as refreshed
      markAsRefreshed();
      
      // Perform hard refresh with delay
      setTimeout(() => {
        window.location.reload(true);
      }, delay);
      
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error in ${dashboardType} dashboard refresh logic:`, error);
    return false;
  }
};

/**
 * Hook-like function for dashboard components
 * @param {string} dashboardType - Type of dashboard
 */
export const useDashboardRefresh = (dashboardType) => {
  return () => performOneTimeRefresh(dashboardType);
};

export default {
  hasRefreshedThisSession,
  markAsRefreshed,
  clearRefreshFlag,
  performOneTimeRefresh,
  useDashboardRefresh
};
