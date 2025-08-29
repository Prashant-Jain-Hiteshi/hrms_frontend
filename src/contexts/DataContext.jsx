import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_EMPLOYEES, MOCK_DEPARTMENTS } from '../data/mockData';
import { useAuth } from './AuthContext';
import { EmployeesAPI, AttendanceAPI } from '../lib/api';
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
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Complete Q3 Report', assignee: 'Admin User', priority: 'high', status: 'pending', dueDate: '2024-08-25' },
    { id: 2, title: 'Review Employee Performance', assignee: 'HR Manager', priority: 'medium', status: 'in_progress', dueDate: '2024-08-30' },
    { id: 3, title: 'Update System Documentation', assignee: 'Shubham Kumar', priority: 'low', status: 'pending', dueDate: '2024-09-05' },
  ]);

  // Computed dashboard stats
  const [dashboardStats, setDashboardStats] = useState({});

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
    let mounted = true;
    (async () => {
      try {
        const res = await EmployeesAPI.list({ limit: 200, offset: 0 });
        const data = res?.data?.rows || res?.data || [];
        if (mounted && Array.isArray(data)) setEmployees(data);
      } catch (e) {
        // Fallback to mocks when API not available
        if (mounted) setEmployees(MOCK_EMPLOYEES);
      }

      // Load leave requests from backend
      try {
        const leaveRes = await LeaveAPI.list();
        const leaveData = leaveRes?.data || [];
        if (mounted && Array.isArray(leaveData)) setLeaveRequests(leaveData);
      } catch (e) {
        // Keep empty array if API fails
        if (mounted) setLeaveRequests([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
      const { data } = await LeaveAPI.list();
      setLeaveRequests(Array.isArray(data) ? data : []);
      return data;
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
      setLeaveRequests([]);
      return [];
    }
  };

  // Get leave requests for approval (TO users)
  const fetchLeaveRequestsForApproval = async () => {
    try {
      const { data } = await LeaveAPI.forApproval();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  };

  // Get leave requests where user is in CC
  const fetchLeaveRequestsForCC = async () => {
    try {
      const { data } = await LeaveAPI.ccRequests();
      return Array.isArray(data) ? data : [];
    } catch (error) {
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

  // Task CRUD operations
  const addTask = (taskData) => {
    const newTask = {
      ...taskData,
      id: Date.now(),
      status: 'pending'
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = (taskId, taskData) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...taskData } : task
    ));
  };

  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  // Leave approval/rejection functions - Backend integrated
  const approveLeave = async (leaveId, comments = '') => {
    try {
      const { data } = await LeaveAPI.updateStatus(leaveId, { 
        status: 'approved', 
        comments 
      });
      setLeaveRequests(prev => prev.map(leave => 
        leave.id === leaveId ? { ...leave, ...data } : leave
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
