import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Users, Clock, Timer, Search, Filter, CheckCircle, XCircle, Eye, Download, Calendar } from 'lucide-react';
 
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { AttendanceAPI } from '../../lib/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const AttendanceManagement = () => {
  const { user } = useAuth();
  const {
    myAttendance,
    attendanceSummary,
    attendanceLoading,
    fetchMyAttendance,
    attendanceCheckIn,
    attendanceCheckOut,
    attendanceStatus,
    fetchAttendanceStatus,
    allAttendance,
    allAttendanceLoading,
    fetchAllAttendance,
    employees,
  } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState(null); // 'checkin' | 'checkout'
  const [viewStatus, setViewStatus] = useState(null); // sessions for the selected record's date
  // Month/Year selection for Monthly Calendar
  const init = new Date();
  const [selectedMonth, setSelectedMonth] = useState(init.getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(init.getFullYear());

  

  const handleEditRecord = (recordData) => {
    // For now, local-only edit modal; backend update not implemented here
    setShowEditModal(false);
    setSelectedRecord(null);
  };

// Small inline component to render a session row with optional edit controls for Admin/HR
const SessionRow = ({ index, session, durationLabel, canEdit, onSave }) => {
  const [editing, setEditing] = React.useState(false);
  const [startTime, setStartTime] = React.useState(session.startTime || '');
  const [endTime, setEndTime] = React.useState(session.endTime || '');
  const [saving, setSaving] = React.useState(false);

  const toTimeInput = (t) => (t && /^\d{2}:\d{2}:\d{2}$/.test(t) ? t : (t && /^\d{2}:\d{2}$/.test(t) ? `${t}:00` : ''));
  const fromTimeInput = (t) => (t && /^\d{2}:\d{2}$/.test(t) ? `${t}:00` : t || '');

  const onEdit = () => {
    setStartTime(session.startTime || '');
    setEndTime(session.endTime || '');
    setEditing(true);
  };

  const onCancel = () => {
    setEditing(false);
    setStartTime(session.startTime || '');
    setEndTime(session.endTime || '');
  };

  const onSubmit = async () => {
    setSaving(true);
    try {
      await onSave({ startTime: fromTimeInput(startTime), endTime: fromTimeInput(endTime) });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm h-12 whitespace-nowrap">
      <span>Session {index + 1}</span>
      {!editing ? (
        <>
          <span className="text-gray-700 dark:text-gray-300">{session.startTime} → {session.endTime || 'Ongoing'}</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">{durationLabel}</span>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 w-full justify-end">
          <input
            type="time"
            step="1"
            value={toTimeInput(startTime)}
            onChange={(e) => setStartTime(e.target.value)}
            className="border rounded px-2 py-1 bg-white dark:bg-gray-900"
          />
          <span className="text-gray-700 dark:text-gray-300">→</span>
          <input
            type="time"
            step="1"
            value={toTimeInput(endTime)}
            onChange={(e) => setEndTime(e.target.value)}
            className="border rounded px-2 py-1 bg-white dark:bg-gray-900"
          />
          <Button size="sm" variant="success" disabled={saving} onClick={onSubmit}>{saving ? 'Saving...' : 'Save'}</Button>
          <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      )}
    </div>
  );
};

  const handleDeleteRecord = (recordId) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      // Local-only deletion placeholder; backend deletion not implemented
    }
  };

  const openEditModal = (record) => {
    setSelectedRecord(record);
    setShowEditModal(true);
  };

  const openViewModal = async (record) => {
    setSelectedRecord(record);
    try {
      let res;
      if (user?.role === 'admin' || user?.role === 'hr') {
        // Admin/HR can view any user's sessions for that date
        res = await AttendanceAPI.adminStatus(record.userId, record.date);
      } else {
        // Employee views own status
        res = await AttendanceAPI.status(record.date);
      }
      setViewStatus(res?.data || null);
    } catch {
      setViewStatus(null);
    }
    setShowViewModal(true);
  };

  // Helper: refresh the status visible in modal
  const refreshViewStatus = async () => {
    if (!selectedRecord) return;
    try {
      if (user?.role === 'admin' || user?.role === 'hr') {
        const res = await AttendanceAPI.adminStatus(selectedRecord.userId, selectedRecord.date);
        setViewStatus(res?.data || null);
      } else {
        const res = await AttendanceAPI.status(selectedRecord.date);
        setViewStatus(res?.data || null);
      }
    } catch {}
  };

  useEffect(() => {
    if (user) {
      // Load my attendance for current month and summary for week
      const from = new Date();
      from.setDate(1);
      fetchMyAttendance({ from: from.toISOString().slice(0, 10) });
      fetchAttendanceStatus();
      if (user.role === 'admin' || user.role === 'hr') {
        fetchAdminList();
      }
    }
  }, [user]);

  // Fetch my attendance for the selected month
  useEffect(() => {
    const first = new Date(selectedYear, selectedMonth, 1);
    const last = new Date(selectedYear, selectedMonth + 1, 0);
    const from = first.toISOString().slice(0, 10);
    const to = last.toISOString().slice(0, 10);
    fetchMyAttendance({ from, to });
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    // Drive UI state from active session status
    if (attendanceStatus) {
      setIsCheckedIn(!!attendanceStatus.activeSession);
      setCheckInTime(attendanceStatus.sessionStartTime || null);
    }
  }, [attendanceStatus]);

  const handleCheckIn = async () => {
    const data = await attendanceCheckIn({});
    await fetchAttendanceStatus();
    setIsCheckedIn(true);
    setCheckInTime(attendanceStatus?.sessionStartTime || data?.checkIn || new Date().toLocaleTimeString());
  };

  const handleCheckOut = async () => {
    await attendanceCheckOut({});
    await fetchAttendanceStatus();
    setIsCheckedIn(false);
  };

  const openConfirm = (type) => {
    setConfirmType(type);
    setShowConfirm(true);
  };
  const onConfirmProceed = async () => {
    if (confirmType === 'checkin') {
      await handleCheckIn();
    } else if (confirmType === 'checkout') {
      await handleCheckOut();
    }
    setShowConfirm(false);
    setConfirmType(null);
  };
  const onConfirmCancel = () => {
    setShowConfirm(false);
    setConfirmType(null);
  };

  const handleExportAttendance = () => {
    // Generate attendance CSV export
    const csvContent = generateAttendanceCSV();
    const filename = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    
    downloadCSV(csvContent, filename);
    alert('Attendance report exported successfully!');
  };
  
  const generateAttendanceCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Date', 'Check In', 'Check Out', 'Status', 'Hours'];
    const data = derivedRecords.map(record => [
      record.employeeId || '-',
      record.name || '-',
      record.department || 'N/A',
      record.date || '-',
      record.checkIn || '-',
      record.checkOut || '-',
      record.status || '-',
      record.hours || '-'
    ]);
    return convertToCSV([headers, ...data]);
  };
  
  const convertToCSV = (data) => {
    return data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };
  
  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Build the dataset used by the table depending on role
  const today = new Date().toISOString().slice(0, 10);
  // Admin filters/state
  const [adminType, setAdminType] = useState('daily'); // 'daily' | 'monthly'
  const [adminPicker, setAdminPicker] = useState(() => new Date().toISOString().slice(0, 10)); // daily date or month base
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [adminStatus, setAdminStatus] = useState('all'); // 'all' | 'present' | 'late' | 'absent'

  const adminBackendDate = () => {
    if (adminType === 'daily') return adminPicker; // yyyy-mm-dd
    // if picker is like yyyy-mm (from <input type="month">), normalize to first day
    if (/^\d{4}-\d{2}$/.test(adminPicker)) return `${adminPicker}-01`;
    // else assume full date string; convert to first-of-month
    try {
      const d = new Date(adminPicker);
      if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
    } catch {}
    return new Date().toISOString().slice(0, 10);
  };

  const fetchAdminList = async () => {
    const dateParam = adminBackendDate();
    const params = { type: adminType, date: dateParam };
    if (adminStatus && adminStatus !== 'all') {
      // Absent filter is only supported for a single day (daily)
      if (adminStatus === 'absent' && adminType !== 'daily') {
        return; // guarded by UI; no fetch until mode aligns
      }
      params.status = adminStatus;
    }
    await fetchAllAttendance(params);
  };

  // Re-fetch when admin filters change
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'hr') {
      fetchAdminList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminType, adminPicker, adminStatus]);
  const selfToday = (myAttendance || []).find(r => r.date === today);
  const activeSession = !!attendanceStatus?.activeSession;
  const toHoursDisplay = (hoursWorked, checkIn, checkOut) => {
    const pad2 = (n) => String(n).padStart(2, '0');
    const fmt = (totalSeconds) => {
      const sec = Math.max(0, Math.round(totalSeconds));
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
    };

    // Prefer exact computation from checkIn/checkOut if available
    const parseToSec = (t) => {
      if (!t) return null;
      const [hh = 0, mm = 0, ss = 0] = t.split(':').map(Number);
      if (Number.isNaN(hh) || Number.isNaN(mm) || Number.isNaN(ss)) return null;
      return hh * 3600 + mm * 60 + ss;
    };
    const si = parseToSec(checkIn);
    const so = parseToSec(checkOut);
    if (si !== null && so !== null && so >= si) {
      return fmt(so - si);
    }

    // Fallback to decimal hoursWorked -> HH:MM:SS
    if (hoursWorked !== undefined && hoursWorked !== null && hoursWorked !== '') {
      const n = Number(hoursWorked);
      if (!Number.isNaN(n)) return fmt(n * 3600);
    }
    return '-';
  };

  // Helpers for sessions-based computations for TODAY only (from attendanceStatus)
  const parseHMS = (t) => {
    if (!t) return null;
    const [hh = 0, mm = 0, ss = 0] = String(t).split(':').map(Number);
    if ([hh, mm, ss].some((x) => Number.isNaN(x))) return null;
    return hh * 3600 + mm * 60 + ss;
  };
  const formatSec = (secTotal) => {
    const sec = Math.max(0, Math.round(secTotal || 0));
    const pad2 = (n) => String(n).padStart(2, '0');
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  };
  const todaySessions = Array.isArray(attendanceStatus?.sessions) ? attendanceStatus.sessions : [];
  const lastClosedSession = [...todaySessions].reverse().find((s) => !!s.endTime);
  const lastCheckoutTime = lastClosedSession?.endTime || '-';
  const totalSecondsFromSessions = () => {
    let total = 0;
    const now = new Date();
    for (const s of todaySessions) {
      const startSec = parseHMS(s.startTime);
      const endSec = s.endTime ? parseHMS(s.endTime) : null;
      if (startSec !== null) {
        if (endSec !== null) total += Math.max(0, endSec - startSec);
        else {
          // ongoing session -> compute until now based on wall clock time for today
          const partsNow = [now.getHours(), now.getMinutes(), now.getSeconds()];
          const nowSec = partsNow[0] * 3600 + partsNow[1] * 60 + partsNow[2];
          total += Math.max(0, nowSec - startSec);
        }
      }
    }
    return total;
  };

  const totalSecondsFromSessionsGeneric = (sessions) => {
    let total = 0;
    const now = new Date();
    for (const s of (sessions || [])) {
      const startSec = parseHMS(s.startTime);
      const endSec = s.endTime ? parseHMS(s.endTime) : null;
      if (startSec !== null) {
        if (endSec !== null) total += Math.max(0, endSec - startSec);
        else {
          const partsNow = [now.getHours(), now.getMinutes(), now.getSeconds()];
          const nowSec = partsNow[0] * 3600 + partsNow[1] * 60 + partsNow[2];
          total += Math.max(0, nowSec - startSec);
        }
      }
    }
    return total;
  };
  const mapToRow = (r, idx) => ({
    id: r.id || idx,
    userId: r.userId || r.Employee?.id,
    employeeId: r.employeeId || r.Employee?.employeeId || r.Employee?.id || '-',
    name: r.Employee?.name || r.employee?.name || r.name || r.userEmail || 'N/A',
    department: r.Employee?.department || r.department,
    date: r.date,
    checkIn: r.checkIn || '-',
    checkOut: r.checkOut || '-',
    status: r.status || (r.checkIn ? 'present' : 'absent'),
    hours: toHoursDisplay(r.hoursWorked, r.checkIn, r.checkOut)
  });
  const derivedRecords = (user?.role === 'employee'
    ? (myAttendance || []).map((r, idx) => ({
        id: r.id || idx,
        employeeId: '-',
        name: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email,
        department: '-',
        date: r.date,
        checkIn: r.checkIn || '-',
        // For today, show last closed session's endTime as Check Out
        checkOut: r.date === today ? (lastCheckoutTime || '-') : (r.checkOut || '-'),
        status: r.status || (r.checkIn ? 'present' : 'absent'),
        // For today, compute hours from sessions accurately (including ongoing)
        hours: r.date === today ? formatSec(totalSecondsFromSessions()) : toHoursDisplay(r.hoursWorked, r.checkIn, r.checkOut)
      }))
    : (allAttendance || []).map(mapToRow)
  ).filter(record => (record.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
   .slice(0, entriesPerPage);

  // Summary metrics: Present Today, Absent Today, Late Today (role-aware)
  const activeEmployees = (employees || []).filter(e => (e?.status || 'active') === 'active');
  const todayMy = (myAttendance || []).find(r => r.date === today);
  const adminTodayPresent = (allAttendance || []).filter(r => r?.date === today && r?.checkIn);
  const presentTodayCount = (user?.role === 'employee')
    ? (todayMy?.checkIn ? 1 : 0)
    : new Set(adminTodayPresent.map(r => r.userId || r.employeeId || r.Employee?.id || r.id)).size;
  const absentTodayCount = (user?.role === 'employee')
    ? (presentTodayCount ? 0 : 1)
    : Math.max(0, activeEmployees.length - presentTodayCount);
  const lateTodayCount = (user?.role === 'employee')
    ? (todayMy?.status === 'late' ? 1 : 0)
    : (allAttendance || []).filter(r => r?.date === today && r?.status === 'late').length;

  // Charts: build weekly dataset (Mon–Fri) for HR/Admin
  const startOfWeek = (d) => {
    const date = new Date(d);
    const day = date.getDay(); // 0 Sun .. 6 Sat
    const diffToMon = (day + 6) % 7; // Mon=0
    date.setDate(date.getDate() - diffToMon);
    date.setHours(0,0,0,0);
    return date;
  };
  const formatDay = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
  const fmtISO = (d) => new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  const weekStart = startOfWeek(new Date());
  const daysOfWeek = Array.from({ length: 5 }, (_, i) => {
    const dd = new Date(weekStart);
    dd.setDate(weekStart.getDate() + i);
    return dd;
  });
  const weekData = daysOfWeek.map((d) => {
    const iso = fmtISO(d);
    const dayRecords = (allAttendance || []).filter(r => r?.date === iso);
    const present = new Set(dayRecords.filter(r => r?.checkIn).map(r => r.userId || r.employeeId || r.Employee?.id || r.id)).size;
    const late = dayRecords.filter(r => r?.status === 'late').length;
    const totalActive = (employees || []).filter(e => (e?.status || 'active') === 'active').length;
    const absent = Math.max(0, totalActive - present);
    return { name: formatDay(d), present, late, absent };
  });

  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState('daily');
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportFrom, setReportFrom] = useState(new Date().toISOString().slice(0, 10));
  const [reportTo, setReportTo] = useState(new Date().toISOString().slice(0, 10));
  const [exportFormat, setExportFormat] = useState('excel');

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateReport = async () => {
    const params = { type: reportType, format: exportFormat };
    if (reportType === 'daily') params.date = reportDate;
    else if (reportType === 'monthly') params.date = reportMonth; // yyyy-mm
    else if (reportType === 'range') { params.from = reportFrom; params.to = reportTo; }

    const blob = await AttendanceAPI.generateReport(params);
    const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    let label = 'report';
    if (reportType === 'daily') label = reportDate;
    else if (reportType === 'monthly') label = reportMonth;
    else label = `${reportFrom}_to_${reportTo}`;
    const ext = exportFormat === 'pdf' ? 'pdf' : 'csv';
    downloadBlob(blob, `attendance_${reportType}_${label}_${stamp}.${ext}`);
    setReportOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Track and manage employee attendance</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2" onClick={handleExportAttendance}>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button
            variant="default"
            className="flex items-center space-x-2"
            onClick={() => {
              // Prefill defaults based on current Admin view
              try {
                if (user?.role === 'admin' || user?.role === 'hr') {
                  if (adminType === 'daily') {
                    setReportType('daily');
                    const d = (adminPicker && adminPicker.length >= 10) ? adminPicker.slice(0,10) : new Date().toISOString().slice(0,10);
                    setReportDate(d);
                  } else {
                    setReportType('monthly');
                    const m = (adminPicker && adminPicker.length >= 7) ? adminPicker.slice(0,7) : new Date().toISOString().slice(0,7);
                    setReportMonth(m);
                  }
                } else {
                  // Employees: default to daily today
                  setReportType('daily');
                  setReportDate(new Date().toISOString().slice(0,10));
                }
              } catch {}
              setExportFormat('excel');
              setReportOpen(true);
            }}
          >
            <Calendar className="h-4 w-4" />
            <span>Generate Report</span>
          </Button>
        </div>
      </div>

      {/* Employee Self-Service Check-in/out */}
      {user?.role === 'employee' && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Check-in/out</CardTitle>
            <CardDescription>Mark your attendance for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {isCheckedIn ? `Checked in at ${checkInTime}` : (lastCheckoutTime && lastCheckoutTime !== '-' ? `Last checkout at ${lastCheckoutTime}` : 'Ready to check in?')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                {!isCheckedIn ? (
                  <Button onClick={() => openConfirm('checkin')} variant="success" className="flex items-center" disabled={activeSession} title={activeSession ? 'You already have an active session' : 'Start a new session'}>
                    <Clock className="h-4 w-4 mr-2" />
                    Check In
                  </Button>
                ) : (
                  <Button onClick={() => openConfirm('checkout')} variant="destructive" className="flex items-center" disabled={!activeSession} title={!activeSession ? 'No active session to check out' : 'End current session'}>
                    <Clock className="h-4 w-4 mr-2" />
                    Check Out
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentTodayCount}</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{absentTodayCount}</div>
            <p className="text-xs text-muted-foreground">Active employees: {user?.role === 'employee' ? 1 : activeEmployees.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lateTodayCount}</div>
            <p className="text-xs text-muted-foreground">After 9:15 AM</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{myAttendance?.length ? (Math.round((myAttendance.reduce((acc, r) => acc + (Number(r.hoursWorked) || 0), 0) / myAttendance.length) * 10) / 10) : '-'}</div>
            <p className="text-xs text-muted-foreground">Hours per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts: HR/Admin overview (reuse Admin Dashboard design) */}
      {(user?.role === 'admin' || user?.role === 'hr') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Attendance</CardTitle>
              <CardDescription>Employee attendance for this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="present" fill="#3b82f6" name="Present" />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Leave Trends (using weekly late counts as placeholder for leaves) */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Trends</CardTitle>
              <CardDescription>Monthly leave requests over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="late" name="Leaves" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's Attendance Table (employee sees own records; admin/hr keeps mock list for now) */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
          <CardDescription>Real-time attendance tracking for {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3 md:gap-4 mb-6 overflow-x-auto">
            <div className="relative md:flex-1 md:max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-56 sm:w-64 md:w-full"
              />
            </div>
            {/* Admin filters */}
            {user?.role !== 'employee' && (
              <div className="flex items-center gap-3 flex-nowrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm">Type:</label>
                  <button
                    className={`px-2 py-1 text-sm rounded border ${adminType === 'daily' ? 'bg-primary text-white' : 'bg-transparent'}`}
                    onClick={() => setAdminType('daily')}
                    type="button"
                  >Daily</button>
                  <button
                    className={`px-2 py-1 text-sm rounded border ${adminType === 'monthly' ? 'bg-primary text-white' : 'bg-transparent'}`}
                    onClick={() => setAdminType('monthly')}
                    type="button"
                  >Monthly</button>
                </div>
                <div>
                  {adminType === 'daily' ? (
                    <input
                      aria-label="Pick date"
                      type="date"
                      value={adminPicker}
                      onChange={(e) => setAdminPicker(e.target.value)}
                      className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-900"
                    />
                  ) : (
                    <input
                      aria-label="Pick month"
                      type="month"
                      value={/^\d{4}-\d{2}$/.test(adminPicker) ? adminPicker : adminPicker.slice(0,7)}
                      onChange={(e) => setAdminPicker(e.target.value)}
                      className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-900"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Status:</label>
                  <select
                    value={adminStatus}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'absent' && adminType !== 'daily') {
                        // Switch to daily and set date to today for absent filter
                        setAdminType('daily');
                        setAdminPicker(new Date().toISOString().slice(0,10));
                      }
                      setAdminStatus(val);
                    }}
                    className="border rounded px-2 pr-6 py-1 text-sm min-w-[120px] bg-white dark:bg-gray-900"
                  >
                    <option value="all">All</option>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent" disabled={adminType !== 'daily'} title={adminType !== 'daily' ? 'Absent filter requires Daily view' : ''}>Absent</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Show</label>
                  <select
                    value={entriesPerPage}
                    onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                    className="border rounded px-2 pr-6 py-1 text-sm min-w-[72px] bg-white dark:bg-gray-900"
                  >
                    {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-56 md:max-h-72">
            <table className="w-full min-w-full sm:min-w-[700px] md:min-w-[900px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 h-12">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Check In</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Check Out</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(user?.role !== 'employee' && allAttendanceLoading) ? (
                  <tr>
                    <td className="py-6 px-4 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={6}>
                      Loading attendance...
                    </td>
                  </tr>
                ) : derivedRecords.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 h-14">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 rounded-full p-2">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{record.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{record.checkIn}</td>
                    <td className="py-3 px-4 text-sm">{record.checkOut}</td>
                    <td className="py-3 px-4 text-sm">{record.hours}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'present' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : record.status === 'late'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {record.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openViewModal(record)}
                        title="View Details"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {user?.role === 'employee' && (
        <>
          {/* Monthly Calendar View */}
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle>Monthly Calendar</CardTitle>
                <CardDescription>Attendance overview for the current month</CardDescription>
              </div>
              {/* Totals and month/year picker aligned horizontally */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Totals */}
                {(() => {
                  const map = new Map((myAttendance || []).map(r => [r.date, r]));
                  const first = new Date(selectedYear, selectedMonth, 1);
                  const last = new Date(selectedYear, selectedMonth + 1, 0);
                  let present = 0, absent = 0, late = 0;
                  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
                    const key = d.toISOString().slice(0,10);
                    const rec = map.get(key);
                    if (!rec) continue;
                    const status = (rec.status || '').toLowerCase();
                    if (status === 'present') present++;
                    else if (status === 'late') late++;
                    else if (status === 'absent') absent++;
                  }
                  return (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span><span>Present: {present}</span></div>
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span>Absent: {absent}</span></div>
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span><span>Late: {late}</span></div>
                    </div>
                  );
                })()}
                {/* Picker */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const now = new Date();
                    const currentYear = now.getFullYear();
                    const currentMonth = now.getMonth(); // 0..11
                    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                    const years = Array.from({length: 11}, (_, i) => currentYear - i); // currentYear .. currentYear-10
                    return (
                      <>
                        <select
                          aria-label="Select month"
                          className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-900 min-w-[6rem]"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                          {months.map((m, i) => (
                            <option key={m} value={i} disabled={selectedYear === currentYear && i > currentMonth}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label="Select year"
                          className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-900 min-w-[5.5rem]"
                          value={selectedYear}
                          onChange={(e) => {
                            const y = Number(e.target.value);
                            // If switching to current year and currently selected month is in future, clamp to current month
                            if (y === currentYear && selectedMonth > currentMonth) {
                              setSelectedMonth(currentMonth);
                            }
                            setSelectedYear(y);
                          }}
                        >
                          {years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </>
                    );
                  })()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </div>
                ))}
              </div>
              {/* Calendar days built from backend data */}
              {(() => {
                const first = new Date(selectedYear, selectedMonth, 1);
                const last = new Date(selectedYear, selectedMonth + 1, 0);
                const startPad = first.getDay(); // 0..6, Sun start
                const totalDays = last.getDate();
                const daysArray = [];
                for (let i = 0; i < startPad; i++) daysArray.push(null);
                for (let d = 1; d <= totalDays; d++) daysArray.push(d);
                const map = new Map((myAttendance || []).map(r => [r.date, r]));
                return (
                  <div className="grid grid-cols-7 gap-2">
                    {daysArray.map((day, idx) => {
                      if (day === null) return <div key={`pad-${idx}`} />;
                      const curr = new Date(selectedYear, selectedMonth, day);
                      const key = curr.toISOString().slice(0,10);
                      const rec = map.get(key);
                      const status = (rec?.status || '').toLowerCase();
                      const color = status === 'present' ? 'bg-green-500' : status === 'late' ? 'bg-yellow-500' : status === 'absent' ? 'bg-red-500' : '';
                      const isToday = key === new Date().toISOString().slice(0,10);
                      // Compute hours text from available fields
                      const minutesFrom = (n) => {
                        const mins = Number(n);
                        return Number.isFinite(mins) ? mins : null;
                      };
                      const formatMins = (mins) => {
                        const h = Math.floor(mins / 60);
                        const m = mins % 60;
                        return `${h}h ${m}m`;
                      };
                      let hoursText = null;
                      if (rec) {
                        if (typeof rec.hours === 'string' && rec.hours.trim()) hoursText = rec.hours;
                        else if (typeof rec.hoursWorked === 'string' && rec.hoursWorked.trim()) hoursText = rec.hoursWorked;
                        else if (minutesFrom(rec.hoursWorkedMinutes) !== null) hoursText = formatMins(minutesFrom(rec.hoursWorkedMinutes));
                        else if (minutesFrom(rec.totalMinutes) !== null) hoursText = formatMins(minutesFrom(rec.totalMinutes));
                        else if (status === 'absent') hoursText = '0h 0m';
                      }
                      const title = rec ? (hoursText ? `Hours: ${hoursText}` : (status ? `Hours: 0h 0m` : 'No record')) : 'No record';
                      return (
                        <div
                          key={key}
                          className={`p-2 rounded-lg text-center border dark:border-gray-800 ${isToday ? 'bg-gray-900 text-white dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'} ${rec ? 'cursor-pointer' : ''}`}
                          title={title}
                        >
                          <div className="text-sm font-medium">{day}</div>
                          <div className="flex justify-center mt-1 h-2">
                            {status && (<span className={`w-2 h-2 rounded-full ${color}`}></span>)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              {/* Legend */}
              <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Present</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Absent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Late</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      {/* View Attendance Modal */}
      {showViewModal && selectedRecord && (
        <div className="fixed p-4 inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 md:p-6 w-full max-w-[95vw] md:max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedRecord.name} - Attendance Details</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowViewModal(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee Name</label>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedRecord.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date</label>
                  <p className="text-gray-900 dark:text-white">{new Date(selectedRecord.date + 'T00:00:00').toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedRecord.status === 'present' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : selectedRecord.status === 'late'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {selectedRecord.status?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hours</label>
                  {(() => {
                    const isSelfToday = (user?.role === 'employee') && (selectedRecord.date === today);
                    const secs = isSelfToday
                      ? totalSecondsFromSessions()
                      : totalSecondsFromSessionsGeneric(viewStatus?.sessions || []);
                    return <p className="text-gray-900 dark:text-white font-bold text-lg">{formatSec(secs)}</p>;
                  })()}
                </div>
              </div>

              {/* Sessions list for selected day */}
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{(user?.role === 'employee' && selectedRecord.date === today) ? "Today's Sessions" : "Sessions on Selected Date"}</label>
                <div className="mt-2 overflow-x-auto overflow-y-auto max-h-56">
                  <div className="min-w-full md:min-w-[600px] space-y-2">
                    {(() => {
                      const isSelfToday = (user?.role === 'employee') && (selectedRecord.date === today);
                      const list = isSelfToday ? todaySessions : (viewStatus?.sessions || []);
                      return list.length ?
                        list.map((s, i) => {
                          const sSec = parseHMS(s.startTime);
                          const eSec = s.endTime ? parseHMS(s.endTime) : null;
                          const dur = (sSec !== null) ? (eSec !== null ? Math.max(0, eSec - sSec) : 0) : 0;
                          const canEdit = (user?.role === 'admin' || user?.role === 'hr') && !isSelfToday; // admin/hr editing others
                          return (
                            <SessionRow
                              key={s.id || i}
                              index={i}
                              session={s}
                              durationLabel={formatSec(dur)}
                              canEdit={canEdit}
                              onSave={async (updated) => {
                                await AttendanceAPI.updateSession({ sessionId: s.id, startTime: updated.startTime, endTime: updated.endTime });
                                await refreshViewStatus();
                              }}
                            />
                          );
                        }) : (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm text-gray-500">No sessions</div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Static extras */}
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Location</label>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-900 dark:text-white">Office - Main Building</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes</label>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-900 dark:text-white">
                    {selectedRecord.status === 'late' ? 'Arrived late due to traffic' : 'Regular attendance'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Check In/Out Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {confirmType === 'checkin' ? 'Confirm Check In' : 'Confirm Check Out'}
              </h3>
              <Button variant="ghost" size="sm" onClick={onConfirmCancel}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to {confirmType === 'checkin' ? 'check in' : 'check out'} for today ({new Date().toLocaleDateString()})?
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={onConfirmCancel}>Cancel</Button>
              <Button variant={confirmType === 'checkin' ? 'success' : 'destructive'} onClick={onConfirmProceed}>
                {confirmType === 'checkin' ? 'Yes, Check In' : 'Yes, Check Out'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Report</h3>
              <Button variant="ghost" size="sm" onClick={() => setReportOpen(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Report Type</label>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-1 rounded border text-sm ${reportType === 'daily' ? 'bg-gray-900 text-white' : ''}`}
                    onClick={() => setReportType('daily')}
                  >Daily</button>
                  <button
                    className={`px-3 py-1 rounded border text-sm ${reportType === 'monthly' ? 'bg-gray-900 text-white' : ''}`}
                    onClick={() => setReportType('monthly')}
                  >Monthly</button>
                  <button
                    className={`px-3 py-1 rounded border text-sm ${reportType === 'range' ? 'bg-gray-900 text-white' : ''}`}
                    onClick={() => setReportType('range')}
                  >Custom Range</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Export Format</label>
                <select
                  className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-900"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>

              {reportType === 'daily' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    className="border rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-900"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                  />
                </div>
              )}

              {reportType === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Month</label>
                  <input
                    type="month"
                    className="border rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-900"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                  />
                </div>
              )}

              {reportType === 'range' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">From</label>
                    <input
                      type="date"
                      className="border rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-900"
                      value={reportFrom}
                      onChange={(e) => setReportFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">To</label>
                    <input
                      type="date"
                      className="border rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-900"
                      value={reportTo}
                      onChange={(e) => setReportTo(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
              <Button onClick={handleGenerateReport}>Generate</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
