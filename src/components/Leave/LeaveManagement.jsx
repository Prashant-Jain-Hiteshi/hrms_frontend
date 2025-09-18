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
import { AttendanceAPI } from '../../lib/api';
import { CalendarAPI } from '../../lib/api';
import { compensatoryLeaveAPI } from '../../lib/compensatoryLeaveApi';
import LeaveTypes from './LeaveTypes';
import LeaveTypesChart from './LeaveTypesChart';

const LeaveManagement = () => {
  const { user } = useAuth();
  const { leaveRequests, addLeaveRequest, approveLeave, rejectLeave, cancelLeave, employees, leaveTypes, fetchLeaveBalance, myAttendance, monthlyCreditTotal, monthlyCreditAnnual } = useData();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [mentions, setMentions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Calendar tab state (Admin)
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [weekends, setWeekends] = useState([]); // [0..6]
  const [holidays, setHolidays] = useState([]); // list of { id, date, name, type }
  const [workingDays, setWorkingDays] = useState(null);
  const [savingWeekend, setSavingWeekend] = useState(false);
  const [savingHoliday, setSavingHoliday] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '', type: 'public' });
  const [editingHolidayId, setEditingHolidayId] = useState(null);
  const [editHoliday, setEditHoliday] = useState({ date: '', name: '', type: 'public' });
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Compensatory Leave state (HR only)
  const [compensatoryLeaves, setCompensatoryLeaves] = useState([]);
  const [compensatorySummary, setCompensatorySummary] = useState({
    totalActiveCredits: 0,
    totalEmployees: 0,
    expiringSoon: 0,
    totalExpired: 0,
    totalUsed: 0
  });
  const [loadingCompensatory, setLoadingCompensatory] = useState(false);
  const [showCompensatoryForm, setShowCompensatoryForm] = useState(false);
  const [editingCompensatory, setEditingCompensatory] = useState(null);
  const [compensatoryForm, setCompensatoryForm] = useState({
    employeeId: '',
    credits: '',
    reason: '',
    expiryDate: ''
  });

  // Role and tabs
  const role = String(user?.role || '').toLowerCase();
  const isHR = role === 'hr';
  const isAdmin = role === 'admin';
  const tabs = (() => {
    if (isHR) return ['overview', 'mentions', 'compensatory', 'policies'];
    if (role === 'employee') return ['overview', 'requests', 'mentions', 'leavebalance', 'policies'];
    // Admin and other roles: no Leave Balance
    return ['overview', 'requests', 'mentions', 'policies', 'calendar'];
  })();

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

  // Compensatory Leave CRUD functions
  const handleCompensatorySubmit = async (e) => {
    e.preventDefault();
    setLoadingCompensatory(true);
    
    try {
      const selectedEmployee = employees.find(emp => emp.id === parseInt(compensatoryForm.employeeId));
      
      if (editingCompensatory) {
        // Update existing compensatory leave
        const updateData = {
          credits: parseFloat(compensatoryForm.credits),
          reason: compensatoryForm.reason,
          expiryDate: compensatoryForm.expiryDate
        };
        
        await compensatoryLeaveAPI.update(editingCompensatory.id, updateData);
      } else {
        // Add new compensatory leave
        const createData = {
          employeeId: selectedEmployee?.id || compensatoryForm.employeeId,
          credits: parseFloat(compensatoryForm.credits),
          reason: compensatoryForm.reason,
          expiryDate: compensatoryForm.expiryDate
        };
        
        await compensatoryLeaveAPI.create(createData);
      }
      
      // Refresh data
      await fetchCompensatoryData();
      
      // Reset form
      setCompensatoryForm({ employeeId: '', credits: '', reason: '', expiryDate: '' });
      setShowCompensatoryForm(false);
      setEditingCompensatory(null);
    } catch (error) {
      console.error('Error saving compensatory leave:', error);
      alert('Error saving compensatory leave. Please try again.');
    } finally {
      setLoadingCompensatory(false);
    }
  };

  const handleEditCompensatory = (comp) => {
    const employee = employees.find(emp => emp.employeeId === comp.employeeId);
    setCompensatoryForm({
      employeeId: employee?.id?.toString() || '',
      credits: comp.credits.toString(),
      reason: comp.reason,
      expiryDate: comp.expiryDate
    });
    setEditingCompensatory(comp);
    setShowCompensatoryForm(true);
  };

  const handleDeleteCompensatory = async (id) => {
    if (window.confirm('Are you sure you want to delete this compensatory leave?')) {
      setLoadingCompensatory(true);
      try {
        await compensatoryLeaveAPI.delete(id);
        await fetchCompensatoryData();
        notify({ type: 'success', message: 'Compensatory leave deleted successfully' });
      } catch (error) {
        console.error('Error deleting compensatory leave:', error);
        notify({ type: 'error', message: 'Error deleting compensatory leave. Please try again.' });
      } finally {
        setLoadingCompensatory(false);
      }
    }
  };

  const resetCompensatoryForm = () => {
    setCompensatoryForm({ employeeId: '', credits: '', reason: '', expiryDate: '' });
    setEditingCompensatory(null);
    setShowCompensatoryForm(false);
  };

  // Build calendar days for selected month
  const getCalendarDays = (ym) => {
    // ym: yyyy-mm
    const [y, m] = ym.split('-').map((v) => parseInt(v, 10));
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0); // last day of month
    const startWeekday = first.getDay(); // 0..6
    const totalDays = last.getDate();

    // previous month padding
    const prevLast = new Date(y, m - 1, 0);
    const prevDays = prevLast.getDate();
    const leading = Array.from({ length: startWeekday }, (_, i) => {
      const d = prevDays - startWeekday + 1 + i;
      const dt = new Date(y, m - 2, d);
      return { iso: dt.toISOString().slice(0, 10), day: d, inMonth: false, weekday: dt.getDay() };
    });

    // current month
    const current = Array.from({ length: totalDays }, (_, i) => {
      const d = i + 1;
      const dt = new Date(y, m - 1, d);
      return { iso: dt.toISOString().slice(0, 10), day: d, inMonth: true, weekday: dt.getDay() };
    });

    // trailing padding to fill 6 weeks grid
    const cellsSoFar = leading.length + current.length;
    const totalCells = Math.ceil(cellsSoFar / 7) * 7; // 5 or 6 rows
    const trailingCount = totalCells - cellsSoFar;
    const trailing = Array.from({ length: trailingCount }, (_, i) => {
      const d = i + 1;
      const dt = new Date(y, m, d);
      return { iso: dt.toISOString().slice(0, 10), day: d, inMonth: false, weekday: dt.getDay() };
    });

    return [...leading, ...current, ...trailing];
  };

  // Calendar data fetchers
  const fetchWeekends = async () => {
    try {
      const { data } = await CalendarAPI.weekends.get();
      setWeekends(Array.isArray(data?.weekends) ? data.weekends : []);
    } catch (e) {
      notify({ type: 'error', message: 'Failed to load weekend settings' });
    }
  };

  const fetchHolidays = async () => {
    try {
      const { data } = await CalendarAPI.holidays.list({ month: calMonth });
      setHolidays(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []));
    } catch (e) {
      notify({ type: 'error', message: 'Failed to load holidays' });
    }
  };

  const fetchWorking = async () => {
    try {
      const { data } = await CalendarAPI.workingDays.monthly({ month: calMonth });
      setWorkingDays(typeof data?.workingDays === 'number' ? data.workingDays : null);
    } catch (e) {
      setWorkingDays(null);
    }
  };

  useEffect(() => {
    if (selectedTab === 'calendar' && isAdmin) {
      fetchWeekends();
      fetchHolidays();
      fetchWorking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, calMonth, isAdmin]);

  const toggleWeekend = (d) => {
    setWeekends((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a,b)=>a-b));
  };

  const saveWeekends = async () => {
    setSavingWeekend(true);
    try {
      await CalendarAPI.weekends.update({ weekends });
      notify({ type: 'success', message: 'Weekend settings saved' });
      fetchWorking();
    } catch {
      notify({ type: 'error', message: 'Failed to save weekends' });
    } finally {
      setSavingWeekend(false);
    }
  };

  const addHoliday = async (e) => {
    e?.preventDefault?.();
    if (!newHoliday.date || !newHoliday.name) {
      notify({ type: 'warning', message: 'Holiday date and name are required' });
      return;
    }
    setSavingHoliday(true);
    try {
      await CalendarAPI.holidays.create({ ...newHoliday });
      setNewHoliday({ date: '', name: '', type: 'public' });
      notify({ type: 'success', message: 'Holiday added' });
      fetchHolidays();
      fetchWorking();
    } catch {
      notify({ type: 'error', message: 'Failed to add holiday' });
    } finally {
      setSavingHoliday(false);
    }
  };

  const deleteHoliday = async (id) => {
    try {
      await CalendarAPI.holidays.remove(id);
      notify({ type: 'success', message: 'Holiday removed' });
      fetchHolidays();
      fetchWorking();
    } catch {
      notify({ type: 'error', message: 'Failed to remove holiday' });
    }
  };

  const beginEditHoliday = (h) => {
    setEditingHolidayId(h.id);
    setEditHoliday({ date: h.date, name: h.name, type: h.type || 'public' });
  };

  const cancelEditHoliday = () => {
    setEditingHolidayId(null);
  };

  const saveEditHoliday = async (id) => {
    if (!editHoliday.date || !editHoliday.name) {
      notify({ type: 'warning', message: 'Holiday date and name are required' });
      return;
    }
    try {
      await CalendarAPI.holidays.update(id, { ...editHoliday });
      notify({ type: 'success', message: 'Holiday updated' });
      setEditingHolidayId(null);
      fetchHolidays();
      fetchWorking();
    } catch {
      notify({ type: 'error', message: 'Failed to update holiday' });
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

  // When navigating to Mentions tab, fetch once (standard behavior)
  useEffect(() => {
    if (selectedTab !== 'mentions') return;
    fetchMentions();
    // No polling interval - just fetch once when tab is clicked
  }, [selectedTab]);

  // Prevent HR from accessing Requests tab
  useEffect(() => {
    if (isHR && selectedTab === 'requests') {
      setSelectedTab('overview');
    }
  }, [isHR, selectedTab]);

  // Prevent non-employees (HR/Admin) from accessing Leave Balance tab
  useEffect(() => {
    if (selectedTab === 'leavebalance' && role !== 'employee') {
      setSelectedTab('overview');
    }
  }, [selectedTab, role]);

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

  // Compute total applied days (inclusive) from start/end; fallback to request.days if present
  const getAppliedDays = (req) => {
    const fallback = Number(req?.days);
    if (!Number.isNaN(fallback) && fallback > 0) return fallback;
    const s = req?.startDate || req?.start_date;
    const e = req?.endDate || req?.end_date || s;
    if (!s) return 0;
    try {
      const sd = new Date(s);
      const ed = new Date(e);
      // Zero-out times to avoid DST/timezone drift
      sd.setHours(0,0,0,0);
      ed.setHours(0,0,0,0);
      const diff = Math.round((ed - sd) / (24 * 60 * 60 * 1000));
      return (diff >= 0 ? diff + 1 : 1);
    } catch {
      return fallback || 0;
    }
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
  // Export ledger (Leave Balance) CSV
  const generateLedgerCSV = (rows) => {
    const headers = [
      'Month', 'Opening', 'Monthly Credit', 'Extra Credit', 'Deducted', 'LWP', 'Closing',
      'Present', 'Absent', 'Effective Present', 'Effective Absent', 'Paid Days'
    ];
    const dataRows = rows.map(r => [
      r.label, r.opening, r.monthlyCredit, r.extraCredit, r.deducted, r.lwp, r.closing,
      r.present, r.absent, r.effPresent, r.effAbsent, r.paidDays
    ]);
    return [headers, ...dataRows].map(row => row.join(',')).join('\n');
  };
  const handleExportLedger = () => {
    const csvContent = generateLedgerCSV(ledgerRows);
    const filename = `leave_balance_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
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

  // State for leave balance from backend
  const [leaveBalance, setLeaveBalance] = useState({
    annual: { total: 20, used: 8, remaining: 12 },
    sick: { total: 10, used: 2, remaining: 8 },
    personal: { total: 5, used: 1, remaining: 4 },
    maternity: { total: 90, used: 0, remaining: 90 }
  });

  // Fetch leave balance from backend
  useEffect(() => {
    const loadLeaveBalance = async () => {
      try {
        const balance = await fetchLeaveBalance();
        if (balance && Object.keys(balance).length > 0) {
          setLeaveBalance(balance);
        }
      } catch (error) {
        console.error('Failed to load leave balance:', error);
      }
    };

    if (user?.employeeId) {
      loadLeaveBalance();
    }
  }, [user?.employeeId, fetchLeaveBalance]);

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

  // =====================
  // Leave Balance (Ledger)
  // =====================
  const [ledgerRange, setLedgerRange] = useState({
    from: (() => { const d = new Date(); d.setMonth(0, 1); return d.toISOString().slice(0,10); })(), // Jan 1 current year
    to: (() => { const d = new Date(); const last = new Date(d.getFullYear(), 11, 31); return last.toISOString().slice(0,10); })(), // Dec 31 current year
  });

  const [extraCreditsByMonth, setExtraCreditsByMonth] = useState({}); // { '2025-03': 0.5, ... }

  // Backend monthly ledger (deducted and LWP per month)
  const [backendLedger, setBackendLedger] = useState({}); // { 'yyyy-mm': { deducted, lwp } }
  const [backendLedgerLoading, setBackendLedgerLoading] = useState(false);
  // Attendance for ledger range (backend)
  const [backendAttendance, setBackendAttendance] = useState([]);
  const [backendAttendanceLoading, setBackendAttendanceLoading] = useState(false);

  // Fetch backend attendance for the selected ledger range
  useEffect(() => {
    if (selectedTab !== 'leavebalance') return;
    const loadAttendance = async () => {
      try {
        setBackendAttendanceLoading(true);
        const params = { from: ledgerRange.from, to: ledgerRange.to };
        const res = await AttendanceAPI.my(params);
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.rows) ? res.data.rows : [];
        setBackendAttendance(rows);
      } catch (e) {
        setBackendAttendance([]);
      } finally {
        setBackendAttendanceLoading(false);
      }
    };
    loadAttendance();
  }, [selectedTab, ledgerRange.from, ledgerRange.to]);

  // Helper: yyyy-mm key
  const ymKey = (dateStr) => {
    try { const d = new Date(dateStr); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; } catch { return String(dateStr).slice(0,7); }
  };

  const getMonthsInRange = (from, to) => {
    // Normalize to first of month at 00:00 local to avoid timezone drift
    const startSrc = new Date(from);
    const endSrc = new Date(to);
    const start = new Date(startSrc.getFullYear(), startSrc.getMonth(), 1, 0, 0, 0, 0);
    const endInput = new Date(endSrc.getFullYear(), endSrc.getMonth(), 1, 0, 0, 0, 0);
    // Cap to current month (exclude future months)
    const now = new Date();
    const endCap = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = endInput > endCap ? endCap : endInput;
    const out = [];
    let d = new Date(start);
    while (d.getTime() <= end.getTime()) {
      out.push({
        ym: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
        label: d.toLocaleString(undefined, { month: 'short', year: 'numeric' })
      });
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
    }
    return out;
  };

  // Fetch backend monthly ledger when on Leave Balance tab or date changes
  // Fetch compensatory leave data when HR/Admin accesses compensatory tab
  useEffect(() => {
    if (selectedTab === 'compensatory' && (isHR || isAdmin)) {
      fetchCompensatoryData();
    }
  }, [selectedTab, isHR, isAdmin]);

  // Fetch compensatory leave data
  const fetchCompensatoryData = async () => {
    setLoadingCompensatory(true);
    try {
      const [summaryData, leaveData] = await Promise.all([
        compensatoryLeaveAPI.getSummary(),
        compensatoryLeaveAPI.getAll()
      ]);
      
      setCompensatorySummary(summaryData);
      setCompensatoryLeaves(leaveData);
    } catch (error) {
      console.error('Error fetching compensatory leave data:', error);
      // Fallback to empty data on error
      setCompensatorySummary({
        totalActiveCredits: 0,
        totalEmployees: 0,
        expiringSoon: 0,
        totalExpired: 0,
        totalUsed: 0
      });
      setCompensatoryLeaves([]);
    } finally {
      setLoadingCompensatory(false);
    }
  };

  useEffect(() => {
    if (selectedTab !== 'leavebalance') return;
    const load = async () => {
      try {
        setBackendLedgerLoading(true);
        const res = await LeaveAPI.monthlyLedger({ from: ledgerRange.from, to: ledgerRange.to });
        const data = Array.isArray(res?.data) ? res.data : [];
        const map = {};
        for (const it of data) {
          const keyRaw = it?.ym || it?.month || it?.monthKey || it?.key || it?.date;
          const key = typeof keyRaw === 'string' ? keyRaw.slice(0,7) : undefined;
          if (!key) continue;
          const deducted = Number(it?.deducted ?? it?.paid ?? it?.paidDays ?? 0);
          const lwp = Number(it?.lwp ?? it?.unpaid ?? it?.unpaidDays ?? 0);
          const extraCredit = Number(it?.extraCredit ?? 0);
          const extraCreditBreakdown = it?.extraCreditBreakdown || '';
          map[key] = {
            deducted: Number.isFinite(deducted) ? Number(deducted.toFixed(2)) : 0,
            lwp: Number.isFinite(lwp) ? Number(lwp.toFixed(2)) : 0,
            extraCredit: Number.isFinite(extraCredit) ? Number(extraCredit.toFixed(2)) : 0,
            extraCreditBreakdown: extraCreditBreakdown,
          };
        }
        setBackendLedger(map);
      } catch (e) {
        setBackendLedger({});
      } finally {
        setBackendLedgerLoading(false);
      }
    };
    load();
  }, [selectedTab, ledgerRange.from, ledgerRange.to]);

  // Approx monthly credit: sum of configured monthly accruals if available in leaveTypes.numberOfLeaves / 12
  const estimateMonthlyCredit = () => {
    try {
      if (Array.isArray(leaveTypes) && leaveTypes.length > 0) {
        const annualTotals = leaveTypes
          .filter(t => typeof t.numberOfLeaves === 'number')
          .reduce((sum, t) => sum + Number(t.numberOfLeaves || 0), 0);
        const m = annualTotals / 12;
        return Number.isFinite(m) ? Number(m.toFixed(2)) : 0;
      }
      // Fallback: assume 1.5 per month (e.g., 18/year)
      return 1.5;
    } catch { return 0; }
  };

  const getApprovedLeavesByMonth = () => {
    const map = {};
    for (const req of leaveRequests) {
      if (!req || String(req.status).toLowerCase() !== 'approved') continue;
      // Exclude Leave Without Pay from 'deducted' so it represents paid leaves only
      const t = String(req.type || req.leaveType || req.leave_type || '').toLowerCase();
      if (t === 'lwp' || t === 'leave without pay' || t === 'leavewithoutpay') continue;
      
      // Support half-day leaves
      let days = Number(req.days) || getAppliedDays(req) || 0;
      const isHalfDay = req.isHalfDay || req.half_day || String(req.duration || '').toLowerCase().includes('half');
      if (isHalfDay && days === 1) days = 0.5;
      
      const key = ymKey(req.startDate || req.createdAt || req.created_at || new Date());
      map[key] = (map[key] || 0) + days;
    }
    return map; // paid leaves only (deducted)
  };

  const getLwpByMonth = () => {
    const map = {};
    for (const req of leaveRequests) {
      if (!req || String(req.status).toLowerCase() !== 'approved') continue;
      const t = String(req.type || req.leaveType || req.leave_type || '').toLowerCase();
      if (t !== 'lwp' && t !== 'leave without pay' && t !== 'leavewithoutpay') continue;
      
      // Support half-day LWP
      let days = Number(req.days) || getAppliedDays(req) || 0;
      const isHalfDay = req.isHalfDay || req.half_day || String(req.duration || '').toLowerCase().includes('half');
      if (isHalfDay && days === 1) days = 0.5;
      
      const key = ymKey(req.startDate || req.createdAt || req.created_at || new Date());
      map[key] = (map[key] || 0) + days;
    }
    return map;
  };

  const getAttendanceCountsByMonth = () => {
    const map = {};
    for (const rec of backendAttendance || []) {
      const key = ymKey(rec.date);
      const status = String(rec.status || '').toLowerCase();
      if (!map[key]) map[key] = { present: 0, absent: 0 };
      
      // Handle half-day attendance
      const isHalfDay = status.includes('half') || rec.isHalfDay || rec.half_day;
      const presentValue = isHalfDay ? 0.5 : 1;
      
      // Treat 'late' as present for Leave Balance display
      if (status === 'present' || status === 'late' || status === 'half day present' || status === 'half-day present') {
        map[key].present += presentValue;
      } else if (status === 'absent' || status === 'half day absent' || status === 'half-day absent') {
        map[key].absent += isHalfDay ? 0.5 : 1;
      }
    }
    return map;
  };

  // Get compensatory credits by month for current user
  const getCompensatoryCreditsByMonth = () => {
    const creditsByMonth = {};
    if (!user?.employeeId) return creditsByMonth;
    
    compensatoryLeaves
      .filter(comp => comp.employeeId === user.employeeId && comp.status === 'active')
      .forEach(comp => {
        const assignedDate = new Date(comp.assignedDate);
        const ym = `${assignedDate.getFullYear()}-${String(assignedDate.getMonth() + 1).padStart(2, '0')}`;
        creditsByMonth[ym] = (creditsByMonth[ym] || 0) + comp.credits;
      });
    
    return creditsByMonth;
  };

  const buildLedger = () => {
    const months = getMonthsInRange(ledgerRange.from, ledgerRange.to);
    const now = new Date();
    const currentYm = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const defaultMonthlyCredit = (
      Number(monthlyCreditAnnual) > 0
        ? Number(monthlyCreditAnnual)
        : (Number(monthlyCreditTotal) > 0 ? Number(monthlyCreditTotal) : estimateMonthlyCredit())
    );
    const deductedMap = getApprovedLeavesByMonth();
    const lwpMap = getLwpByMonth();
    const attMap = getAttendanceCountsByMonth();
    const compensatoryMap = getCompensatoryCreditsByMonth();

    // Opening from zero and accumulate; if backend provides opening, we can replace
    let opening = 0;
    const rows = months.map(({ ym, label }) => {
      const be = backendLedger[ym] || {};
      // Combine extra credits and compensatory credits into one "Extra Credit" column
      const extraFromLocal = Number(extraCreditsByMonth[ym] || 0);
      const extraFromBackend = Number(be.extraCredit || 0);
      const compensatoryFromLocal = Number(compensatoryMap[ym] || 0);
      
      // Use backend data if available, otherwise fall back to local calculation
      const totalExtraCredit = extraFromBackend || (extraFromLocal + compensatoryFromLocal);
      
      // IMPORTANT: Only apply monthly credit if backend returned this month
      // This respects the employee joining date logic from backend
      const hasBackendData = Object.keys(backendLedger).length > 0;
      const monthlyCredit = hasBackendData && !backendLedger[ym] ? 0 : defaultMonthlyCredit;
      
      const credit = monthlyCredit + totalExtraCredit;
      const totalAvailable = opening + credit;
      
      // Get raw leave days (all approved leaves for this month)
      const rawDeducted = Number(
        (be.deducted !== undefined ? be.deducted : (deductedMap[ym] || 0))
      );
      const rawLwp = Number(
        (be.lwp !== undefined ? be.lwp : (lwpMap[ym] || 0))
      );
      const totalLeaves = rawDeducted + rawLwp;
      
      // Apply balance overflow logic: if total leaves > available balance, excess becomes LWP
      let deducted, lwp;
      if (totalLeaves <= totalAvailable) {
        // Sufficient balance - all leaves are paid
        deducted = totalLeaves;
        lwp = 0;
      } else {
        // Insufficient balance - split between paid and LWP
        deducted = Math.max(0, totalAvailable);
        lwp = totalLeaves - deducted;
      }
      
      // Closing balance cannot go negative - minimum is 0
      const closing = Math.max(0, Number((opening + credit - deducted).toFixed(2)));
      const present = Number(attMap[ym]?.present || 0);
      const absent = Number(attMap[ym]?.absent || 0);
      const effPresent = present;
      const effAbsent = absent;
      const paidDays = Number((present + deducted).toFixed(2)); // present days + paid leaves only

      // For the current month, show only actual activity and leave accrual/closing blank
      const isCurrent = ym === currentYm;
      const row = {
        ym, label,
        opening: Number(opening.toFixed(2)),
        monthlyCredit: isCurrent ? '-' : Number(monthlyCredit.toFixed(2)),
        extraCredit: isCurrent ? '-' : Number(totalExtraCredit.toFixed(2)),
        deducted: Number(deducted.toFixed(2)),
        lwp: Number(lwp.toFixed(2)),
        closing: isCurrent ? '-' : closing,
        present, absent, effPresent, effAbsent, paidDays,
      };
      // Carry opening forward using numeric closing; for current month, still advance opening numerically for downstream, but keep display blank
      opening = closing;
      return row;
    });
    return rows;
  };

  const ledgerRows = buildLedger();

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

      {/* (Leave Balance moved below with other tabs) */}
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
            {tab === 'mentions' ? 'Mentions' : 
             tab === 'compensatory' ? 'Compensatory Leave' : 
             (tab.charAt(0).toUpperCase() + tab.slice(1))}
          </button>
        ))}
      </div>

      {/* Leave Balance Tab (Employee only) */}
      {selectedTab === 'leavebalance' && role === 'employee' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Balance</CardTitle>
              <CardDescription>Monthly ledger for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From</label>
                  <Input
                    type="date"
                    value={ledgerRange.from}
                    onChange={(e) => setLedgerRange(r => ({ ...r, from: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
                  <Input
                    type="date"
                    value={ledgerRange.to}
                    onChange={(e) => setLedgerRange(r => ({ ...r, to: e.target.value }))}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const d = new Date();
                      const from = new Date(d.getFullYear(), 0, 1).toISOString().slice(0,10);
                      const to = new Date(d.getFullYear(), 11, 31).toISOString().slice(0,10);
                      setLedgerRange({ from, to });
                    }}
                  >Current Year</Button>
                  <Button variant="outline" onClick={handleExportLedger}>Export</Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-3 px-4">Month</th>
                      <th className="text-left py-3 px-4">Opening</th>
                      <th className="text-left py-3 px-4">Monthly Credit</th>
                      <th className="text-left py-3 px-4">Extra Credit</th>
                      <th className="text-left py-3 px-4">Deducted</th>
                      <th className="text-left py-3 px-4">LWP</th>
                      <th className="text-left py-3 px-4">Closing</th>
                      <th className="text-left py-3 px-4">Present</th>
                      <th className="text-left py-3 px-4">Absent</th>
                      <th className="text-left py-3 px-4">Effective Present</th>
                      <th className="text-left py-3 px-4">Effective Absent</th>
                      <th className="text-left py-3 px-4">Paid Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerRows.length === 0 && (
                      <tr>
                        <td colSpan={11} className="py-8 px-4 text-center text-gray-500">No data</td>
                      </tr>
                    )}
                    {ledgerRows.map((row) => (
                      <tr key={row.ym} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4 whitespace-nowrap">{row.label}</td>
                        <td className="py-3 px-4">{row.opening}</td>
                        <td className="py-3 px-4">{row.monthlyCredit}</td>
                        <td className="py-3 px-4">
                          <span className={row.extraCredit > 0 ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                            {row.extraCredit}
                          </span>
                        </td>
                        <td className="py-3 px-4">{row.deducted}</td>
                        <td className="py-3 px-4">{row.lwp}</td>
                        <td className="py-3 px-4 font-medium">{row.closing}</td>
                        <td className="py-3 px-4">{row.present}</td>
                        <td className="py-3 px-4">{row.absent}</td>
                        <td className="py-3 px-4">{row.effPresent}</td>
                        <td className="py-3 px-4">{row.effAbsent}</td>
                        <td className="py-3 px-4">{row.paidDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendar Tab (Admin only) */}
      {selectedTab === 'calendar' && isAdmin && (
        <div className="space-y-6">
          {/* Month selector and working days */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Month</label>
              <input
                type="month"
                value={calMonth}
                onChange={(e) => setCalMonth(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
            <div className="ml-auto">
              <div className="text-sm text-gray-600">Effective Working Days</div>
              <div className="text-2xl font-semibold">{workingDays ?? '-'}</div>
            </div>
          </div>

          {/* Calendar open button and modal */}
          <div className="flex items-center justify-between">
            <div className="font-semibold">Monthly Calendar</div>
            <button
              onClick={() => setShowCalendarModal(true)}
              className="px-4 py-2 bg-primary text-white rounded"
            >
              Open Calendar
            </button>
          </div>

          {showCalendarModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowCalendarModal(false)}></div>
              <div className="relative z-10 w-full max-w-5xl bg-white rounded-lg shadow-xl border p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold">Monthly Calendar</div>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/20 border border-primary/40"></span> Weekend</span>
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300"></span> Holiday</span>
                    <button onClick={() => setShowCalendarModal(false)} className="ml-4 px-3 py-1 rounded bg-gray-200">Close</button>
                  </div>
                </div>
                {(() => {
                  const days = getCalendarDays(calMonth);
                  const holidayMap = holidays.reduce((acc, h) => { acc[h.date] = h; return acc; }, {});
                  return (
                    <div className="grid grid-cols-7 gap-2">
                      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((w) => (
                        <div key={w} className="text-center text-xs font-semibold text-gray-600 py-1">{w}</div>
                      ))}
                      {days.map((d, idx) => {
                        const isWeekend = weekends.includes(d.weekday);
                        const hol = holidayMap[d.iso];
                        const base = d.inMonth ? 'bg-white' : 'bg-gray-50';
                        const weekendBg = isWeekend ? 'bg-primary/10 border-primary/30' : 'border-gray-200';
                        const holidayBg = hol ? 'bg-green-50 border-green-300' : '';
                        const classes = `relative min-h-[80px] sm:min-h-[90px] rounded-md border p-2 ${base} ${holidayBg || weekendBg}`;
                        return (
                          <div key={idx} className={classes}>
                            <div className={`text-xs ${d.inMonth ? 'text-gray-800' : 'text-gray-400'}`}>{d.day}</div>
                            {hol && (
                              <div className="mt-1">
                                <div className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 border border-green-300">
                                  {hol.name}
                                </div>
                                <div className="text-[10px] text-green-700 mt-0.5 capitalize">{hol.type || 'public'}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Weekend configuration */}
          <div className="p-4 border rounded-lg">
            <div className="font-semibold mb-3">Weekend Configuration</div>
            <div className="flex flex-wrap gap-3">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((lbl, idx) => (
                <label key={idx} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={weekends.includes(idx)}
                    onChange={() => toggleWeekend(idx)}
                  />
                  <span>{lbl}</span>
                </label>
              ))}
            </div>
            <button
              onClick={saveWeekends}
              disabled={savingWeekend}
              className="mt-3 px-4 py-2 bg-primary text-white rounded disabled:opacity-60"
            >
              {savingWeekend ? 'Saving...' : 'Save Weekends'}
            </button>
          </div>

          {/* Holidays CRUD */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="font-semibold">Holidays</div>
            <form onSubmit={addHoliday} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday((h) => ({ ...h, date: e.target.value }))}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Holiday name"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday((h) => ({ ...h, name: e.target.value }))}
                className="border rounded px-3 py-2"
              />
              <select
                value={newHoliday.type}
                onChange={(e) => setNewHoliday((h) => ({ ...h, type: e.target.value }))}
                className="border rounded px-3 py-2"
              >
                <option value="public">Public</option>
                <option value="restricted">Restricted</option>
                <option value="optional">Optional</option>
              </select>
              <button
                type="submit"
                disabled={savingHoliday}
                className="px-4 py-2 bg-primary text-white rounded disabled:opacity-60"
              >
                {savingHoliday ? 'Adding...' : 'Add Holiday'}
              </button>
            </form>

            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-3 text-gray-500">No holidays for this month</td>
                    </tr>
                  )}
                  {holidays.map((h) => (
                    <tr key={h.id} className="border-b">
                      <td className="py-2 pr-4">
                        {editingHolidayId === h.id ? (
                          <input
                            type="date"
                            value={editHoliday.date}
                            onChange={(e) => setEditHoliday((v) => ({ ...v, date: e.target.value }))}
                            className="border rounded px-2 py-1"
                          />
                        ) : (
                          h.date
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {editingHolidayId === h.id ? (
                          <input
                            type="text"
                            value={editHoliday.name}
                            onChange={(e) => setEditHoliday((v) => ({ ...v, name: e.target.value }))}
                            className="border rounded px-2 py-1"
                          />
                        ) : (
                          h.name
                        )}
                      </td>
                      <td className="py-2 pr-4 capitalize">
                        {editingHolidayId === h.id ? (
                          <select
                            value={editHoliday.type}
                            onChange={(e) => setEditHoliday((v) => ({ ...v, type: e.target.value }))}
                            className="border rounded px-2 py-1"
                          >
                            <option value="public">Public</option>
                            <option value="restricted">Restricted</option>
                            <option value="optional">Optional</option>
                          </select>
                        ) : (
                          h.type || 'public'
                        )}
                      </td>
                      <td className="py-2 flex gap-2">
                        {editingHolidayId === h.id ? (
                          <>
                            <button
                              onClick={() => saveEditHoliday(h.id)}
                              className="px-3 py-1 bg-primary text-white rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditHoliday}
                              className="px-3 py-1 bg-gray-300 rounded"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => beginEditHoliday(h)}
                              className="px-3 py-1 bg-blue-500 text-white rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteHoliday(h.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
                        {balance.displayName || type} 
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
            <LeaveTypesChart 
              leaveData={leaveTypeData} 
              title="Leave Types Distribution"
              chartType="pie"
            />

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
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Applied Day</th>
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
                          <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                            {(() => {
                              const d = getAppliedDays(request);
                              return `${d} day${d === 1 ? '' : 's'}`;
                            })()}
                          </td>
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
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Applied Day</th>
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
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                          {(() => {
                            const d = getAppliedDays(request);
                            return `${d} day${d === 1 ? '' : 's'}`;
                          })()}
                        </td>
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
                  {leaveTypes && leaveTypes.length > 0 ? (
                    leaveTypes.map((leaveType) => {
                      // Convert display name to backend enum value
                      const backendValue = leaveType.name.toLowerCase().replace(/\s+leave$/i, '').replace(/\s+/g, '');
                      return (
                        <option key={leaveType.id} value={backendValue}>
                          {leaveType.name}
                        </option>
                      );
                    })
                  ) : (
                    <>
                      <option value="annual">Annual Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="casual">Casual Leave</option>
                      <option value="maternity">Maternity Leave</option>
                      <option value="paternity">Paternity Leave</option>
                      <option value="emergency">Emergency Leave</option>
                    </>
                  )}
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
                        {employee.name}
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
                        {employee.name}
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
                      onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                      className={`border rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:ring-0 focus:border-2 focus:outline-none ${
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
                      className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:ring-0 focus:border-2 focus:border-blue-500 focus:outline-none"
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
                      className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:ring-0 focus:border-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">End Time</label>
                    <Input 
                      type="time" 
                      value={leaveForm.endTime}
                      onChange={(e) => setLeaveForm({...leaveForm, endTime: e.target.value})}
                      className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:border-blue-500"
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

      {/* Compensatory Leave Tab - HR Only */}
      {selectedTab === 'compensatory' && isHR && (
        <div className="space-y-6">
          {/* Header with Add Button */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compensatory Leave Management</h2>
              <p className="text-gray-600 dark:text-gray-400">Assign extra leave credits to employees for overtime work</p>
            </div>
            <Button 
              onClick={() => setShowCompensatoryForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign Credits
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Credits</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loadingCompensatory ? '...' : compensatorySummary.totalActiveCredits}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Employees</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loadingCompensatory ? '...' : compensatorySummary.totalEmployees}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expiring Soon</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loadingCompensatory ? '...' : compensatorySummary.expiringSoon}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compensatory Leave Table */}
          <Card>
            <CardHeader>
              <CardTitle>Compensatory Leave Records</CardTitle>
              <CardDescription>View and manage all compensatory leave assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3">Employee</th>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3">Credits</th>
                      <th className="px-6 py-3">Reason</th>
                      <th className="px-6 py-3">Assigned Date</th>
                      <th className="px-6 py-3">Expiry Date</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compensatoryLeaves.map((comp) => (
                      <tr key={comp.id} className="bg-white dark:bg-gray-900 border-b dark:border-gray-700">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{comp.employeeName}</div>
                            <div className="text-gray-500 dark:text-gray-400">{comp.employeeId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white">{comp.department}</td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded">
                            {comp.credits} days
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white max-w-xs truncate" title={comp.reason}>
                          {comp.reason}
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white">{comp.assignedDate}</td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white">{comp.expiryDate}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                            comp.status === 'active' 
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}>
                            {comp.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCompensatory(comp)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCompensatory(comp.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {compensatoryLeaves.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No compensatory leave records found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Policies Tab - Admin Only */}
      {selectedTab === 'policies' && isAdmin && (
        <div className="space-y-6">
          <LeaveTypes />
        </div>
      )}

      {/* Policies Tab - Non-Admin */}
      {selectedTab === 'policies' && !isAdmin && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Policies</CardTitle>
              <CardDescription>Company leave policies and guidelines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">General Leave Policy</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    {leaveTypes && leaveTypes.length > 0 ? (
                      leaveTypes.map((leaveType, index) => (
                        <li key={leaveType.id || index}>
                          • {leaveType.name}: {leaveType.numberOfLeaves} days per year
                          {leaveType.description && (
                            <span className="text-sm text-gray-500 dark:text-gray-500 ml-2">
                              ({leaveType.description})
                            </span>
                          )}
                        </li>
                      ))
                    ) : (
                      <>
                        <li>• Annual Leave: 20 days per year</li>
                        <li>• Sick Leave: 10 days per year</li>
                        <li>• Casual Leave: 5 days per year</li>
                        <li>• Maternity Leave: 90 days</li>
                      </>
                    )}
                    <li>• Leave requests must be submitted at least 2 days in advance</li>
                    <li>• All leaves require manager approval</li>
                    <li>• Unused annual leave can be carried forward up to 5 days</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Leave Application Process</h3>
                  <ol className="space-y-2 text-gray-600 dark:text-gray-400 list-decimal list-inside">
                    <li>Submit leave request through the system</li>
                    <li>Select appropriate approver (TO) and notify relevant colleagues (CC)</li>
                    <li>Provide clear reason for leave</li>
                    <li>Wait for approval from designated approver</li>
                    <li>Check leave status in the requests section</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compensatory Leave Form Modal */}
      {showCompensatoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingCompensatory ? 'Edit Compensatory Leave' : 'Assign Compensatory Leave'}
            </h3>
            
            <form onSubmit={handleCompensatorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Employee
                </label>
                <select
                  value={compensatoryForm.employeeId}
                  onChange={(e) => setCompensatoryForm(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId}) - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Credits (Days)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={compensatoryForm.credits}
                  onChange={(e) => setCompensatoryForm(prev => ({ ...prev, credits: e.target.value }))}
                  placeholder="Enter number of days"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason
                </label>
                <textarea
                  value={compensatoryForm.reason}
                  onChange={(e) => setCompensatoryForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Reason for compensatory leave (e.g., weekend work, overtime)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expiry Date
                </label>
                <Input
                  type="date"
                  value={compensatoryForm.expiryDate}
                  onChange={(e) => setCompensatoryForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editingCompensatory ? 'Update' : 'Assign'} Credits
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetCompensatoryForm}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
