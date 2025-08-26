import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Users, Clock, Timer, Search, Filter, CheckCircle, XCircle, Eye, Download, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';
import { useData } from '../../contexts/DataContext';

const AttendanceManagement = () => {
  const { user } = useAuth();
  const {
    myAttendance,
    attendanceSummary,
    attendanceLoading,
    fetchMyAttendance,
    fetchAttendanceSummary,
    attendanceCheckIn,
    attendanceCheckOut,
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

  const attendanceData = [
    { name: 'Mon', present: 45, absent: 5, late: 3 },
    { name: 'Tue', present: 48, absent: 2, late: 1 },
    { name: 'Wed', present: 46, absent: 4, late: 2 },
    { name: 'Thu', present: 49, absent: 1, late: 0 },
    { name: 'Fri', present: 47, absent: 3, late: 2 },
  ];

  const handleEditRecord = (recordData) => {
    // For now, local-only edit modal; backend update not implemented here
    setShowEditModal(false);
    setSelectedRecord(null);
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

  useEffect(() => {
    if (user) {
      // Load my attendance for current month and summary for week
      const from = new Date();
      from.setDate(1);
      fetchMyAttendance({ from: from.toISOString().slice(0, 10) });
      fetchAttendanceSummary('week');
      if (user.role === 'admin' || user.role === 'hr') {
        // Load all attendance for today by default
        const today = new Date().toISOString().slice(0, 10);
        fetchAllAttendance({ from: today, to: today });
      }
    }
  }, [user]);

  useEffect(() => {
    // infer checked-in state from today's record
    const today = new Date().toISOString().slice(0, 10);
    const todayRecord = myAttendance?.find((r) => r.date === today);
    if (todayRecord?.checkIn && !todayRecord?.checkOut) {
      setIsCheckedIn(true);
      setCheckInTime(todayRecord.checkIn);
    } else {
      setIsCheckedIn(false);
      setCheckInTime(todayRecord?.checkIn || null);
    }
  }, [myAttendance]);

  const handleCheckIn = async () => {
    const data = await attendanceCheckIn({});
    setIsCheckedIn(true);
    setCheckInTime(data?.checkIn || new Date().toLocaleTimeString());
  };

  const handleCheckOut = async () => {
    await attendanceCheckOut({});
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
  const adminToday = (allAttendance || []).filter(r => r?.date === today);
  const selfToday = (myAttendance || []).find(r => r.date === today);
  const hasCheckedInToday = !!selfToday?.checkIn;
  const hasCheckedOutToday = !!selfToday?.checkOut;
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
  const mapToRow = (r, idx) => ({
    id: r.id || idx,
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
        checkOut: r.checkOut || '-',
        status: r.status || (r.checkIn ? 'present' : 'absent'),
        hours: toHoursDisplay(r.hoursWorked, r.checkIn, r.checkOut)
      }))
    : adminToday.map(mapToRow)
  ).filter(record => (record.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  // Summary metrics: Present Today, Absent Today, Late Today (role-aware)
  const activeEmployees = (employees || []).filter(e => (e?.status || 'active') === 'active');
  const todayMy = (myAttendance || []).find(r => r.date === today);
  const adminTodaySet = new Set(
    (adminToday || [])
      .filter(r => r?.checkIn)
      .map(r => r.userId || r.employeeId || r.Employee?.id || r.id)
  );
  const presentTodayCount = (user?.role === 'employee')
    ? (todayMy?.checkIn ? 1 : 0)
    : adminTodaySet.size;
  const absentTodayCount = (user?.role === 'employee')
    ? (presentTodayCount ? 0 : 1)
    : Math.max(0, activeEmployees.length - presentTodayCount);
  const lateTodayCount = (user?.role === 'employee')
    ? (todayMy?.status === 'late' ? 1 : 0)
    : (adminToday || []).filter(r => r?.status === 'late').length;

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
          <Button variant="default" className="flex items-center space-x-2" onClick={() => alert('Report generation functionality coming soon!')}>
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
                    {isCheckedIn ? `Checked in at ${checkInTime}` : 'Ready to check in?'}
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
                  <Button onClick={() => openConfirm('checkin')} variant="success" className="flex items-center" disabled={hasCheckedInToday} title={hasCheckedInToday ? 'Already checked in today' : 'Check in for today'}>
                    <Clock className="h-4 w-4 mr-2" />
                    Check In
                  </Button>
                ) : (
                  <Button onClick={() => openConfirm('checkout')} variant="destructive" className="flex items-center" disabled={hasCheckedOutToday} title={hasCheckedOutToday ? 'Already checked out today' : 'Check out for today'}>
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

      {/* Attendance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Attendance Overview</CardTitle>
          <CardDescription>Employee attendance patterns for this week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="present" fill="#10b981" name="Present" />
              <Bar dataKey="absent" fill="#ef4444" name="Absent" />
              <Bar dataKey="late" fill="#f59e0b" name="Late" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Today's Attendance Table (employee sees own records; admin/hr keeps mock list for now) */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
          <CardDescription>Real-time attendance tracking for {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
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
                  <tr key={record.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
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
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowViewModal(true);
                        }}
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

      {/* Monthly Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Calendar</CardTitle>
          <CardDescription>Attendance overview for the current month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <div
                key={day}
                className={`p-2 text-center rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  day === new Date().getDate() 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="text-sm">{day}</div>
                <div className="flex justify-center mt-1">
                  {day % 7 !== 0 && day % 6 !== 0 && (
                    <div className={`w-2 h-2 rounded-full ${
                      Math.random() > 0.1 ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                  )}
                </div>
              </div>
            ))}
          </div>
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
      {/* View Attendance Modal */}
      {showViewModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
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
                  <p className="text-gray-900 dark:text-white">{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Check In Time</label>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedRecord.checkIn}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Check Out Time</label>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedRecord.checkOut || 'Not checked out'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hours</label>
                  <p className="text-gray-900 dark:text-white font-bold text-lg">{selectedRecord.hours}</p>
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
              </div>
              
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
    </div>
  );
};

export default AttendanceManagement;
