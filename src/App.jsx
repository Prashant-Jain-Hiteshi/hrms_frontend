import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Login from './components/Login';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import HRDashboard from './components/Dashboard/HRDashboard';
import EmployeeDashboard from './components/Dashboard/EmployeeDashboard';
import FinanceDashboard from './components/Dashboard/FinanceDashboard';

// Dashboard Router Component
const DashboardRouter = () => {
  const { user } = useAuth();

  const getDashboardComponent = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'hr':
        return <HRDashboard />;
      case 'finance':
        return <FinanceDashboard />;
      default:
        return <EmployeeDashboard />;
    }
  };

  return getDashboardComponent();
};

// Import Employee Management
import EmployeeList from './components/Employees/EmployeeList';
import AttendanceManagement from './components/Attendance/AttendanceManagement';
import LeaveManagement from './components/Leave/LeaveManagement';
import PayrollManagement from './components/Payroll/PayrollManagement';
import RecruitmentManagement from './components/Recruitment/RecruitmentManagement';
import PerformanceManagement from './components/Performance/PerformanceManagement';
import ExpenseManagement from './components/Expenses/ExpenseManagement';
import DocumentManagement from './components/Documents/DocumentManagement';
import ReportsManagement from './components/Reports/ReportsManagement';
import SettingsManagement from './components/Settings/SettingsManagement';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardRouter />} />
                <Route path="employees" element={<EmployeeList />} />
                <Route path="attendance" element={<AttendanceManagement />} />
                <Route path="leave" element={<LeaveManagement />} />
                <Route path="payroll" element={<PayrollManagement />} />
                <Route path="recruitment" element={<RecruitmentManagement />} />
                <Route path="performance" element={<PerformanceManagement />} />
                <Route path="expenses" element={<ExpenseManagement />} />
                <Route path="documents" element={<DocumentManagement />} />
                <Route path="reports" element={<ReportsManagement />} />
                <Route path="settings" element={<SettingsManagement />} />
                <Route path="test" element={<div className="p-6"><h1 className="text-2xl font-bold">Test Page</h1><p>This is a test page to verify routing works.</p></div>} />
              </Route>
            </Routes>
          </div>
        </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
