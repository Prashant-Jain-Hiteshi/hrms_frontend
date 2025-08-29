import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  Plus, Filter, Search, Download, FileText, Users, Eye
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { LeaveAPI } from '../../lib/leaveApi';

const LeaveManagement = () => {
  const { user } = useAuth();
  const { leaveRequests, addLeaveRequest, approveLeave, rejectLeave, cancelLeave, employees } = useData();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [mentions, setMentions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Role and tabs
  const role = String(user?.role || '').toLowerCase();
  const isHR = role === 'hr';
  const tabs = isHR ? ['overview', 'mentions', 'policies'] : ['overview', 'requests', 'mentions', 'policies'];

  // simple toast helper
  const notify = ({ type = 'info', message = '', timeout = 3000 }) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    setNotifications((prev) => [...prev, { id, type, message }]);
    if (timeout > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, timeout);
    }
  };
  // Determine if the leave belongs to the current user
  const isOwnLeave = (leave) => {
    const cands = [leave?.employeeId, leave?.employee_id, leave?.userId, leave?.user_id, leave?.applicantId, leave?.applicant_id, leave?.id]
      .filter(Boolean).map(String);
    return cands.some(id => userIdSet.has(String(id)));
  };

  // Determine if a given employee record refers to the current user
  const isSelfEmployee = (emp) => {
    const ids = extractIdCandidates(emp).map(String);
    return ids.some(id => userIdSet.has(id));
  };

  // fetcher for mentions
  const fetchMentions = async () => {
    try {
      const res = await LeaveAPI.mentions();
      const data = res?.data ?? [];
      setMentions(Array.isArray(data) ? data : []);
      console.debug('API Mentions result:', data);
    } catch (err) {
      setMentions([]);
      console.error('API Mentions error:', err);
    }
  };

  // When navigating to Mentions tab, fetch once and start polling; cleanup on leave
  useEffect(() => {
    if (selectedTab !== 'mentions') return;
    fetchMentions();
    const interval = setInterval(fetchMentions, 10000); // 10s polling
    return () => clearInterval(interval);
  }, [selectedTab]);

  // Prevent HR from accessing Requests tab
  useEffect(() => {
    if (isHR && selectedTab === 'requests') {
      setSelectedTab('overview');
    }
  }, [isHR, selectedTab]);

  // Helpers
  const formatDateTime = (dateStr, timeStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (timeStr) {
        const [hh = '00', mm = '00'] = String(timeStr).split(':');
        d.setHours(Number(hh) || 0, Number(mm) || 0, 0, 0);
      }
      return d.toLocaleString();
    } catch {
      return `${dateStr}${timeStr ? ` ${timeStr}` : ''}`;
    }
  };

  // Normalize lists from varying backend shapes
  const pickFirst = (obj, keys = []) => {
    for (const k of keys) {
      if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
    }
    return undefined;
  };

  const getApproverList = (leave) => {
    return pickFirst(leave, [
      // preferred structured arrays
      'toEmployees', 'approvers',
      // ids fields
      'to', 'toIds', 'to_ids', 'approverIds', 'approver_ids',
      // names fallback from backend
      'toEmployeeNames', 'to_names', 'toNames', 'approverNames', 'approver_names'
    ]);
  };

  const getCcList = (leave) => {
    return pickFirst(leave, [
      'ccEmployees',
      // ids fields
      'cc', 'ccIds', 'cc_ids',
      // names fallback from backend
      'ccEmployeeNames', 'cc_names', 'ccNames'
    ]);
  };

  // Helpers to determine if current user is in TO/CC
  const extractIdCandidates = (item) => {
    const out = [];
    if (!item) return out;
    if (typeof item === 'string' || typeof item === 'number') {
      out.push(item);
    } else if (typeof item === 'object') {
      const keys = ['id', 'employeeId', 'employee_id', 'userId', 'user_id', 'uuid', '_id'];
      for (const k of keys) if (item[k]) out.push(item[k]);
    }
    return out;
  };

  const normalizeListToIdStrings = (list) => {
    if (!list) return [];
    let arr = Array.isArray(list) ? list : [list];
    if (typeof list === 'string') {
      try { const p = JSON.parse(list); arr = Array.isArray(p) ? p : [list]; } catch { arr = list.split(',').map(s=>s.trim()).filter(Boolean); }
    }
    const ids = [];
    for (const it of arr) {
      const cands = extractIdCandidates(it);
      for (const c of cands) ids.push(String(c));
    }
    return ids;
  };

  // Derive current employee record from user identifiers to collect employee.id as well
  const findCurrentEmployee = () => {
    const ids = [user?.id, user?.employeeId, user?.userId, user?.user_id, user?.uuid, user?._id].filter(Boolean).map(String);
    return employees?.find(e => [e.id, e.employeeId, e.userId, e.user_id, e.uuid, e._id].some(v => v !== undefined && ids.includes(String(v))));
  };
  const currentEmp = findCurrentEmployee();
  const userIdSet = new Set([
    user?.id, user?.employeeId, user?.userId, user?.user_id, user?.uuid, user?._id,
    currentEmp?.id, currentEmp?.employeeId
  ].filter(Boolean).map(String));

  const isUserInTo = (leave) => {
    const list = getApproverList(leave);
    const ids = normalizeListToIdStrings(list);
    if (ids.some(id => userIdSet.has(String(id)))) return true;
    // Name and email fallback
    const names = resolveNames(list).map(n => String(n).toLowerCase());
    const userNames = [user?.name, user?.fullName, user?.displayName].filter(Boolean).map(s => String(s).toLowerCase());
    const emailLocal = user?.email && String(user.email).includes('@') ? String(user.email).split('@')[0].replace(/[._]/g,' ').toLowerCase() : null;
    if (emailLocal) userNames.push(emailLocal);
    return names.some(n => userNames.includes(n));
  };
  const isUserInCc = (leave) => {
    const list = getCcList(leave);
    const ids = normalizeListToIdStrings(list);
    if (ids.some(id => userIdSet.has(String(id)))) return true;
    // Name and email fallback
    const names = resolveNames(list).map(n => String(n).toLowerCase());
    const userNames = [user?.name, user?.fullName, user?.displayName].filter(Boolean).map(s => String(s).toLowerCase());
    const emailLocal = user?.email && String(user.email).includes('@') ? String(user.email).split('@')[0].replace(/[._]/g,' ').toLowerCase() : null;
    if (emailLocal) userNames.push(emailLocal);
    return names.some(n => userNames.includes(n));
  };

  // Resolve applicant name from various possible fields
  const getApplicantName = (req) => {
    if (!req) return '-';
    // direct name fields from backend
    const direct = req.applicantName || req.employeeName || req.name || req.appliedByName;
    if (direct) return direct;
    // try resolving by ID against employees context
    const candidates = [
      req.employeeId, req.employee_id, req.userId, req.user_id, req.applicantId, req.applicant_id, req.id
    ].filter(Boolean);
    for (const c of candidates) {
      const match = employees?.find(e => [e.id, e.employeeId, e.userId, e.user_id, e.uuid, e._id].some(v => v !== undefined && String(v) === String(c)));
      if (match?.name) return match.name;
    }
    return '-';
  };

  // Resolve leave type from multiple keys and normalize label
  const getLeaveType = (req) => {
    const t = req?.type || req?.leaveType || req?.leave_type || req?.category;
    if (!t) return '-';
    // Title-case and replace underscores
    const s = String(t).replace(/[_-]+/g, ' ').trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  // Resolve applied date and format with optional time
  const getAppliedDate = (req) => {
    const date = req?.appliedDate || req?.appliedOn || req?.createdAt || req?.created_at || req?.createdDate;
    const time = req?.appliedTime || req?.applied_time || undefined;
    return formatDateTime(date, time);
  };

  const resolveNames = (list) => {
    if (!list) return [];
    let arr = [];
    if (Array.isArray(list)) {
      arr = list;
    } else if (typeof list === 'string') {
      // Try JSON array string first, else comma-separated
      try {
        const parsed = JSON.parse(list);
        arr = Array.isArray(parsed) ? parsed : [list];
      } catch {
        arr = list.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else {
      arr = [list];
    }

    const uuidLike = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    const names = arr.map((item) => {
      // Already has a name
      if (item && typeof item === 'object') {
        const n = item.name || item.fullName || item.displayName || item.employeeName;
        if (n) return n;
      }

      // Collect possible IDs from object
      const candidates = [];
      if (item && typeof item === 'object') {
        const keys = ['id', 'employeeId', 'employee_id', 'userId', 'user_id'];
        for (const k of keys) {
          if (item[k]) candidates.push(item[k]);
        }
      } else if (typeof item === 'string' || typeof item === 'number') {
        candidates.push(item);
      }

      // Find matching employee by any candidate
      for (const c of candidates) {
        const match = employees.find((e) => {
          const eid = e?.id, empId = e?.employeeId, usrId = e?.userId || e?.user_id;
          const alt = e?.uuid || e?._id || e?.employeeUUID || e?.employee_uuid;
          return [eid, empId, usrId, alt].some(v => v !== undefined && String(v) === String(c));
        });
        if (match) return match.name;
      }
      // As a last resort, if it's a human-readable string (not UUID), keep it
      if (typeof item === 'string') {
        const s = item.trim();
        if (s && !uuidLike.test(s) && /[a-zA-Z]/.test(s)) return s;
      }
      // Fallback: object with email
      if (item && typeof item === 'object' && item.email) {
        const email = String(item.email);
        if (email.includes('@')) return email.split('@')[0].replace(/[._]/g, ' ');
        return email;
      }
      try { console.warn('LeaveManagement: unable to resolve name for item', item); } catch {}
      return null;
    }).filter(Boolean);

    return names;
  };

  // Export functionality
  const handleExportLeaves = () => {
    const csvContent = generateLeaveCSV();
    const filename = `leave_requests_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

  const generateLeaveCSV = () => {
    const headers = ['Employee', 'Type', 'Start Date', 'End Date', 'Duration', 'Status', 'Reason'];
    const rows = leaveRequests.map(request => [
      request.employee,
      request.type,
      request.startDate,
      request.endDate,
      request.duration,
      request.status,
      request.reason || 'N/A'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const [leaveForm, setLeaveForm] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    startTime: '09:30',
    endTime: '19:00',
    reason: '',
    toEmployees: [],
    ccEmployees: []
  });

  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!leaveForm.leaveType) {
      errors.leaveType = 'Please select a leave type';
    }
    
    if (!leaveForm.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!leaveForm.endDate) {
      errors.endDate = 'End date is required';
    }
    
    if (!leaveForm.reason || leaveForm.reason.trim() === '') {
      errors.reason = 'Please provide a reason for leave';
    }
    
    if (!leaveForm.toEmployees || leaveForm.toEmployees.length === 0) {
      errors.toEmployees = 'Please select at least one approver';
    }
    
    // Date validation
    if (leaveForm.startDate && leaveForm.endDate) {
      const startDate = new Date(leaveForm.startDate);
      const endDate = new Date(leaveForm.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        errors.startDate = 'Start date cannot be in the past';
      }
      
      if (endDate < startDate) {
        errors.endDate = 'End date cannot be before start date';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const leaveData = {
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        startTime: leaveForm.startTime || '09:00',
        endDate: leaveForm.endDate,
        endTime: leaveForm.endTime || '18:00',
        reason: leaveForm.reason,
        toEmployees: leaveForm.toEmployees.map(emp => emp.id),
        ccEmployees: leaveForm.ccEmployees.map(emp => emp.id)
      };

      await addLeaveRequest(leaveData);
      setShowApplyForm(false);
      resetForm();
      setFormErrors({});
    } catch (error) {
      console.error('Leave submission error:', error);
    }
  };

  const handleApprove = async (requestId, comments = '') => {
    try {
      await approveLeave(requestId, comments);
      notify({ type: 'success', message: 'Leave request approved successfully!' });
      if (selectedTab === 'mentions') {
        fetchMentions();
      }
    } catch (error) {
      notify({ type: 'error', message: 'Failed to approve leave request. Please try again.' });
      console.error('Leave approval error:', error);
    }
  };

  const handleReject = async (requestId, comments = '') => {
    try {
      await rejectLeave(requestId, comments);
      notify({ type: 'success', message: 'Leave request rejected successfully!' });
      if (selectedTab === 'mentions') {
        fetchMentions();
      }
    } catch (error) {
      notify({ type: 'error', message: 'Failed to reject leave request. Please try again.' });
      console.error('Leave rejection error:', error);
    }
  };

  const handleCancel = async (requestId, comments = '') => {
    try {
      await cancelLeave(requestId, comments);
      notify({ type: 'success', message: 'Leave request cancelled successfully.' });
      if (selectedTab === 'mentions') {
        fetchMentions();
      }
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to cancel leave request. It must be pending and owned by you.';
      notify({ type: 'error', message: String(msg) });
      console.error('Leave cancel error:', error);
    }
  };

  const leaveBalance = {
    annual: { total: 20, used: 8, remaining: 12 },
    sick: { total: 10, used: 2, remaining: 8 },
    personal: { total: 5, used: 1, remaining: 4 },
    maternity: { total: 90, used: 0, remaining: 90 }
  };

  const filteredLeaveRequests = user?.role === 'employee' 
    ? leaveRequests.filter(request => 
        request.employeeId === user.employeeId || 
        request.employeeId === user.id || 
        request.name === user.name
      )
    : leaveRequests;

  // Mentions: prefer backend API results; fallback to client-side filter
  const mentionedLeaveRequests = (Array.isArray(mentions) && mentions.length > 0)
    ? mentions
    : leaveRequests.filter((req) => isUserInTo(req) || isUserInCc(req));
  if (selectedTab === 'mentions') {
    try {
      console.debug('Mentions: userIdSet', Array.from(userIdSet));
      console.debug('Mentions: count', mentionedLeaveRequests.length);
      console.debug('Mentions: user name/email', user?.name, user?.email);
      // Debug first few leave requests
      leaveRequests.slice(0, 3).forEach((req, i) => {
        const ccList = getCcList(req);
        const ccNames = resolveNames(ccList);
        console.debug(`Leave ${i}: CC raw`, ccList, 'resolved', ccNames);
      });
    } catch {}
  }

  // Calculate real leave type data from actual leave requests
  const leaveTypeCounts = leaveRequests.reduce((acc, leave) => {
    const type = leave.type || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const leaveTypeData = [
    { name: 'Annual Leave', value: leaveTypeCounts['Annual Leave'] || 0, color: '#10b981' },
    { name: 'Sick Leave', value: leaveTypeCounts['Sick Leave'] || 0, color: '#ef4444' },
    { name: 'Personal Leave', value: leaveTypeCounts['Personal Leave'] || 0, color: '#f59e0b' },
    { name: 'Maternity Leave', value: leaveTypeCounts['Maternity Leave'] || 0, color: '#8b5cf6' },
    { name: 'Emergency Leave', value: leaveTypeCounts['Emergency Leave'] || 0, color: '#6366f1' }
  ].filter(item => item.value > 0);

  const monthlyLeaveData = [
    { month: 'Jan', approved: 12, pending: 3, rejected: 1 },
    { month: 'Feb', approved: 15, pending: 5, rejected: 2 },
    { month: 'Mar', approved: 18, pending: 2, rejected: 1 },
    { month: 'Apr', approved: 20, pending: 4, rejected: 3 },
    { month: 'May', approved: 25, pending: 6, rejected: 2 },
    { month: 'Jun', approved: 22, pending: 3, rejected: 1 }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm transition-all duration-200 ${
              n.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                : n.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
            }`}
          >
            <div className="mt-0.5">
              {n.type === 'success' ? <CheckCircle className="h-4 w-4" /> : n.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </div>
            <div className="flex-1">{n.message}</div>
            <button
              className="text-xs opacity-70 hover:opacity-100"
              onClick={() => setNotifications((prev) => prev.filter((x) => x.id !== n.id))}
            >
              Dismiss
            </button>
          </div>
        ))}
      </div>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage leave requests and policies</p>
        </div>
        {user?.role === 'employee' && (
          <Button onClick={() => setShowApplyForm(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Apply Leave</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-primary/10 p-1 rounded-lg border border-primary/20">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              selectedTab === tab
                ? 'bg-primary text-white shadow-md transform scale-105'
                : 'text-primary hover:text-primary/80 hover:bg-primary/20'
            }`}
          >
            {tab === 'mentions' ? 'Mentions' : (tab.charAt(0).toUpperCase() + tab.slice(1))}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Leave Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(leaveBalance).map(([type, balance]) => (
              <Card key={type}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                        {type} Leave
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {balance.remaining}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        of {balance.total} days
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Leave Types Distribution</CardTitle>
                <CardDescription>Breakdown of leave requests by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={leaveTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {leaveTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Leave Trends</CardTitle>
                <CardDescription>Leave requests over the past 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyLeaveData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="approved" fill="#10b981" name="Approved" />
                    <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                    <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Mentions Tab */}
      {selectedTab === 'mentions' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Mentions</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Leave requests where you are in TO or CC</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Employee</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Type</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Duration</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Applied</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mentionedLeaveRequests.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 px-6 text-center text-sm text-gray-500 dark:text-gray-400">No data</td>
                      </tr>
                    )}
                    {mentionedLeaveRequests.map((request) => {
                      const inTo = isUserInTo(request);
                      return (
                        <tr key={request.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{getApplicantName(request)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{getLeaveType(request)}</td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <div>{request.startDate} to {request.endDate}</div>
                              <div className="text-xs text-gray-500">{request.days} days</div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{getAppliedDate(request)}</td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              request.status === 'approved' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                : request.status === 'cancelled'
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            }`}>
                              {request.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              {inTo && request.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="success" onClick={() => handleApprove(request.id)}>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleReject(request.id)}>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedLeave(request);
                                  setShowDetailsModal(true);
                                }}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                View Details
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Requests Tab */}
      {selectedTab === 'requests' && !isHR && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search leave requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="flex items-center space-x-2" onClick={() => notify({ type: 'info', message: 'Filter functionality coming soon!' })}>
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2" onClick={handleExportLeaves}>
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Leave Requests Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Employee</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Type</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Duration</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Applied</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaveRequests.map((request) => (
                      <tr key={request.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{getApplicantName(request)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{getLeaveType(request)}</td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div>{request.startDate} to {request.endDate}</div>
                            <div className="text-xs text-gray-500">{request.days} days</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{getAppliedDate(request)}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === 'approved' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : request.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              : request.status === 'cancelled'
                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {request.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex space-x-2">
                            {user?.role !== 'employee' && request.status === 'pending' && (
                              <>
                                <Button size="sm" variant="success" onClick={() => handleApprove(request.id)}>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleReject(request.id)}>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {/* Cancel button for own pending leave requests */}
                            {isOwnLeave(request) && request.status === 'pending' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-orange-600 border-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-400 dark:hover:bg-orange-900/20"
                                onClick={() => handleCancel(request.id)}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedLeave(request);
                                setShowDetailsModal(true);
                              }}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Apply for Leave</h3>
            <div className="space-y-4">
              {/* Leave Type */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Leave Type</label>
                <select 
                  className={`w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-0 focus:border-2 ${
                    formErrors.leaveType 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                  }`}
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({...leaveForm, leaveType: e.target.value})}
                >
                  <option value="">Select a leave type...</option>
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="emergency">Emergency Leave</option>
                  <option value="other">Other</option>
                </select>
                {formErrors.leaveType && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.leaveType}</p>
                )}
              </div>

              {/* TO Field */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  To <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select 
                    className={`w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-0 focus:border-2 ${
                      formErrors.toEmployees 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                    }`}
                    onChange={(e) => {
                      const val = String(e.target.value);
                      const selectedEmployee = employees.find(emp => extractIdCandidates(emp).some(c => String(c) === val));
                      if (selectedEmployee && !leaveForm.toEmployees.find(emp => emp.id === selectedEmployee.id)) {
                        setLeaveForm({
                          ...leaveForm, 
                          toEmployees: [...leaveForm.toEmployees, selectedEmployee]
                        });
                        if (formErrors.toEmployees) {
                          setFormErrors({...formErrors, toEmployees: ''});
                        }
                      }
                    }}
                    value=""
                  >
                    <option value="">Select employee to notify...</option>
                    {employees.filter(emp => !isSelfEmployee(emp)).map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.designation}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Selected TO employees */}
                {leaveForm.toEmployees.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {leaveForm.toEmployees.map(employee => (
                      <span 
                        key={employee.id}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                      >
                        {employee.name}
                        <button
                          type="button"
                          onClick={() => setLeaveForm({
                            ...leaveForm,
                            toEmployees: leaveForm.toEmployees.filter(emp => emp.id !== employee.id)
                          })}
                          className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {formErrors.toEmployees && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.toEmployees}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Your Reporting Manager and Project Leads you are working with.
                </p>
              </div>

              {/* CC Field */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">CC</label>
                <div className="relative">
                  <select 
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-0 focus:border-2 focus:border-blue-500"
                    onChange={(e) => {
                      const val = String(e.target.value);
                      const selectedEmployee = employees.find(emp => extractIdCandidates(emp).some(c => String(c) === val));
                      if (selectedEmployee && 
                          !leaveForm.ccEmployees.find(emp => emp.id === selectedEmployee.id) &&
                          !leaveForm.toEmployees.find(emp => emp.id === selectedEmployee.id)) {
                        setLeaveForm({
                          ...leaveForm, 
                          ccEmployees: [...leaveForm.ccEmployees, selectedEmployee]
                        });
                      }
                    }}
                    value=""
                  >
                    <option value="">Select additional employees to notify...</option>
                    {employees.filter(emp => 
                      !isSelfEmployee(emp) && 
                      !leaveForm.toEmployees.find(to => to.id === emp.id) &&
                      !leaveForm.ccEmployees.find(cc => cc.id === emp.id)
                    ).map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.designation}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Selected CC employees */}
                {leaveForm.ccEmployees.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {leaveForm.ccEmployees.map(employee => (
                      <span 
                        key={employee.id}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {employee.name}
                        <button
                          type="button"
                          onClick={() => setLeaveForm({
                            ...leaveForm,
                            ccEmployees: leaveForm.ccEmployees.filter(emp => emp.id !== employee.id)
                          })}
                          className="ml-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Date and Time Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Start Date</label>
                    <Input 
                      type="date" 
                      value={leaveForm.startDate}
                      onChange={(e) => {
                        setLeaveForm({...leaveForm, startDate: e.target.value});
                        if (formErrors.startDate) {
                          setFormErrors({...formErrors, startDate: ''});
                        }
                      }}
                      className={`w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-0 focus:border-2 ${
                        formErrors.startDate 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                      }`}
                    />
                    {formErrors.startDate && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.startDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Start Time</label>
                    <Input 
                      type="time" 
                      value={leaveForm.startTime}
                      onChange={(e) => setLeaveForm({...leaveForm, startTime: e.target.value})}
                      className="!border-0 !outline-none bg-white dark:bg-gray-800 dark:text-white focus:ring-0 focus:!border-2 focus:!border-blue-500 focus:!outline-none"
                      style={{border: 'none', outline: 'none'}}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">End Date</label>
                    <Input 
                      type="date" 
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                      className="!border-0 !outline-none bg-white dark:bg-gray-800 dark:text-white focus:ring-0 focus:!border-2 focus:!border-blue-500 focus:!outline-none"
                      style={{border: 'none', outline: 'none'}}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">End Time</label>
                    <Input 
                      type="time" 
                      value={leaveForm.endTime}
                      onChange={(e) => setLeaveForm({...leaveForm, endTime: e.target.value})}
                      className="!border-0 !outline-none bg-white dark:bg-gray-800 dark:text-white focus:ring-0 focus:!border-2 focus:!border-blue-500 focus:!outline-none"
                      style={{border: 'none', outline: 'none'}}
                    />
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Reason</label>
                <textarea
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-0 focus:border-2 focus:border-blue-500 resize-none"
                  rows="3"
                  placeholder="Please provide a reason for your leave..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                ></textarea>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowApplyForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Details Modal */}
      {showDetailsModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto mx-0 sm:mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Leave Request Details</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedLeave(null);
                }}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee</label>
                  <p className="text-gray-900 dark:text-white">{selectedLeave.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Leave Type</label>
                  <p className="text-gray-900 dark:text-white">{selectedLeave.type}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Start</label>
                  <p className="text-gray-900 dark:text-white">
                    {formatDateTime(selectedLeave.startDate, selectedLeave.startTime)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">End</label>
                  <p className="text-gray-900 dark:text-white">
                    {formatDateTime(selectedLeave.endDate, selectedLeave.endTime)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Duration</label>
                  <p className="text-gray-900 dark:text-white">{selectedLeave.days} days</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedLeave.status === 'approved' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : selectedLeave.status === 'rejected'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      : selectedLeave.status === 'cancelled'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {selectedLeave.status?.toUpperCase?.() || selectedLeave.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Applied On</label>
                  <p className="text-gray-900 dark:text-white">
                    {formatDateTime(selectedLeave.createdAt || selectedLeave.appliedDate)}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">To (Approvers)</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {resolveNames(getApproverList(selectedLeave))?.length > 0 ? (
                    resolveNames(getApproverList(selectedLeave)).map((name, idx) => (
                      <span key={`to-${idx}`} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">CC</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {resolveNames(getCcList(selectedLeave))?.length > 0 ? (
                    resolveNames(getCcList(selectedLeave)).map((name, idx) => (
                      <span key={`cc-${idx}`} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Reason</label>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {selectedLeave.reason}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button 
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedLeave(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
