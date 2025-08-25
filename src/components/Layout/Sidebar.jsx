import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import Logo from '../ui/Logo';
import {
  Building2, LayoutDashboard, Users, Clock, Calendar, DollarSign,
  UserPlus, TrendingUp, BookOpen, Receipt, FileText, Bell,
  Settings, LogOut, Menu, X
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

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
      path: '/expenses',
      permission: 'expenses'
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
