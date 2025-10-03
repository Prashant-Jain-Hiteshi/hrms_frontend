import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to determine if the current user is in "employee mode"
 * This happens when:
 * 1. User is an actual employee (role = 'employee')
 * 2. HR/Finance user is accessing the employee portal (/employee/* routes)
 * Note: Admin users do NOT have access to employee portal
 */
export const useEmployeeMode = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Check if current route is under employee portal
  const isEmployeePortalRoute = location.pathname.startsWith('/employee/');
  
  // User is in employee mode if:
  // 1. They are an actual employee, OR
  // 2. They are HR/Finance accessing employee portal routes (Admin cannot access)
  const canAccessEmployeePortal = user?.role === 'hr' || user?.role === 'finance';
  const isEmployeeMode = user?.role === 'employee' || (isEmployeePortalRoute && canAccessEmployeePortal);
  
  // For components that need to know the "effective role"
  const effectiveRole = isEmployeePortalRoute ? 'employee' : user?.role;
  
  return {
    isEmployeeMode,
    effectiveRole,
    isEmployeePortalRoute,
    actualRole: user?.role
  };
};

export default useEmployeeMode;
