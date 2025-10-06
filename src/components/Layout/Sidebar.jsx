import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import Logo from '../ui/Logo';
import {
  Building2, LayoutDashboard, Users, Clock, Calendar, DollarSign,
  UserPlus, TrendingUp, BookOpen, Receipt, FileText, Bell,
  Settings, LogOut, Menu, X, ChevronDown, ChevronRight, User
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [isEmployeePortalOpen, setIsEmployeePortalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      permission: null
    },
    {
      title: 'Employees',
      icon: Users,
      path: '/employees',
      permission: 'employees'
    },
    {
      title: 'Attendance',
      icon: Clock,
      path: '/attendance',
      permission: 'attendance'
    },
    {
      title: 'Leave Management',
      icon: Calendar,
      path: '/leave',
      permission: 'leave'
    },
    {
      title: 'Payroll',
      icon: DollarSign,
      path: '/payroll',
      permission: 'payroll'
    },
    {
      title: 'Recruitment',
      icon: UserPlus,
      path: '/recruitment',
      permission: 'recruitment'
    },
    {
      title: 'Performance',
      icon: TrendingUp,
      path: '/performance',
      permission: 'performance'
    },
    {
      title: 'Expenses',
      icon: Receipt,
      path: user?.role === 'employee' ? '/employee/expenses' : '/expenses',
      permission: null // Allow all users to see expenses
    },
    {
      title: 'Documents',
      icon: FileText,
      path: '/documents',
      permission: 'documents'
    },
    {
      title: 'Reports',
      icon: FileText,
      path: '/reports',
      permission: 'reports'
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission) || hasPermission('all')
  );

  // Employee Portal Items (for HR and Finance users to access employee view)
  const employeePortalItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/employee/dashboard',
      description: 'My personal dashboard'
    },
    {
      title: 'Attendance',
      icon: Clock,
      path: '/employee/attendance',
      description: 'My attendance records'
    },
    {
      title: 'Leave Management',
      icon: Calendar,
      path: '/employee/leave',
      description: 'My leave requests'
    },
    {
      title: 'Expenses',
      icon: Receipt,
      path: '/employee/expenses',
      description: 'My expense reimbursements'
    },
    {
      title: 'Documents',
      icon: FileText,
      path: '/employee/documents',
      description: 'My personal documents'
    }
  ];

  // Check if user is HR or Finance (should have both management and employee access)
  // Admin users only get management access, not employee portal
  // Regular employees get direct access, no portal needed
  const canAccessEmployeePortal = user?.role === 'hr' || user?.role === 'finance';


  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full sidebar-gradient border-r border-gray-200 dark:border-gray-700 z-50 transition-transform duration-300 ease-in-out",
        "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <Logo />
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-white/20 text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-2">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-white/80 truncate">
                  {user?.designation}
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/20 text-white">
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* HR Management Section */}
              <div>
                {/* <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 px-3">
                  HR Management
                </h3> */}
                <ul className="space-y-2">
                  {filteredMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          className={({ isActive }) => cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            isActive
                              ? "bg-white/20 text-white"
                              : "text-white/80 hover:bg-white/10 hover:text-white"
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span>{item.title}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Employee Portal Section (only for HR and Finance users) */}
              {canAccessEmployeePortal && (
                <div>
                  <button
                    onClick={() => setIsEmployeePortalOpen(!isEmployeePortalOpen)}
                    className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-white/60 uppercase tracking-wider hover:text-white/80 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>My Employee Portal</span>
                    </div>
                    {isEmployeePortalOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  
                  {isEmployeePortalOpen && (
                    <ul className="space-y-2 mt-2 ml-2">
                      {employeePortalItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.path}>
                            <NavLink
                              to={item.path}
                              className={({ isActive }) => cn(
                                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors border-l-2 border-white/20",
                                isActive
                                  ? "bg-white/20 text-white border-white"
                                  : "text-white/70 hover:bg-white/10 hover:text-white hover:border-white/40"
                              )}
                              onClick={() => setIsOpen(false)}
                              title={item.description}
                            >
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span>{item.title}</span>
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/20">
            <div className="space-y-2">
              <NavLink
                to="/settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors w-full text-left"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
