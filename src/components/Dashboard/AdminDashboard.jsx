import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  Users, Building2, Calendar, DollarSign, TrendingUp,
  Clock, UserPlus, FileText, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useData } from '../../contexts/DataContext';
import { AttendanceAPI, EmployeesAPI } from '../../lib/api';
import { LeaveAPI } from '../../lib/leaveApi';
import { MOCK_ANNOUNCEMENTS } from '../../data/mockData';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { quickActions } = useData(); // Only get quickActions from global context
  
  // Dashboard-specific state (not from global context)
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    employees: [],
    departmentData: [],
    loading: true
  });
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [leaveTrendsLoading, setLeaveTrendsLoading] = useState(false);


  // 🎯 OPTIMIZED: Single function to load all essential dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setDashboardData(prev => ({ ...prev, loading: true }));

        // 📊 API Call 1: Get employees (for count + department distribution)
        const employeesPromise = EmployeesAPI.listPaginated({ 
          limit: 100, // Get more records for accurate stats
          status: '', // Get all statuses
          department: '', // Get all departments
          page: 1 
        }).catch(err => {
          console.error('Failed to load employees:', err);
          return { data: { employees: [], pagination: { totalRecords: 0 }, filters: { departments: [], statuses: [] } } };
        });

        // 📊 API Call 2: Get today's attendance (for present count)
        const todayIso = new Date().toISOString().slice(0, 10);
        const todayAttendancePromise = AttendanceAPI.listAll({ 
          from: todayIso, 
          to: todayIso 
        }).catch(err => {
          console.error('Failed to load today\'s attendance:', err);
          return { data: [] };
        });

        // 📊 API Call 3: Get pending leaves (for pending count)
        const pendingLeavesPromise = LeaveAPI.list().catch(err => {
          console.error('Failed to load pending leaves:', err);
          return { data: [] };
        });

        // 📊 API Call 4: Get leave trends (for chart)
        setLeaveTrendsLoading(true);
        const leaveTrendsPromise = LeaveAPI.dashboard.getMonthlyTrends().catch(err => {
          console.error('Failed to load leave trends:', err);
          return { data: { success: false, data: [] } };
        });

        // 🚀 Execute all API calls in parallel
        const [employeesRes, todayAttendanceRes, pendingLeavesRes, leaveTrendsRes] = await Promise.all([
          employeesPromise,
          todayAttendancePromise,
          pendingLeavesPromise,
          leaveTrendsPromise
        ]);

        // 📊 Process employees data from new paginated API
        const employeesData = employeesRes.data?.employees || 
                             (Array.isArray(employeesRes.data) ? employeesRes.data : 
                              (employeesRes.data?.rows ? employeesRes.data.rows : []));
        const activeEmployees = employeesData.filter(emp => (emp.status || 'active') === 'active');
        const totalEmployeesFromPagination = employeesRes.data?.pagination?.totalRecords || employeesData.length;

        // 📊 Process today's attendance
        const todayAttendanceData = Array.isArray(todayAttendanceRes.data) ? todayAttendanceRes.data : 
                                   (todayAttendanceRes.data?.rows ? todayAttendanceRes.data.rows : []);
        const presentTodayCount = new Set(
          todayAttendanceData
            .filter(r => r?.checkIn)
            .map(r => r.userId || r.employeeId || r.Employee?.id || r.id)
        ).size;

        // 📊 Process pending leaves
        const allLeavesData = Array.isArray(pendingLeavesRes.data) ? pendingLeavesRes.data : 
                             (pendingLeavesRes.data?.rows ? pendingLeavesRes.data.rows : []);
        const pendingLeavesData = allLeavesData.filter(leave => leave.status === 'pending');

        // 📊 Process department distribution from both employee data and filters
        const departmentMap = new Map();
        employeesData.forEach(emp => {
          const dept = (emp?.department || 'Unassigned').trim();
          departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1);
        });
        
        // Also include departments from filters that might not have employees in current page
        const availableDepartments = employeesRes.data?.filters?.departments || [];
        availableDepartments.forEach(dept => {
          if (!departmentMap.has(dept)) {
            departmentMap.set(dept, 0); // Will be updated with real count if needed
          }
        });
        
        const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e'];
        const departmentData = Array.from(departmentMap.entries())
          .filter(([name, value]) => value > 0) // Only show departments with employees
          .map(([name, value], idx) => ({ 
            name, 
            value, 
            color: palette[idx % palette.length] 
          }));

        // 📊 Process leave trends
        if (leaveTrendsRes.data?.success && leaveTrendsRes.data?.data) {
          const trendsData = leaveTrendsRes.data.data.map(item => ({
            name: item.month,
            leaves: item.leaves
          }));
          setLeaveData(trendsData);
        } else {
          setLeaveData([]);
        }

        // 📊 Update dashboard state with all processed data
        setDashboardData({
          totalEmployees: totalEmployeesFromPagination, // Use total from pagination for accurate count
          presentToday: presentTodayCount,
          pendingLeaves: pendingLeavesData.length,
          employees: employeesData, // Keep all employees for department calculation
          departmentData,
          loading: false
        });

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setDashboardData(prev => ({ ...prev, loading: false }));
      } finally {
        setLeaveTrendsLoading(false);
      }
    };

    loadDashboardData();
  }, []); // Load once on component mount

  // 📊 Load weekly attendance data separately (Monday to Friday)
  useEffect(() => {
    const loadWeeklyAttendance = async () => {
      try {
        // Calculate Monday to Friday of current week
        const now = new Date();
        const day = now.getDay(); // 0-6, Sun=0
        const monday = new Date(now);
        const diffToMon = (day === 0 ? -6 : 1 - day); // if Sun, go back 6 days
        monday.setDate(now.getDate() + diffToMon);
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);
        
        const from = monday.toISOString().slice(0, 10);
        const to = friday.toISOString().slice(0, 10);

        const weekAttendanceRes = await AttendanceAPI.listAll({ from, to });
        const weekAttendanceData = Array.isArray(weekAttendanceRes.data) ? weekAttendanceRes.data : 
                                  (weekAttendanceRes.data?.rows ? weekAttendanceRes.data.rows : []);

        // Build Mon-Fri dataset
        const weekDays = Array.from({ length: 5 }).map((_, i) => {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          return d;
        });

        const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const attendanceChartData = weekDays.map((d, idx) => {
          const iso = d.toISOString().slice(0, 10);
          const dayRecords = weekAttendanceData.filter(r => r?.date === iso);
          const present = new Set(
            dayRecords
              .filter(r => r?.checkIn)
              .map(r => r.userId || r.employeeId || r.Employee?.id || r.id)
          ).size;
          const totalActive = dashboardData.totalEmployees || 0;
          const absent = Math.max(0, totalActive - present);
          return { name: dayLabels[idx], present, absent };
        });

        setWeeklyAttendanceData(attendanceChartData);
      } catch (error) {
        console.error('Error loading weekly attendance:', error);
        // Fallback to empty data
        setWeeklyAttendanceData([
          { name: 'Mon', present: 0, absent: 0 },
          { name: 'Tue', present: 0, absent: 0 },
          { name: 'Wed', present: 0, absent: 0 },
          { name: 'Thu', present: 0, absent: 0 },
          { name: 'Fri', present: 0, absent: 0 }
        ]);
      }
    };

    // Only load weekly attendance after we have employee count
    if (dashboardData.totalEmployees > 0) {
      loadWeeklyAttendance();
    }
  }, [dashboardData.totalEmployees]); // Load when employee count is available

  // 📊 Use optimized dashboard data instead of global context
  const stats = {
    totalEmployees: dashboardData.totalEmployees,
    presentToday: dashboardData.presentToday,
    absentToday: Math.max(0, dashboardData.totalEmployees - dashboardData.presentToday),
    pendingLeaves: dashboardData.pendingLeaves,
    pendingTasks: 0, // Not needed for dashboard, can be loaded separately if required
    newEmployeesThisMonth: 0 // Can be calculated if needed, but not essential for initial load
  };

  // 📊 Use weekly attendance data from separate API call
  const attendanceData = weeklyAttendanceData;

  // 📊 Use department data from optimized dashboard state
  const departmentData = dashboardData.departmentData;

  const upcomingBirthdays = [
    // { name: 'John Doe', date: 'Aug 25', department: 'Engineering' },
    // { name: 'Jane Smith', date: 'Aug 27', department: 'HR' },
    // { name: 'Mike Johnson', date: 'Aug 30', department: 'Finance' },
  ];

  // Show loading state while data is being fetched
  if (dashboardData.loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Overview of your organization</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading dashboard data...</p>
            <p className="text-sm text-muted-foreground mt-2">Fetching employees, attendance, and leave data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Overview of your organization</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">+{stats.newEmployeesThisMonth} from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.presentToday}</div>
            <p className="text-xs text-muted-foreground">{stats.absentToday} absent today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingLeaves}</div>
            <p className="text-xs text-muted-foreground">Require approval</p>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card> */}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Attendance</CardTitle>
            <CardDescription>Employee attendance for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
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

        {/* Leave Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Trends</CardTitle>
            <CardDescription>Monthly leave requests over time</CardDescription>
          </CardHeader>
          <CardContent>
            {leaveTrendsLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading leave trends...</p>
                </div>
              </div>
            ) : leaveData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-sm text-muted-foreground">No leave data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={leaveData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="leaves" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Employee count by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {departmentData.map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }}></div>
                    <span className="text-sm">{dept.name}</span>
                  </div>
                  <span className="text-sm font-medium">{dept.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Birthdays</CardTitle>
            <CardDescription>This week's celebrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBirthdays.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  No upcoming birthdays this week
                </p>
              ) : (
                upcomingBirthdays.map((person, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{person.name}</p>
                      <p className="text-xs text-muted-foreground">{person.department}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{person.date}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>

        </Card>

        {/* Recent Announcements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
            <CardDescription>Latest company updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_ANNOUNCEMENTS.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                   No announcements available
                </p>
              ) : (
                MOCK_ANNOUNCEMENTS.slice(0, 3).map((announcement) => (
                  <div
                    key={announcement.id}
                    className="border-l-4 border-primary pl-4"
                  >
                    <h4 className="text-sm font-medium">{announcement.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {announcement.content.substring(0, 80)}...
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {announcement.publishedDate}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => navigate('/employees')}
            >
              <UserPlus className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm font-medium">Add Employee</span>
            </Button>
            {/* <Button
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => navigate('/reports')}
            >
              <FileText className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm font-medium">Generate Report</span>
            </Button> */}
            <Button
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => navigate('/leave')}
            >
              <Calendar className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm font-medium">Approve Leaves</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => navigate('/payroll')}
            >
              <DollarSign className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm font-medium">Payroll</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          {/* <CardHeader>
            <CardTitle>Pending Leave Requests</CardTitle>
            <CardDescription>Requires your approval</CardDescription>
          </CardHeader>
          <CardContent> */}
            {/* <div className="space-y-3">
              {pendingLeaves.slice(0, 5).map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-full p-2">
                      <Calendar className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{leave.name}</p>
                      <p className="text-xs text-muted-foreground">{leave.type} - {leave.days} days</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="success" onClick={() => quickActions.approveLeave(leave.id)}>
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => quickActions.rejectLeave(leave.id)}>
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent> */}
        </Card>

        <Card>
          {/* <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
            <CardDescription>Tasks requiring attention</CardDescription>
          </CardHeader> */}
          {/* <CardContent>
            <div className="space-y-3">
              {pendingTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${task.priority === 'high' ? 'bg-red-500' :
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">Assigned to: {task.assignee}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => quickActions.completeTask(task.id)}>
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent> */}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
