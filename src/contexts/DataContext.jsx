import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { MOCK_EMPLOYEES, MOCK_DEPARTMENTS } from '../data/mockData';
import { useAuth } from './AuthContext';
import { EmployeesAPI, AttendanceAPI } from '../lib/api';
import { LeaveAPI as LeaveCreditAPI } from '../lib/api';
import { LeaveAPI } from '../lib/leaveApi';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  // Core data states
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState(MOCK_DEPARTMENTS);
  const [myAttendance, setMyAttendance] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);
  const { user } = useAuth();
  const [allAttendance, setAllAttendance] = useState([]);
  const [allAttendanceLoading, setAllAttendanceLoading] = useState(false);
  
  // Extended module states
  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: 'Senior Software Engineer',
      department: 'Engineering',
      location: 'San Francisco, CA',
      type: 'Full-time',
      experience: '5+ years',
      applications: 45,
      status: 'active',
      postedDate: '2024-02-01',
      deadline: '2024-03-01',
      description: 'We are looking for a senior software engineer...'
    }
  ]);
  
  const [candidates, setCandidates] = useState([
    {
      id: 1,
      name: 'Alice Johnson',
      position: 'Senior Software Engineer',
      email: 'alice.johnson@email.com',
      phone: '+1 (555) 123-4567',
      experience: '6 years',
      status: 'interview',
      stage: 'Technical Round',
      appliedDate: '2024-02-10',
      rating: 4.5,
      jobId: 1
    }
  ]);
  
  const [expenses, setExpenses] = useState([
    {
      id: 1,
      employeeName: 'John Smith',
      employeeId: 'EMP001',
      category: 'Travel',
      description: 'Business trip to New York',
      amount: 1250.00,
      date: '2024-01-15',
      status: 'approved',
      receipt: 'receipt_001.pdf',
      approvedBy: 'Sarah Johnson',
      approvedDate: '2024-01-16'
    }
  ]);
  
  const [documents, setDocuments] = useState([
    {
      id: 1,
      name: 'Employee Handbook 2024',
      type: 'Policy',
      category: 'HR Policies',
      size: '2.5 MB',
      format: 'PDF',
      uploadedBy: 'Sarah Johnson',
      uploadDate: '2024-01-15',
      lastModified: '2024-01-20',
      status: 'active',
      access: 'public',
      downloads: 156,
      version: '2.1',
      description: 'Updated employee handbook with new policies'
    }
  ]);
  
  const [reports, setReports] = useState([
    {
      id: 1,
      name: 'Employee Attendance Report',
      category: 'Attendance',
      description: 'Monthly attendance summary for all employees',
      lastGenerated: '2024-01-22',
      frequency: 'Monthly',
      format: 'PDF',
      status: 'active',
      recipients: ['hr@company.com'],
      createdBy: 'HR Manager'
    }
  ]);
  
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: 'Complete React Certification',
      description: 'Obtain React Developer certification to improve frontend skills',
      category: 'Professional Development',
      progress: 75,
      deadline: '2024-03-31',
      status: 'in-progress',
      owner: 'John Doe',
      employeeId: 'EMP001'
    }
  ]);
  
  const [reviews, setReviews] = useState([
    {
      id: 1,
      employee: 'John Doe',
      employeeId: 'EMP001',
      reviewer: 'Sarah Wilson',
      period: 'Q1 2024',
      score: 4.2,
      status: 'completed',
      date: '2024-02-15',
      type: 'Quarterly Review'
    }
  ]);
  const [attendanceRecords, setAttendanceRecords] = useState([
    { id: 1, employeeId: 'EMP001', name: 'Admin User', date: '2024-08-23', checkIn: '09:00', checkOut: '18:00', status: 'present', hours: '9h 0m' },
    { id: 2, employeeId: 'EMP002', name: 'HR Manager', date: '2024-08-23', checkIn: '09:15', checkOut: '18:30', status: 'present', hours: '9h 15m' },
    { id: 3, employeeId: 'EMP003', name: 'Shubham Kumar', date: '2024-08-23', checkIn: '09:30', checkOut: '-', status: 'present', hours: '8h 30m' },
  ]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  // Leave credit configs (monthly credits per type)
  const [leaveCreditConfigs, setLeaveCreditConfigs] = useState([]);
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Complete Q3 Report', assignee: 'Admin User', priority: 'high', status: 'pending', dueDate: '2024-08-25' },
    { id: 2, title: 'Review Employee Performance', assignee: 'HR Manager', priority: 'medium', status: 'in_progress', dueDate: '2024-08-30' },
    { id: 3, title: 'Update System Documentation', assignee: 'Shubham Kumar', priority: 'low', status: 'pending', dueDate: '2024-09-05' },
  ]);

  // Computed dashboard stats
  const [dashboardStats, setDashboardStats] = useState({});

  // Derived: monthly credit for Annual Leave only (admin-configured)
  const monthlyCreditAnnual = useMemo(() => {
    try {
      if (!Array.isArray(leaveCreditConfigs)) return 0;
      const annual = leaveCreditConfigs.find((c) => {
        const lt = String(c?.leaveType || '').toLowerCase();
        return (lt === 'annual' || lt === 'annual leave' || lt === 'annual_leave') && (c?.isActive !== false);
      });
      const val = Number(annual?.monthlyCredit || 0);
      return Number.isFinite(val) ? Number(val.toFixed(2)) : 0;
    } catch { return 0; }
  }, [leaveCreditConfigs]);

  // Derived: total monthly credit sum of all active configs (if needed elsewhere)
  const monthlyCreditTotal = useMemo(() => {
    try {
      if (!Array.isArray(leaveCreditConfigs)) return 0;
      const sum = leaveCreditConfigs
        .filter((c) => c && c.isActive !== false)
        .reduce((acc, c) => acc + Number(c.monthlyCredit || 0), 0);
      const val = Number.isFinite(sum) ? Number(sum.toFixed(2)) : 0;
      return val;
    } catch { return 0; }
  }, [leaveCreditConfigs]);

  // Update dashboard stats whenever data changes
  useEffect(() => {
    const activeEmployees = employees.filter(emp => emp.status === 'active');
    const presentToday = attendanceRecords.filter(record => record.status === 'present');
    const pendingLeaves = leaveRequests.filter(leave => leave.status === 'pending');
    const pendingTasks = tasks.filter(task => task.status === 'pending');

    setDashboardStats({
      totalEmployees: activeEmployees.length,
      presentToday: presentToday.length,
      absentToday: activeEmployees.length - presentToday.length,
      pendingLeaves: pendingLeaves.length,
      pendingTasks: pendingTasks.length,
      totalDepartments: departments.length,
      newEmployeesThisMonth: activeEmployees.filter(emp => {
        const joinDate = new Date(emp.joiningDate);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
      }).length
    });
  }, [employees, attendanceRecords, leaveRequests, tasks, departments]);

  // Load employees and leave requests from backend on first mount
  useEffect(() => {
    fetchEmployees();
    fetchLeaveRequests();
    fetchLeaveTypes();
    fetchLeaveCreditConfigs();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await EmployeesAPI.list({ limit: 200, offset: 0 });
      const data = res?.data?.rows || res?.data || [];
      if (Array.isArray(data)) setEmployees(data);
    } catch (e) {
      // Fallback to mocks when API not available
      setEmployees(MOCK_EMPLOYEES);
    }
  };

  // Leave credit configuration (backend-driven monthly credits)
  const fetchLeaveCreditConfigs = async () => {
    try {
      const res = await LeaveCreditAPI.getConfigs();
      const data = res?.data;
      setLeaveCreditConfigs(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      setLeaveCreditConfigs([]);
      return [];
    }
  };

  const fetchAttendanceStatus = async (date) => {
    try {
      const { data } = await AttendanceAPI.status(date);
      setAttendanceStatus(data || null);
      return data;
    } catch (e) {
      setAttendanceStatus(null);
      return null;
    }
  };

  // Load my attendance, summary, and status on auth
  useEffect(() => {
    if (user) {
      const from = new Date();
      from.setDate(1);
      fetchMyAttendance({ from: from.toISOString().slice(0, 10) });
      fetchAttendanceSummary('week');
      fetchAttendanceStatus();
      if (user.role === 'admin' || user.role === 'hr') {
        const today = new Date().toISOString().slice(0, 10);
        fetchAllAttendance({ from: today, to: today });
      }
    }
  }, [user]);

  // Employee CRUD operations
  const addEmployee = async (employeeData) => {
    // Build payload matching backend CreateEmployeeDto
    const payload = {
      name: employeeData.name,
      email: employeeData.email,
      phone: employeeData.phone,
      address: employeeData.address || '',
      department: employeeData.department,
      designation: employeeData.designation,
      joiningDate: employeeData.joiningDate || new Date().toISOString().split('T')[0],
      salary: employeeData.salary ? Number(employeeData.salary) : 0,
      status: employeeData.status || 'active',
    };
    try {
      const res = await EmployeesAPI.create(payload);
      const created = res?.data || payload;
      setEmployees(prev => [...prev, created]);
      return created;
    } catch (e) {
      // Fallback: add locally if API fails
      const local = { ...payload, id: Date.now(), employeeId: `EMP${String(Date.now()).slice(-6)}` };
      setEmployees(prev => [...prev, local]);
      return local;
    }
  };

  const updateEmployee = async (employeeId, employeeData) => {
    // Build payload matching backend UpdateEmployeeDto
    const payload = {
      name: employeeData.name,
      email: employeeData.email,
      phone: employeeData.phone,
      address: employeeData.address,
      department: employeeData.department,
      designation: employeeData.designation,
      joiningDate: employeeData.joiningDate,
      salary: typeof employeeData.salary === 'number' ? employeeData.salary : (employeeData.salary ? Number(employeeData.salary) : undefined),
      status: employeeData.status,
    };
    try {
      const res = await EmployeesAPI.update(employeeId, payload);
      const updated = res?.data || { id: employeeId, ...payload };
      setEmployees(prev => prev.map(emp => (emp.id === employeeId ? { ...emp, ...updated } : emp)));
      return updated;
    } catch (e) {
      // Fallback: update locally
      setEmployees(prev => prev.map(emp => (emp.id === employeeId ? { ...emp, ...payload } : emp)));
      return { id: employeeId, ...payload };
    }
  };

  const deleteEmployee = async (employeeId) => {
    try {
      await EmployeesAPI.remove(employeeId);
    } catch (e) {
      // swallow error and proceed with local cleanup (optimistic removal)
    }
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    // Also remove related attendance and leave records
    setAttendanceRecords(prev => prev.filter(record => record.employeeId !== employeeId));
    setLeaveRequests(prev => prev.filter(leave => leave.employeeId !== employeeId));
  };

  // Department CRUD operations
  const addDepartment = (departmentData) => {
    const newDepartment = {
      ...departmentData,
      id: Date.now(),
      createdDate: new Date().toISOString().split('T')[0]
    };
    setDepartments(prev => [...prev, newDepartment]);
    return newDepartment;
  };

  const updateDepartment = (departmentId, departmentData) => {
    setDepartments(prev => prev.map(dept => 
      dept.id === departmentId ? { ...dept, ...departmentData } : dept
    ));
  };

  const deleteDepartment = (departmentId) => {
    setDepartments(prev => prev.filter(dept => dept.id !== departmentId));
  };

  // Attendance CRUD operations
  // Backend-powered: self-service attendance for the logged-in user
  const fetchMyAttendance = async (params = {}) => {
    try {
      setAttendanceLoading(true);
      setAttendanceError(null);
      const { data } = await AttendanceAPI.my(params);
      setMyAttendance(Array.isArray(data) ? data : []);
      return data;
    } catch (e) {
      setAttendanceError(e?.response?.data?.message || 'Failed to load attendance');
      return [];
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchAttendanceSummary = async (range = 'week') => {
    try {
      const { data } = await AttendanceAPI.summary(range);
      setAttendanceSummary(data);
      return data;
    } catch (e) {
      return null;
    }
  };

  const attendanceCheckIn = async (payload = {}) => {
    const { data } = await AttendanceAPI.checkIn(payload);
    // If the check-in date is today, merge/update local myAttendance
    try {
      if (data?.date) {
        setMyAttendance((prev) => {
          const idx = prev.findIndex((r) => r.date === data.date);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], ...data };
            return copy;
          }
          return [data, ...prev];
        });
      }
    } catch {}
    try { await fetchAttendanceStatus(); } catch {}
    return data;
  };

  const attendanceCheckOut = async (payload = {}) => {
    const { data } = await AttendanceAPI.checkOut(payload);
    try {
      if (data?.date) {
        setMyAttendance((prev) => prev.map((r) => (r.date === data.date ? { ...r, ...data } : r)));
      }
    } catch {}
    try { await fetchAttendanceStatus(); } catch {}
    return data;
  };

  // Admin/HR: fetch all attendance records (optionally filtered by date range)
  const fetchAllAttendance = async (params = {}) => {
    try {
      setAllAttendanceLoading(true);
      const res = await AttendanceAPI.listAll(params);
      const data = res?.data;
      const rows = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
      setAllAttendance(rows);
      return rows;
    } catch (e) {
      setAllAttendance([]);
      return [];
    } finally {
      setAllAttendanceLoading(false);
    }
  };

  // Keep existing mock helpers for admin tables until backend endpoints are built for all-employee views
  const addAttendanceRecord = (recordData) => {
    const newRecord = {
      ...recordData,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    setAttendanceRecords(prev => [...prev, newRecord]);
    return newRecord;
  };

  const updateAttendanceRecord = (recordId, recordData) => {
    setAttendanceRecords(prev => prev.map(record => 
      record.id === recordId ? { ...record, ...recordData } : record
    ));
  };

  const deleteAttendanceRecord = (recordId) => {
    setAttendanceRecords(prev => prev.filter(record => record.id !== recordId));
  };

  // Leave CRUD operations - Backend integrated
  const addLeaveRequest = async (leaveData) => {
    try {
      const { data } = await LeaveAPI.create(leaveData);
      setLeaveRequests(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Failed to create leave request:', error);
      throw error; // Re-throw to let component handle the error
    }
  };

  const updateLeaveRequest = async (leaveId, leaveData) => {
    try {
      const { data } = await LeaveAPI.updateStatus(leaveId, leaveData);
      setLeaveRequests(prev => prev.map(leave => 
        leave.id === leaveId ? { ...leave, ...data } : leave
      ));
      return data;
    } catch (error) {
      console.error('Failed to update leave request:', error);
      throw error; // Re-throw to let component handle the error
    }
  };

  const deleteLeaveRequest = async (leaveId) => {
    try {
      await LeaveAPI.delete(leaveId);
      setLeaveRequests(prev => prev.filter(leave => leave.id !== leaveId));
    } catch (error) {
      console.error('Failed to delete leave request:', error);
      throw error; // Re-throw to let component handle the error
    }
  };

  const cancelLeave = async (leaveId, comments = '') => {
    try {
      const { data } = await LeaveAPI.cancel(leaveId, { comments });
      setLeaveRequests(prev => prev.map(leave => 
        leave.id === leaveId ? { ...leave, ...data } : leave
      ));
      return data;
    } catch (error) {
      console.error('Failed to cancel leave request:', error);
      throw error;
    }
  };

  // Load leave requests from backend
  const fetchLeaveRequests = async () => {
    try {
      const res = await LeaveAPI.list();
      const data = res?.data || [];
      if (Array.isArray(data)) setLeaveRequests(data);
    } catch (e) {
      setLeaveRequests([]);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const { data } = await LeaveAPI.leaveTypes.getAll();
      setLeaveTypes(data || []);
    } catch (error) {
      console.error('Failed to fetch leave types:', error);
      // Fallback to mock data
      setLeaveTypes([
        { id: 1, name: 'Annual Leave', numberOfLeaves: 20, description: 'Annual vacation leave', requiresApproval: true, carryForward: true, encashment: false, eligibility: 'all', isActive: true },
        { id: 2, name: 'Sick Leave', numberOfLeaves: 10, description: 'Medical leave for illness', requiresApproval: false, carryForward: false, encashment: false, eligibility: 'all', isActive: true },
        { id: 3, name: 'Casual Leave', numberOfLeaves: 5, description: 'Short-term personal leave', requiresApproval: true, carryForward: false, encashment: false, eligibility: 'all', isActive: true },
        { id: 4, name: 'Maternity Leave', numberOfLeaves: 90, description: 'Maternity leave for new mothers', requiresApproval: true, carryForward: false, encashment: false, eligibility: 'female', isActive: true }
      ]);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const { data } = await LeaveAPI.balance();
      return data || {};
    } catch (error) {
      console.error('Failed to fetch leave balance:', error);
      return {};
    }
  };

  const fetchLeaveRequestsForApproval = async () => {
    try {
      const res = await LeaveAPI.forApproval();
      return res?.data || [];
    } catch (error) {
      console.error('Failed to fetch leave requests for approval:', error);
      return [];
    }
  };

  const fetchLeaveRequestsForCC = async () => {
    try {
      const res = await LeaveAPI.ccRequests();
      return res?.data || [];
    } catch (error) {
      console.error('Failed to fetch CC leave requests:', error);
      return [];
    }
  };

  // Mark CC leave request as read
  const markLeaveAsRead = async (leaveId) => {
    try {
      await LeaveAPI.markAsRead(leaveId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Leave Types CRUD
  const addLeaveType = async (leaveTypeData) => {
    try {
      const res = await LeaveAPI.leaveTypes.create(leaveTypeData);
      const newLeaveType = res?.data;
      if (newLeaveType) {
        setLeaveTypes(prev => [...prev, newLeaveType]);
      }
      return newLeaveType;
    } catch (error) {
      console.error('Failed to create leave type:', error);
      throw error;
    }
  };

  const updateLeaveType = async (id, updates) => {
    try {
      const res = await LeaveAPI.leaveTypes.update(id, updates);
      const updatedLeaveType = res?.data;
      if (updatedLeaveType) {
        setLeaveTypes(prev => prev.map(type => type.id === id ? updatedLeaveType : type));
      }
      return updatedLeaveType;
    } catch (error) {
      console.error('Failed to update leave type:', error);
      throw error;
    }
  };

  const deleteLeaveType = async (id) => {
    try {
      await LeaveAPI.leaveTypes.delete(id);
      setLeaveTypes(prev => prev.filter(type => type.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Failed to delete leave type:', error);
      throw error;
    }
  };

  const searchLeaveTypes = async (searchTerm) => {
    try {
      const res = await LeaveAPI.leaveTypes.search(searchTerm);
      return res?.data || [];
    } catch (error) {
      console.error('Failed to search leave types:', error);
      return [];
    }
  };

  // Tasks CRUD
  const addTask = (task) => {
    const newTask = { ...task, id: Date.now() };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = (id, updates) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, ...updates } : task));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  // Helpers local to leave allocation
  const _computeRequestDays = (req) => {
    // Prefer explicit days if valid
    const fallback = Number(req?.days);
    if (!Number.isNaN(fallback) && fallback > 0) return fallback;
    const s = req?.startDate || req?.start_date;
    const e = req?.endDate || req?.end_date || s;
    if (!s) return 0;
    try {
      const sd = new Date(s);
      const ed = new Date(e);
      sd.setHours(0,0,0,0);
      ed.setHours(0,0,0,0);
      const diff = Math.round((ed - sd) / (24 * 60 * 60 * 1000));
      return (diff >= 0 ? diff + 1 : 1);
    } catch {
      return fallback || 0;
    }
  };

  const _getRequestedTypeLabel = (req) => {
    const t = req?.type || req?.leaveType || req?.leave_type || req?.category || '';
    return String(t).trim();
  };

  const _pickAnnualTypeName = () => {
    if (Array.isArray(leaveTypes) && leaveTypes.length > 0) {
      const annual = leaveTypes.find(t => String(t?.name || t?.label || '')
        .toLowerCase().includes('annual'));
      if (annual?.name) return annual.name;
      if (annual?.label) return annual.label;
      // fallback to the leave type with highest allocation
      const sorted = [...leaveTypes].sort((a,b) => (Number(b?.numberOfLeaves||0) - Number(a?.numberOfLeaves||0)));
      if (sorted[0]?.name) return sorted[0].name;
      if (sorted[0]?.label) return sorted[0].label;
    }
    return 'Annual Leave';
  };

  const _getBalanceByType = (balanceObj = {}) => {
    // Try to normalize various possible shapes from backend
    // Expected best case: { byType: { [typeName]: availableDays }, lwp?: number }
    const byType = balanceObj.byType && typeof balanceObj.byType === 'object' ? balanceObj.byType : {};
    return byType;
  };

  // Leave approval/rejection functions - Backend integrated
  const approveLeave = async (leaveId, comments = '') => {
    try {
      // Find the request locally
      const req = leaveRequests.find(l => String(l?.id) === String(leaveId)) || {};
      const totalDays = _computeRequestDays(req);
      const requestedType = _getRequestedTypeLabel(req);
      const annualType = _pickAnnualTypeName();

      // Fetch current balance to drive allocation
      const balance = await fetchLeaveBalance();
      const byType = _getBalanceByType(balance);

      // Construct allocation: requested type -> annual -> LWP
      let remaining = Number(totalDays) || 0;
      const allocation = [];

      if (remaining > 0 && requestedType) {
        const avail = Number(byType[requestedType] ?? byType[requestedType?.toString?.()] ?? 0);
        const use = Math.max(0, Math.min(remaining, isFinite(avail) ? avail : 0));
        if (use > 0) {
          allocation.push({ type: requestedType, days: Number(use.toFixed(2)) });
          remaining = Number((remaining - use).toFixed(2));
        }
      }

      if (remaining > 0 && annualType && (!requestedType || annualType !== requestedType)) {
        const avail = Number(byType[annualType] ?? byType[annualType?.toString?.()] ?? 0);
        const use = Math.max(0, Math.min(remaining, isFinite(avail) ? avail : 0));
        if (use > 0) {
          allocation.push({ type: annualType, days: Number(use.toFixed(2)) });
          remaining = Number((remaining - use).toFixed(2));
        }
      }

      if (remaining > 0) {
        // Anything left becomes LWP
        allocation.push({ type: 'LWP', days: Number(remaining.toFixed(2)) });
        remaining = 0;
      }

      const payload = { status: 'approved', comments, allocation };

      const { data } = await LeaveAPI.updateStatus(leaveId, payload);
      setLeaveRequests(prev => prev.map(leave => 
        leave.id === leaveId ? { ...leave, ...data, allocation } : leave
      ));
      return data;
    } catch (error) {
      console.error('Failed to approve leave request:', error);
      throw error; // Re-throw to let component handle the error
    }
  };

  const rejectLeave = async (leaveId, comments = '') => {
    try {
      const { data } = await LeaveAPI.updateStatus(leaveId, { 
        status: 'rejected', 
        comments 
      });
      setLeaveRequests(prev => prev.map(leave => 
        leave.id === leaveId ? { ...leave, ...data } : leave
      ));
      return data;
    } catch (error) {
      console.error('Failed to reject leave request:', error);
      throw error; // Re-throw to let component handle the error
    }
  };

  // Quick actions for dashboard
  const quickActions = {
    markAttendance: (employeeId, status = 'present') => {
      const employee = employees.find(emp => emp.id === employeeId);
      if (employee) {
        const existingRecord = attendanceRecords.find(record => 
          record.employeeId === employee.employeeId && 
          record.date === new Date().toISOString().split('T')[0]
        );
        
        if (existingRecord) {
          updateAttendanceRecord(existingRecord.id, { status });
        } else {
          addAttendanceRecord({
            employeeId: employee.employeeId,
            name: employee.name,
            checkIn: status === 'present' ? new Date().toLocaleTimeString() : '-',
            checkOut: '-',
            date: new Date().toISOString().split('T')[0],
            status,
            hours: '0h 0m'
          });
        }
      }
    },
    
    approveLeave: (leaveId) => {
      updateLeaveRequest(leaveId, { status: 'approved' });
    },
    
    rejectLeave: (leaveId) => {
      updateLeaveRequest(leaveId, { status: 'rejected' });
    },
    
    completeTask: (taskId) => {
      updateTask(taskId, { status: 'completed' });
    },
    
    assignTask: (taskData) => {
      return addTask(taskData);
    }
  };

  // Recruitment CRUD operations
  const addJob = (jobData) => {
    const newJob = {
      ...jobData,
      id: Date.now(),
      applications: 0,
      status: 'active',
      postedDate: new Date().toISOString().split('T')[0]
    };
    setJobs(prev => [...prev, newJob]);
    return newJob;
  };

  const updateJob = (jobId, jobData) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, ...jobData } : job
    ));
  };

  const deleteJob = (jobId) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
    // Remove related candidates
    setCandidates(prev => prev.filter(candidate => candidate.jobId !== jobId));
  };

  const addCandidate = (candidateData) => {
    const newCandidate = {
      ...candidateData,
      id: Date.now(),
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'applied',
      stage: 'Initial Review'
    };
    setCandidates(prev => [...prev, newCandidate]);
    // Update job application count
    setJobs(prev => prev.map(job => 
      job.id === candidateData.jobId 
        ? { ...job, applications: job.applications + 1 }
        : job
    ));
    return newCandidate;
  };

  const updateCandidate = (candidateId, candidateData) => {
    setCandidates(prev => prev.map(candidate => 
      candidate.id === candidateId ? { ...candidate, ...candidateData } : candidate
    ));
  };

  const deleteCandidate = (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId);
    setCandidates(prev => prev.filter(candidate => candidate.id !== candidateId));
    // Update job application count
    if (candidate) {
      setJobs(prev => prev.map(job => 
        job.id === candidate.jobId 
          ? { ...job, applications: Math.max(0, job.applications - 1) }
          : job
      ));
    }
  };

  // Expense CRUD operations
  const addExpense = (expenseData) => {
    const newExpense = {
      ...expenseData,
      id: Date.now(),
      date: expenseData.date || new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    setExpenses(prev => [...prev, newExpense]);
    return newExpense;
  };

  const updateExpense = (expenseId, expenseData) => {
    setExpenses(prev => prev.map(expense => 
      expense.id === expenseId ? { ...expense, ...expenseData } : expense
    ));
  };

  const deleteExpense = (expenseId) => {
    setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
  };

  // Document CRUD operations
  const addDocument = (documentData) => {
    const newDocument = {
      ...documentData,
      id: Date.now(),
      uploadDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      status: 'active',
      downloads: 0,
      version: '1.0'
    };
    setDocuments(prev => [...prev, newDocument]);
    return newDocument;
  };

  const updateDocument = (documentId, documentData) => {
    setDocuments(prev => prev.map(document => 
      document.id === documentId 
        ? { ...document, ...documentData, lastModified: new Date().toISOString().split('T')[0] }
        : document
    ));
  };

  const deleteDocument = (documentId) => {
    setDocuments(prev => prev.filter(document => document.id !== documentId));
  };

  // Report CRUD operations
  const addReport = (reportData) => {
    const newReport = {
      ...reportData,
      id: Date.now(),
      lastGenerated: new Date().toISOString().split('T')[0],
      status: 'active'
    };
    setReports(prev => [...prev, newReport]);
    return newReport;
  };

  const updateReport = (reportId, reportData) => {
    setReports(prev => prev.map(report => 
      report.id === reportId ? { ...report, ...reportData } : report
    ));
  };

  const deleteReport = (reportId) => {
    setReports(prev => prev.filter(report => report.id !== reportId));
  };

  // Performance CRUD operations
  const addGoal = (goalData) => {
    const newGoal = {
      ...goalData,
      id: Date.now(),
      progress: 0,
      status: 'pending'
    };
    setGoals(prev => [...prev, newGoal]);
    return newGoal;
  };

  const updateGoal = (goalId, goalData) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId ? { ...goal, ...goalData } : goal
    ));
  };

  const deleteGoal = (goalId) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
  };

  const addReview = (reviewData) => {
    const newReview = {
      ...reviewData,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    setReviews(prev => [...prev, newReview]);
    return newReview;
  };

  const updateReview = (reviewId, reviewData) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId ? { ...review, ...reviewData } : review
    ));
  };

  const deleteReview = (reviewId) => {
    setReviews(prev => prev.filter(review => review.id !== reviewId));
  };

  // Role-based data filtering
  const getFilteredData = (dataType, userRole, userId) => {
    switch (dataType) {
      case 'expenses':
        if (userRole === 'employee') {
          return expenses.filter(expense => expense.employeeId === userId);
        }
        if (userRole === 'finance') {
          return expenses; // Finance can see all expenses
        }
        if (userRole === 'hr' || userRole === 'admin') {
          return expenses; // HR and Admin can see all expenses
        }
        return [];
      
      case 'goals':
        if (userRole === 'employee') {
          return goals.filter(goal => goal.employeeId === userId);
        }
        if (userRole === 'hr' || userRole === 'admin') {
          return goals; // HR and Admin can see all goals
        }
        return [];
      
      case 'reviews':
        if (userRole === 'employee') {
          return reviews.filter(review => review.employeeId === userId);
        }
        if (userRole === 'hr' || userRole === 'admin') {
          return reviews; // HR and Admin can see all reviews
        }
        return [];
      
      case 'documents':
        if (userRole === 'employee') {
          return documents.filter(doc => doc.access === 'public' || doc.uploadedBy === userId);
        }
        if (userRole === 'hr' || userRole === 'admin') {
          return documents; // HR and Admin can see all documents
        }
        return documents.filter(doc => doc.access === 'public');
      
      case 'jobs':
        return jobs; // All roles can view jobs
      
      case 'candidates':
        if (userRole === 'hr' || userRole === 'admin') {
          return candidates; // Only HR and Admin can see candidates
        }
        return [];
      
      case 'reports':
        if (userRole === 'finance') {
          return reports.filter(report => report.category === 'Finance' || report.category === 'Expenses');
        }
        if (userRole === 'hr' || userRole === 'admin') {
          return reports; // HR and Admin can see all reports
        }
        return [];
      
      default:
        return [];
    }
  };

  const value = {
    // Employee CRUD
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    
    // Department CRUD
    departments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    
    // Attendance CRUD
    attendanceRecords,
    myAttendance,
    attendanceSummary,
    attendanceStatus,
    attendanceLoading,
    attendanceError,
    fetchMyAttendance,
    fetchAttendanceSummary,
    fetchAttendanceStatus,
    attendanceCheckIn,
    attendanceCheckOut,
    allAttendance,
    allAttendanceLoading,
    fetchAllAttendance,
    addAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    
    // Leave CRUD
    leaveRequests,
    addLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
    fetchLeaveRequests,
    fetchLeaveRequestsForApproval,
    fetchLeaveRequestsForCC,
    markLeaveAsRead,
    approveLeave,
    rejectLeave,
    cancelLeave,
    
    // Leave Types CRUD
    leaveTypes,
    fetchLeaveTypes,
    fetchLeaveBalance,
    // Leave credit config (backend monthly credits)
    leaveCreditConfigs,
    monthlyCreditTotal,
    monthlyCreditAnnual,
    fetchLeaveCreditConfigs,
    addLeaveType,
    updateLeaveType,
    deleteLeaveType,
    searchLeaveTypes,
    
    // Tasks CRUD
    tasks,
    addTask,
    updateTask,
    deleteTask,
    
    // Recruitment CRUD
    jobs,
    addJob,
    updateJob,
    deleteJob,
    candidates,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    
    // Expense CRUD
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    
    // Document CRUD
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    
    // Report CRUD
    reports,
    addReport,
    updateReport,
    deleteReport,
    
    // Performance CRUD
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    reviews,
    addReview,
    updateReview,
    deleteReview,
    
    // Role-based filtering
    getFilteredData,
    
    // Permission checking
    canUserPerformAction: (action, userRole) => {
      const permissions = {
        'create_job': ['hr', 'admin'],
        'manage_candidates': ['hr', 'admin'],
        'create_goal': ['hr', 'admin', 'employee'],
        'create_expense': ['employee', 'hr', 'admin'],
        'approve_expense': ['finance', 'admin'],
        'upload_document': ['hr', 'admin'],
        'generate_report': ['hr', 'finance', 'admin'],
        'manage_employees': ['hr', 'admin'],
        'view_all_data': ['admin']
      };
      
      return permissions[action]?.includes(userRole) || false;
    },
    
    // Dashboard stats
    dashboardStats,
    
    // Quick actions for dashboard
    quickActions
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
