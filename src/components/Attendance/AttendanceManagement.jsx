import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Users, Clock, Timer, Search, Filter, CheckCircle, XCircle, Eye, Download, Calendar, Plus, User, Save, X, Play, Pause } from 'lucide-react';
 
import { useAuth } from '../../contexts/AuthContext';
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
  const [weeklyData, setWeeklyData] = useState([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState(null); // 'checkin' | 'checkout'
  
  // Add Employee Attendance Modal State
  const [showAddAttendanceModal, setShowAddAttendanceModal] = useState(false);
  const [addAttendanceForm, setAddAttendanceForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '',
    checkOutTime: '',
    description: ''
  });
  const [isAddingAttendance, setIsAddingAttendance] = useState(false);
  const [addAttendanceError, setAddAttendanceError] = useState('');
  const [viewStatus, setViewStatus] = useState(null); // sessions for the selected record's date
  
  // Date Details Modal State
  const [showDateDetailsModal, setShowDateDetailsModal] = useState(false);
  const [selectedDateDetails, setSelectedDateDetails] = useState(null);
  const [dateDetailsLoading, setDateDetailsLoading] = useState(false);

  // Work Duration Timer State
  const [workDuration, setWorkDuration] = useState('00:00:00');
  const [totalWorkedTime, setTotalWorkedTime] = useState('00:00:00');
  const [timerStartTime, setTimerStartTime] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);

  // Derived state from attendance data
  const activeSession = attendanceStatus?.activeSession;
  
  // Month/Year selection for Monthly Calendar
  const init = new Date();
  const [selectedMonth, setSelectedMonth] = useState(init.getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(init.getFullYear());
  
  // State for attendance summary data
  const [attendanceTotals, setAttendanceTotals] = useState({
    present: 0,
    absent: 0,
    late: 0,
    totalWorkingDays: 0,
    attendancePercentage: '0.00'
  });
  const [totalsLoading, setTotalsLoading] = useState(false);

  // Function to fetch attendance totals for the selected month
  const fetchAttendanceTotals = async () => {
    if (!user?.employeeId) return;
    
    setTotalsLoading(true);
    try {
      // Calculate date range for the selected month
      const firstDay = new Date(selectedYear, selectedMonth, 1);
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
      const from = firstDay.toISOString().split('T')[0]; // YYYY-MM-DD
      const to = lastDay.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const response = await AttendanceAPI.getEmployeeSummary({
        employeeId: user.employeeId,
        from,
        to
      });
      
      if (response.data) {
        setAttendanceTotals({
          present: response.data.presentDays || 0,
          absent: response.data.absentDays || 0,
          late: response.data.lateDays || 0,
          totalWorkingDays: response.data.totalWorkingDays || 0,
          attendancePercentage: response.data.attendancePercentage || '0.00'
        });
      }
    } catch (error) {
      console.error('Error fetching attendance totals:', error);
      // Fallback to existing calculation if API fails
      calculateTotalsFromExistingData();
    } finally {
      setTotalsLoading(false);
    }
  };

  // Timer now uses the SAME logic as the table (totalSecondsFromSessions + formatSec)

  const startTimer = (checkInTime) => {
    try {
      const startTime = checkInTime || new Date().toISOString();
      console.log('🔍 DEBUG - Starting timer with:', { checkInTime, startTime });
      
      setTimerStartTime(startTime);
      setIsTimerRunning(true);
      
      // Clear any existing timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      // Start new timer using the SAME logic as the table
      timerIntervalRef.current = setInterval(() => {
        try {
          // Use the exact same logic as the table: formatSec(totalSecondsFromSessions())
          const currentSeconds = totalSecondsFromSessions();
          const formatted = formatSec(currentSeconds);
          console.log('🔍 DEBUG - Timer update (using table logic):', { currentSeconds, formatted });
          setWorkDuration(formatted);
        } catch (error) {
          console.error('Error updating timer:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Use the SAME logic as the table for final worked time
    const finalSeconds = totalSecondsFromSessions();
    const completedTime = formatSec(finalSeconds);
    setTotalWorkedTime(completedTime);
    
    console.log('🔍 DEBUG - Timer stopped (using table logic):', { 
      finalSeconds, 
      completedTime 
    });
  };

  const resumeTimer = (checkInTime) => {
    if (checkInTime && !isTimerRunning) {
      try {
        startTimer(checkInTime);
      } catch (error) {
        console.error('Error resuming timer:', error);
      }
    }
  };

  // Fallback function to calculate totals from existing myAttendance data
  const calculateTotalsFromExistingData = () => {
    const map = new Map((myAttendance || []).map(r => [r.date, r]));
    const first = new Date(selectedYear, selectedMonth, 1);
    const last = new Date(selectedYear, selectedMonth + 1, 0);
    let present = 0, absent = 0, late = 0;
    const toKey = (dt) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
    
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
      // Skip weekends (assuming Monday-Friday work week)
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      
      const key = toKey(d);
      const rec = map.get(key);
      if (!rec) {
        absent++;
        continue;
      }
      const status = (rec.status || '').toLowerCase();
      if (status === 'present') present++;
      else if (status === 'late') late++;
      else if (status === 'absent') absent++;
    }
    
    const totalWorkingDays = present + absent + late;
    const attendancePercentage = totalWorkingDays > 0 ? ((present + late) / totalWorkingDays * 100).toFixed(2) : '0.00';
    
    setAttendanceTotals({
      present,
      absent,
      late,
      totalWorkingDays,
      attendancePercentage
    });
  };

  // Effect to fetch totals when month/year changes
  useEffect(() => {
    if (user?.employeeId) {
      fetchAttendanceTotals();
    }
  }, [selectedMonth, selectedYear, user?.employeeId]);

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

  // Handle date click to show attendance details
  const handleDateClick = async (date) => {
    setDateDetailsLoading(true);
    setShowDateDetailsModal(true);
    setSelectedDateDetails(null);

    try {
      const response = await AttendanceAPI.getAttendanceForDate(date);
      setSelectedDateDetails(response.data);
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      setSelectedDateDetails({
        error: 'Failed to load attendance details',
        date: date
      });
    } finally {
      setDateDetailsLoading(false);
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
        // also fetch weekly overview from backend
        (async () => {
          try {
            setWeeklyLoading(true);
            const res = await AttendanceAPI.weekly();
            const days = Array.isArray(res?.data?.days) ? res.data.days : [];
            // Build names client-side from date to prevent server-timezone label drift
            const toName = (iso) => {
              try {
                const [Y, M, D] = String(iso).split('-').map(Number);
                const dd = new Date(Y, (M || 1) - 1, D || 1, 0, 0, 0, 0); // local date
                return dd.toLocaleDateString('en-US', { weekday: 'short' });
              } catch { return String(iso); }
            };
            const data = days
              .map(d => ({ date: d.date, name: toName(d.date), present: d.present || 0, absent: d.absent || 0, late: d.late || 0 }))
              .sort((a, b) => String(a.date).localeCompare(String(b.date)));
            setWeeklyData(data);
          } catch (e) {
            setWeeklyData([]);
          } finally {
            setWeeklyLoading(false);
          }
        })();
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
    // Drive UI state from attendance status
    if (attendanceStatus) {
      // Employee is considered "checked in" if:
      // 1. They have an active session (ongoing check-in), OR
      // 2. They have attendance for today (including HR/Admin added attendance) but no completed sessions yet
      const hasActiveSession = !!attendanceStatus.activeSession;
      const hasAttendanceButNoCompletedSessions = attendanceStatus.hasAttendanceToday && !attendanceStatus.hasCompletedSessions;
      
      setIsCheckedIn(hasActiveSession || hasAttendanceButNoCompletedSessions);
      setCheckInTime(attendanceStatus.sessionStartTime || null);

      // Resume timer if there's an active session and timer is not already running
      if (hasActiveSession && attendanceStatus.sessionStartTime && !isTimerRunning) {
        const startTimestamp = attendanceStatus.sessionStartTimestamp || attendanceStatus.sessionStartTime;
        console.log('🔍 DEBUG - Attempting to resume timer:', { 
          hasActiveSession, 
          sessionStartTime: attendanceStatus.sessionStartTime,
          startTimestamp,
          isTimerRunning 
        });
        if (startTimestamp) {
          resumeTimer(startTimestamp);
        }
      } else if (!hasActiveSession && isTimerRunning) {
        // Stop timer if no active session
        console.log('🔍 DEBUG - Stopping timer (no active session)');
        stopTimer();
      } else if (!hasActiveSession && !isTimerRunning) {
        // Use the SAME logic as the table for completed time
        const currentSeconds = totalSecondsFromSessions();
        const completedTime = formatSec(currentSeconds);
        setTotalWorkedTime(completedTime);
        setWorkDuration('00:00:00'); // Reset work duration
        setTimerStartTime(null);
        
        console.log('🔍 DEBUG - Setting completed hours (table logic):', { 
          currentSeconds, 
          completedTime 
        });
      }
    }
  }, [attendanceStatus]);

  // Sync timer with table logic when attendance changes
  useEffect(() => {
    if (!isTimerRunning && !activeSession) {
      // Use the SAME logic as the table for completed time
      const currentSeconds = totalSecondsFromSessions();
      const completedTime = formatSec(currentSeconds);
      setTotalWorkedTime(completedTime);
      
      console.log('🔍 DEBUG - Syncing with table logic:', { 
        currentSeconds, 
        completedTime 
      });
    }
  }, [myAttendance, isTimerRunning, activeSession, attendanceStatus]);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const handleCheckIn = async () => {
    const data = await attendanceCheckIn({});
    await fetchAttendanceStatus();
    setIsCheckedIn(true);
    const checkInTimeValue = attendanceStatus?.sessionStartTime || data?.checkIn || new Date().toLocaleTimeString();
    setCheckInTime(checkInTimeValue);
    
    // Start the work duration timer
    startTimer(data?.checkInTimestamp || new Date().toISOString());
  };

  const handleCheckOut = async () => {
    await attendanceCheckOut({});
    await fetchAttendanceStatus();
    setIsCheckedIn(false);
    
    // Stop the work duration timer
    stopTimer();
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
  // Compute local today yyyy-mm-dd (not UTC) to align with backend iso-only dates
  const pad2 = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const today = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  // Admin filters/state
  const [adminType, setAdminType] = useState('daily'); // 'daily' | 'monthly'
  const [adminPicker, setAdminPicker] = useState(() => new Date().toISOString().slice(0, 10)); // daily date or month base
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [adminStatus, setAdminStatus] = useState('all'); // 'all' | 'present' | 'late' | 'absent'

  // Employee filters/state (for Today's Attendance table)
  const [empType, setEmpType] = useState('daily'); // 'daily' | 'monthly'
  const [empPicker, setEmpPicker] = useState(today); // daily date (YYYY-MM-DD) or month base (YYYY-MM)
  const [empStatus, setEmpStatus] = useState('all'); // 'all' | 'present' | 'late' | 'absent'
  const [empEntriesPerPage, setEmpEntriesPerPage] = useState(10);

  // Separate filters for Monthly Calendar
  const [calendarType, setCalendarType] = useState('monthly'); // 'daily' | 'monthly'
  const [calendarPicker, setCalendarPicker] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM for month
  const [calendarStatus, setCalendarStatus] = useState('all'); // 'all' | 'present' | 'late' | 'absent'

  // Separate state variables for Today's Attendance table data
  const [todayTableData, setTodayTableData] = useState([]);
  const [todayTableLoading, setTodayTableLoading] = useState(false);

  // Separate state variables for Monthly Calendar data
  const [calendarData, setCalendarData] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

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

  // Dedicated API function for Employee Today's Attendance table ONLY
  const fetchEmployeeTableData = async () => {
    // Only for employees - admin/HR don't have this separate table UI
    if (user?.role !== 'employee') {
      return;
    }

    setTodayTableLoading(true);
    try {
      console.log('🔍 DEBUG - Fetching Employee Today\'s Attendance table data with filters:', {
        empType,
        empPicker,
        empStatus
      });

      let params = {};
      
      if (empType === 'daily') {
        // For daily, use the same format as calendar: from and to dates
        params = { from: empPicker, to: empPicker };
      } else {
        // For monthly, calculate from and to dates like the calendar does
        const monthKey = /^\d{4}-\d{2}$/.test(empPicker) ? empPicker : String(empPicker || today).slice(0, 7);
        const [year, month] = monthKey.split('-');
        const first = new Date(parseInt(year), parseInt(month) - 1, 1);
        const last = new Date(parseInt(year), parseInt(month), 0);
        const from = first.toISOString().slice(0, 10);
        const to = last.toISOString().slice(0, 10);
        params = { from, to };
      }
      
      console.log('🔍 DEBUG - API params for employee table:', params);
      
      // Use the same API call format as the calendar
      const response = await fetchMyAttendance(params);
      setTodayTableData(response || []);
      console.log('🔍 DEBUG - Employee table data updated:', response?.length || 0, 'records');
      
    } catch (error) {
      console.error('Error fetching employee table data:', error);
      setTodayTableData([]);
    } finally {
      setTodayTableLoading(false);
    }
  };

  // Keep the old function for backward compatibility (if needed elsewhere)
  const fetchAdminList = async () => {
    // Admin/HR use the original shared data approach
    const dateParam = adminBackendDate();
    const params = { type: adminType, date: dateParam };
    if (adminStatus && adminStatus !== 'all') {
      if (adminStatus === 'absent' && adminType !== 'daily') {
        return;
      }
      params.status = adminStatus;
    }
    await fetchAllAttendance(params);
  };

  // Separate fetch function for Monthly Calendar
  const fetchCalendarData = async () => {
    setCalendarLoading(true);
    try {
      if (user?.role === 'employee') {
        // For employees, fetch their own attendance data for the calendar
        const first = new Date(selectedYear, selectedMonth, 1);
        const last = new Date(selectedYear, selectedMonth + 1, 0);
        const from = first.toISOString().slice(0, 10);
        const to = last.toISOString().slice(0, 10);
        
        // Call API directly and store in separate calendar state
        const response = await AttendanceAPI.getMyAttendance({ from, to });
        setCalendarData(response || []);
        console.log('🔍 DEBUG - Calendar data updated:', response?.length || 0, 'records');
      } else {
        // For admin/HR, fetch all attendance data for the calendar
        const calendarDate = calendarType === 'monthly' ? `${calendarPicker}-01` : calendarPicker;
        const params = { type: calendarType, date: calendarDate };
        if (calendarStatus && calendarStatus !== 'all') {
          if (calendarStatus === 'absent' && calendarType !== 'daily') {
            setCalendarLoading(false);
            return; // guarded by UI; no fetch until mode aligns
          }
          params.status = calendarStatus;
        }
        
        // Call API directly and store in separate calendar state
        const response = await AttendanceAPI.getAllAttendance(params);
        setCalendarData(response || []);
        console.log('🔍 DEBUG - Calendar data updated:', response?.length || 0, 'records');
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setCalendarData([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Separate useEffect for Employee Today's Attendance table ONLY
  useEffect(() => {
    if (user?.role === 'employee') {
      fetchEmployeeTableData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empType, empPicker, empStatus, user]);

  // Keep original admin useEffect for admin/HR
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'hr') {
      fetchAdminList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminType, adminPicker, adminStatus]);

  // Separate useEffect for calendar data fetching
  useEffect(() => {
    if (user) {
      fetchCalendarData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarType, calendarPicker, calendarStatus, selectedMonth, selectedYear]);
  const selfToday = (myAttendance || []).find(r => r.date === today);
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
  const lastCheckoutTime = lastClosedSession?.endTime || attendanceStatus?.lastCheckoutTime || '-';
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
  const isEmployee = user?.role === 'employee';
  // Build employee list with employee filters applied
  const employeeRecords = (() => {
    // Use the dedicated employee table data instead of shared myAttendance
    const source = (todayTableData || [])
      .filter(r => r?.date && String(r.date) <= today)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, empEntriesPerPage);

    return source.map((r, idx) => ({
      id: r.id || idx,
      employeeId: '-',
      name: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email,
      department: '-',
      date: r.date,
      checkIn: r.checkIn || '-',
      checkOut: r.date === today ? (lastCheckoutTime || '-') : (r.checkOut || '-'),
      status: r.status || (r.checkIn ? 'present' : 'absent'),
      hours: r.date === today ? formatSec(totalSecondsFromSessions()) : toHoursDisplay(r.hoursWorked, r.checkIn, r.checkOut)
    }));
  })();
  const adminRecords = (allAttendance || []).map(mapToRow)
    .filter(record => (record.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, entriesPerPage);
  const derivedRecords = isEmployee ? employeeRecords : adminRecords;

  // Format yyyy-mm-dd to M/D/YYYY (e.g., 8/26/2025) in local US style
  const fmtUSDate = (iso) => {
    try {
      const d = new Date(`${iso}T00:00:00`);
      return d.toLocaleDateString('en-US');
    } catch { return String(iso); }
  };

  // Summary metrics: Present Today, Absent Today, Late Today (role-aware)
  const activeEmployees = (employees || []).filter(e => (e?.status || 'active') === 'active');
  const todayMy = (myAttendance || []).find(r => r.date === today);
  const adminTodayPresent = (todayTableData || []).filter(r => r?.date === today && r?.checkIn);
  // Prefer backend weekly aggregated data for Admin/HR to keep charts and KPIs consistent
  const weeklyToday = (user?.role === 'admin' || user?.role === 'hr')
    ? (() => {
        const byDate = (weeklyData || []).find(d => d.date === today);
        if (byDate) return byDate;
        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });
        return (weeklyData || []).find(d => d.name === todayName) || null;
      })()
    : null;
  const presentTodayCount = (user?.role === 'employee')
    ? (todayMy?.checkIn ? 1 : 0)
    : (weeklyToday ? weeklyToday.present : new Set(adminTodayPresent.map(r => r.userId || r.employeeId || r.Employee?.id || r.id)).size);
  const absentTodayCount = (user?.role === 'employee')
    ? (presentTodayCount ? 0 : 1)
    : (weeklyToday ? weeklyToday.absent : Math.max(0, activeEmployees.length - presentTodayCount));
  const lateTodayCount = (user?.role === 'employee')
    ? (todayMy?.status === 'late' ? 1 : 0)
    : (weeklyToday ? weeklyToday.late : (todayTableData || []).filter(r => r?.date === today && r?.status === 'late').length);

  // Weekly charts now use backend-provided data in weeklyData

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

  // Add Employee Attendance Handler Functions
  const handleAddAttendanceFormChange = (field, value) => {
    setAddAttendanceForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (addAttendanceError) {
      setAddAttendanceError('');
    }
  };

  const validateAddAttendanceForm = () => {
    const { employeeId, date, checkInTime } = addAttendanceForm;
    
    if (!employeeId) {
      setAddAttendanceError('Please select an employee');
      return false;
    }
    
    if (!date) {
      setAddAttendanceError('Please select a date');
      return false;
    }
    
    if (!checkInTime) {
      setAddAttendanceError('Please enter check-in time');
      return false;
    }

    // Validate date is not in the future
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (selectedDate > today) {
      setAddAttendanceError('Cannot add attendance for future dates');
      return false;
    }

    // Validate check-out time is after check-in time if provided
    if (addAttendanceForm.checkOutTime) {
      const checkIn = new Date(`${date}T${checkInTime}`);
      const checkOut = new Date(`${date}T${addAttendanceForm.checkOutTime}`);
      
      if (checkOut <= checkIn) {
        setAddAttendanceError('Check-out time must be after check-in time');
        return false;
      }
    }

    return true;
  };

  const handleAddAttendanceSubmit = async () => {
    if (!validateAddAttendanceForm()) {
      return;
    }

    setIsAddingAttendance(true);
    setAddAttendanceError('');

    try {
      const { employeeId, date, checkInTime, checkOutTime, description } = addAttendanceForm;
      
      // Format the data for API
      const attendanceData = {
        employeeId,
        date,
        checkIn: checkInTime,
        checkOut: checkOutTime || null,
        description: description || 'Added by HR/Admin',
        status: checkOutTime ? 'present' : 'present' // Will be calculated by backend
      };

      // Call API to add attendance (we'll need to add this endpoint)
      await AttendanceAPI.addEmployeeAttendance(attendanceData);

      // Refresh attendance data
      if (fetchAllAttendance) {
        await fetchAllAttendance();
      }
      if (fetchMyAttendance) {
        await fetchMyAttendance();
      }

      // Reset form and close modal
      setAddAttendanceForm({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        checkInTime: '',
        checkOutTime: '',
        description: ''
      });
      setShowAddAttendanceModal(false);
      
      alert('Employee attendance added successfully!');
      
    } catch (error) {
      console.error('Error adding employee attendance:', error);
      setAddAttendanceError(
        error.response?.data?.message || 
        'Failed to add employee attendance. Please try again.'
      );
    } finally {
      setIsAddingAttendance(false);
    }
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
          {/* Add Employee Attendance Button - Only for HR and Admin */}
          {(user?.role === 'admin' || user?.role === 'hr') && (
            <Button 
              variant="outline" 
              className="flex items-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200" 
              onClick={() => {
                setAddAttendanceForm({
                  employeeId: '',
                  date: new Date().toISOString().split('T')[0],
                  checkInTime: '',
                  checkOutTime: '',
                  description: ''
                });
                setAddAttendanceError('');
                setShowAddAttendanceModal(true);
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Add Employee Attendance</span>
            </Button>
          )}
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

      {/* Work Duration Timer - Only show for employees */}
      {user?.role === 'employee' && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`rounded-full p-3 ${isTimerRunning ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  {isTimerRunning ? (
                    <Play className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <Pause className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {isTimerRunning ? 'Work Duration' : 'Total Worked'}
                  </p>
                  <div className={`text-3xl font-mono font-bold ${isTimerRunning ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {isTimerRunning ? (workDuration || '00:00:00') : (totalWorkedTime || '00:00:00')}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isTimerRunning ? '(running)' : isCheckedIn ? '(paused)' : '(completed)'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  isTimerRunning 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                    : isCheckedIn 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    isTimerRunning ? 'bg-green-500 animate-pulse' : isCheckedIn ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></div>
                  {isTimerRunning ? 'Active' : isCheckedIn ? 'Paused' : 'Stopped'}
                </div>
                {timerStartTime && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Started: {(() => {
                      try {
                        return new Date(timerStartTime).toLocaleTimeString();
                      } catch (error) {
                        return 'Invalid time';
                      }
                    })()}
                  </p>
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
                <BarChart data={weeklyData}>
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

          {/* Late Trends (weekly late arrivals from backend) */}
          <Card>
            <CardHeader>
              <CardTitle>Late Trends</CardTitle>
              <CardDescription>Weekly late arrivals over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => {
                    try {
                      const [Y,M,D] = String(d).split('-').map(Number);
                      const dd = new Date(Y, (M||1)-1, D||1);
                      return dd.toLocaleDateString('en-US', { weekday: 'short' });
                    } catch { return d; }
                  }} />
                  <YAxis />
                  <Tooltip labelFormatter={(d) => {
                    try {
                      const [Y,M,D] = String(d).split('-').map(Number);
                      const dd = new Date(Y, (M||1)-1, D||1);
                      return dd.toLocaleDateString('en-US');
                    } catch { return d; }
                  }} formatter={(value, name) => [value, name === 'late' ? 'Late' : name]} />
                  <Line type="monotone" dataKey="late" name="Late" stroke="#10b981" strokeWidth={2} />
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
            {/* Employee filters */}
            {user?.role === 'employee' && (
              <div className="flex items-center gap-3 flex-nowrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm">Type:</label>
                  <button
                    className={`px-2 py-1 text-sm rounded border ${empType === 'daily' ? 'bg-primary text-white' : 'bg-transparent'}`}
                    onClick={() => setEmpType('daily')}
                    type="button"
                  >Daily</button>
                  <button
                    className={`px-2 py-1 text-sm rounded border ${empType === 'monthly' ? 'bg-primary text-white' : 'bg-transparent'}`}
                    onClick={() => setEmpType('monthly')}
                    type="button"
                  >Monthly</button>
                </div>
                <div>
                  {empType === 'daily' ? (
                    <input
                      aria-label="Pick date"
                      type="date"
                      value={empPicker}
                      onChange={(e) => setEmpPicker(e.target.value)}
                      className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-900"
                    />
                  ) : (
                    <input
                      aria-label="Pick month"
                      type="month"
                      value={/^\d{4}-\d{2}$/.test(empPicker) ? empPicker : empPicker.slice(0,7)}
                      onChange={(e) => setEmpPicker(e.target.value)}
                      className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-900"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Status:</label>
                  <select
                    value={empStatus}
                    onChange={(e) => setEmpStatus(e.target.value)}
                    className="border rounded px-2 pr-6 py-1 text-sm min-w-[120px] bg-white dark:bg-gray-900"
                  >
                    <option value="all">All</option>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Show</label>
                  <select
                    value={empEntriesPerPage}
                    onChange={(e) => setEmpEntriesPerPage(Number(e.target.value))}
                    className="border rounded px-2 pr-6 py-1 text-sm min-w-[72px] bg-white dark:bg-gray-900"
                  >
                    {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Max height roughly equals 4 rows; vertical scroll when more */}
          <div className="overflow-x-auto overflow-y-auto max-h-56 md:max-h-72">
            <table className="w-full min-w-full sm:min-w-[700px] md:min-w-[900px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 h-12">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Employee</th>
                  {isEmployee && (
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Date</th>
                  )}
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
                    <td className="py-6 px-4 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={isEmployee ? 7 : 6}>
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
                    {isEmployee && (
                      <td className="py-3 px-4 text-sm">{fmtUSDate(record.date)}</td>
                    )}
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
                <div className="flex items-center gap-4 text-sm">
                  {totalsLoading ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                      <span>Loading totals...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span>Present: {attendanceTotals.present}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span>Absent: {attendanceTotals.absent}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span>Late: {attendanceTotals.late}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <span>Attendance: {attendanceTotals.attendancePercentage}%</span>
                      </div>
                    </>
                  )}
                </div>
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
                      const toKey = (dt) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
                      const key = toKey(curr);
                      const rec = map.get(key);
                      const status = (rec?.status || '').toLowerCase();
                      const color = status === 'present' ? 'bg-green-500' : status === 'late' ? 'bg-yellow-500' : status === 'absent' ? 'bg-red-500' : '';
                      const isToday = key === toKey(new Date());
                      // Compute hours text from available fields -> normalize to HH:MM:SS
                      const minutesFrom = (n) => {
                        const mins = Number(n);
                        return Number.isFinite(mins) ? mins : null;
                      };
                      const secondsFromDecimalHours = (h) => {
                        const n = Number(h);
                        return Number.isFinite(n) ? Math.max(0, Math.round(n * 3600)) : null;
                      };
                      const normalizeToHMS = (rec) => {
                        // 1) If already formatted like HH:MM or HH:MM:SS
                        if (typeof rec?.hours === 'string' && /\d{1,2}:\d{2}(:\d{2})?/.test(rec.hours)) {
                          const parts = rec.hours.split(':');
                          const hh = parts[0].padStart(2, '0');
                          const mm = (parts[1] || '00').padStart(2, '0');
                          const ss = (parts[2] || '00').padStart(2, '0');
                          return `${hh}:${mm}:${ss}`;
                        }
                        // 2) Decimal hours in hoursWorked (string or number)
                        const secFromHoursWorked = secondsFromDecimalHours(rec?.hoursWorked);
                        if (secFromHoursWorked !== null) return formatSec(secFromHoursWorked);
                        // 3) Minutes-based fields
                        const mins1 = minutesFrom(rec?.hoursWorkedMinutes);
                        if (mins1 !== null) return formatSec(mins1 * 60);
                        const mins2 = minutesFrom(rec?.totalMinutes);
                        if (mins2 !== null) return formatSec(mins2 * 60);
                        // 4) Absent explicitly
                        if ((rec?.status || '').toLowerCase() === 'absent') return '00:00:00';
                        return null;
                      };
                      const hoursText = normalizeToHMS(rec);
                      const title = rec ? (hoursText ? `Hours: ${hoursText}` : (status ? `Hours: 00:00:00` : 'No record')) : 'No record';
                      return (
                        <div
                          key={key}
                          className={`p-2 rounded-lg text-center border dark:border-gray-800 cursor-pointer transition-colors ${isToday ? 'bg-gray-900 text-white dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                          title={title}
                          onClick={() => handleDateClick(key)}
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
                    
                    // If there are sessions, use session-based calculation
                    const sessions = viewStatus?.sessions || [];
                    if (sessions.length > 0) {
                      const secs = isSelfToday
                        ? totalSecondsFromSessions()
                        : totalSecondsFromSessionsGeneric(sessions);
                      return <p className="text-gray-900 dark:text-white font-bold text-lg">{formatSec(secs)}</p>;
                    }
                    
                    // For manually added attendance (no sessions), calculate from checkIn/checkOut
                    const attendance = viewStatus?.attendance || selectedRecord;
                    if (attendance.checkIn && attendance.checkOut) {
                      const checkInTime = attendance.checkIn;
                      const checkOutTime = attendance.checkOut;
                      
                      // Calculate hours from time strings
                      const parseTime = (timeStr) => {
                        if (!timeStr || timeStr === '-') return null;
                        const [hours, minutes, seconds = 0] = timeStr.split(':').map(Number);
                        return hours * 3600 + minutes * 60 + (seconds || 0);
                      };
                      
                      const startSec = parseTime(checkInTime);
                      const endSec = parseTime(checkOutTime);
                      
                      if (startSec !== null && endSec !== null && endSec > startSec) {
                        const totalSecs = endSec - startSec;
                        return <p className="text-gray-900 dark:text-white font-bold text-lg">{formatSec(totalSecs)}</p>;
                      }
                    }
                    
                    // Fallback to 00:00:00 if no valid data
                    return <p className="text-gray-900 dark:text-white font-bold text-lg">00:00:00</p>;
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
                      const sessions = isSelfToday ? todaySessions : (viewStatus?.sessions || []);
                      
                      // If no sessions but we have checkIn/checkOut from manually added attendance, create synthetic session
                      if (sessions.length === 0) {
                        const attendance = viewStatus?.attendance || selectedRecord;
                        if (attendance.checkIn && attendance.checkIn !== '-') {
                          const syntheticSession = {
                            id: 'synthetic-1',
                            startTime: attendance.checkIn,
                            endTime: attendance.checkOut && attendance.checkOut !== '-' ? attendance.checkOut : null,
                            isSynthetic: true
                          };
                          
                          const sSec = parseHMS(syntheticSession.startTime);
                          const eSec = syntheticSession.endTime ? parseHMS(syntheticSession.endTime) : null;
                          const dur = (sSec !== null) ? (eSec !== null ? Math.max(0, eSec - sSec) : 0) : 0;
                          
                          return (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-blue-800 dark:text-blue-300">Manual Entry</span>
                                <span className="text-blue-700 dark:text-blue-300">
                                  {syntheticSession.startTime} → {syntheticSession.endTime || 'No checkout'}
                                </span>
                                <span className="font-medium text-blue-800 dark:text-blue-300">{formatSec(dur)}</span>
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                This attendance was manually added by HR/Admin
                              </div>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm text-gray-500">No sessions</div>
                        );
                      }
                      
                      // Display actual sessions
                      return sessions.map((s, i) => {
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
                      });
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

      {/* Add Employee Attendance Modal */}
      {showAddAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Employee Attendance</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manually add attendance record for an employee</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAddAttendanceModal(false)}
                  disabled={isAddingAttendance}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Error Message */}
              {addAttendanceError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{addAttendanceError}</p>
                </div>
              )}

              {/* Form */}
              <div className="space-y-6">
                {/* Employee Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Select Employee *
                  </label>
                  <select
                    value={addAttendanceForm.employeeId}
                    onChange={(e) => handleAddAttendanceFormChange('employeeId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    disabled={isAddingAttendance}
                  >
                    <option value="">Choose an employee...</option>
                    {(employees || [])
                      .filter(emp => emp?.status === 'active')
                      .map(employee => (
                        <option key={employee.id} value={employee.employeeId}>
                          {employee.name} ({employee.employeeId}) - {employee.email}
                        </option>
                      ))
                    }
                  </select>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Date *
                  </label>
                  <Input
                    type="date"
                    value={addAttendanceForm.date}
                    onChange={(e) => handleAddAttendanceFormChange('date', e.target.value)}
                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                    disabled={isAddingAttendance}
                    className="w-full"
                  />
                </div>

                {/* Time Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Check-in Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Punch In Time *
                    </label>
                    <Input
                      type="time"
                      value={addAttendanceForm.checkInTime}
                      onChange={(e) => handleAddAttendanceFormChange('checkInTime', e.target.value)}
                      disabled={isAddingAttendance}
                      className="w-full"
                    />
                  </div>

                  {/* Check-out Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Timer className="h-4 w-4 inline mr-1" />
                      Punch Out Time
                    </label>
                    <Input
                      type="time"
                      value={addAttendanceForm.checkOutTime}
                      onChange={(e) => handleAddAttendanceFormChange('checkOutTime', e.target.value)}
                      disabled={isAddingAttendance}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty if employee hasn't checked out yet</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={addAttendanceForm.description}
                    onChange={(e) => handleAddAttendanceFormChange('description', e.target.value)}
                    placeholder="Optional notes about this attendance record..."
                    rows={3}
                    disabled={isAddingAttendance}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                  />
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">i</span>
                      </div>
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Important Notes:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>This will create an attendance record that the employee can see</li>
                        <li>The employee will be able to view this attendance in their calendar</li>
                        <li>Punch out time is optional - leave empty for ongoing attendance</li>
                        <li>Cannot add attendance for future dates</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddAttendanceModal(false)}
                  disabled={isAddingAttendance}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddAttendanceSubmit}
                  disabled={isAddingAttendance}
                  className="flex items-center space-x-2"
                >
                  {isAddingAttendance ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Add Attendance</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Details Modal */}
      {showDateDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Attendance Details
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDateDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {dateDetailsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading attendance details...</span>
                </div>
              ) : selectedDateDetails?.error ? (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-2">
                    <XCircle className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{selectedDateDetails.error}</p>
                </div>
              ) : selectedDateDetails?.status === 'present' ? (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="text-green-500 mb-2">
                      <CheckCircle className="h-12 w-12 mx-auto" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Present</h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedDateDetails.data.date}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <Clock className="h-4 w-4" />
                        Punch In
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedDateDetails.data.checkIn || 'N/A'}
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <Timer className="h-4 w-4" />
                        Punch Out
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedDateDetails.data.checkOut || 'Not checked out'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <Clock className="h-4 w-4" />
                      Hours Worked
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedDateDetails.data.hoursWorked ? `${selectedDateDetails.data.hoursWorked} hours` : 'N/A'}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Status
                    </div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedDateDetails.data.status === 'present' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      selectedDateDetails.data.status === 'late' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {selectedDateDetails.data.status?.charAt(0).toUpperCase() + selectedDateDetails.data.status?.slice(1) || 'N/A'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-2">
                    <XCircle className="h-12 w-12 mx-auto" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Absent</h4>
                  <p className="text-gray-600 dark:text-gray-400">{selectedDateDetails?.data?.date}</p>
                  <p className="text-gray-500 dark:text-gray-500 mt-2">
                    {selectedDateDetails?.data?.message || 'On Leave / Absent'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowDateDetailsModal(false)}
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

export default AttendanceManagement;
