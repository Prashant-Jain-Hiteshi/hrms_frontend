import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Users, Building2, Calendar, DollarSign, TrendingUp, 
  Clock, UserPlus, FileText, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useData } from '../../contexts/DataContext';
import { AttendanceAPI } from '../../lib/api';
import { MOCK_ANNOUNCEMENTS } from '../../data/mockData';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { employees, leaveRequests, tasks, allAttendance, allAttendanceLoading, fetchAllAttendance, quickActions } = useData();
  const [presentTodayLocal, setPresentTodayLocal] = React.useState(null);
  
  // Load current week's attendance (Mon-Fri) for charts and stats
  useEffect(() => {
    const now = new Date();
    const day = now.getDay(); // 0-6, Sun=0
    const monday = new Date(now);
    const diffToMon = (day === 0 ? -6 : 1 - day); // if Sun, go back 6 days
    monday.setDate(now.getDate() + diffToMon);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const from = monday.toISOString().slice(0, 10);
    const to = friday.toISOString().slice(0, 10);
    fetchAllAttendance({ from, to });
  }, []);

  // Also fetch today's attendance separately to keep KPI accurate even on weekends
  useEffect(() => {
    (async () => {
      try {
        const todayIso = new Date().toISOString().slice(0, 10);
        const res = await AttendanceAPI.listAll({ from: todayIso, to: todayIso });
        const data = res?.data;
        const rows = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
        const presentSet = new Set(
          rows.filter(r => r?.checkIn).map(r => r.userId || r.employeeId || r.Employee?.id || r.id)
        );
        setPresentTodayLocal(presentSet.size);
      } catch (e) {
        setPresentTodayLocal(null);
      }
    })();
  }, []);
  
  // Calculate real-time dashboard stats from live data
  const activeEmployees = (employees || []).filter(emp => (emp?.status || 'active') === 'active');
  const today = new Date().toISOString().split('T')[0];
  const todaysAttendance = (allAttendance || []).filter(r => r?.date === today);
  const presentTodaySet = new Set(
    todaysAttendance
      .filter(r => r?.checkIn) // has checked in
      .map(r => r.userId || r.employeeId || r.Employee?.id || r.id)
  );
  const presentTodayCount = presentTodayLocal ?? presentTodaySet.size;
  const pendingLeaves = leaveRequests.filter(leave => leave.status === 'pending');
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const newEmployeesThisMonth = activeEmployees.filter(emp => 
    emp.joiningDate && emp.joiningDate.startsWith(thisMonth)
  );

  const stats = {
    totalEmployees: activeEmployees.length,
    presentToday: presentTodayCount,
    absentToday: Math.max(0, activeEmployees.length - presentTodayCount),
    pendingLeaves: pendingLeaves.length,
    pendingTasks: pendingTasks.length,
    newEmployeesThisMonth: newEmployeesThisMonth.length
  };

  // Ensure arrays exist with fallbacks
  const safeLeaveRequests = leaveRequests || [];
  const safeTasks = tasks || [];
  const safeEmployees = employees || [];

  // Build Mon-Fri dataset from real attendance
  const weekDays = (() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    const diffToMon = (day === 0 ? -6 : 1 - day);
    monday.setDate(now.getDate() + diffToMon);
    return Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  })();

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const attendanceData = weekDays.map((d, idx) => {
    const iso = d.toISOString().slice(0, 10);
    const dayRecords = (allAttendance || []).filter(r => r?.date === iso);
    const present = new Set(
      dayRecords
        .filter(r => r?.checkIn)
        .map(r => r.userId || r.employeeId || r.Employee?.id || r.id)
    ).size;
    const totalActive = (employees || []).filter(e => (e?.status || 'active') === 'active').length;
    const absent = Math.max(0, totalActive - present);
    return { name: dayLabels[idx], present, absent };
  });

  const leaveData = [
    { name: 'Jan', leaves: 12 },
    { name: 'Feb', leaves: 8 },
    { name: 'Mar', leaves: 15 },
    { name: 'Apr', leaves: 10 },
    { name: 'May', leaves: 18 },
    { name: 'Jun', leaves: 22 },
  ];

  // Build real Department Distribution from employees list
  const departmentData = React.useMemo(() => {
    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e'];
    const map = new Map();
    (safeEmployees).forEach(emp => {
      const dept = (emp?.department || 'Unassigned').trim();
      map.set(dept, (map.get(dept) || 0) + 1);
    });
    const entries = Array.from(map.entries());
    return entries.map(([name, value], idx) => ({ name, value, color: palette[idx % palette.length] }));
  }, [safeEmployees]);

  const upcomingBirthdays = [
    { name: 'John Doe', date: 'Aug 25', department: 'Engineering' },
    { name: 'Jane Smith', date: 'Aug 27', department: 'HR' },
    { name: 'Mike Johnson', date: 'Aug 30', department: 'Finance' },
  ];

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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
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
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={leaveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="leaves" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
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
              {upcomingBirthdays.map((person, index) => (
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
              ))}
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
              {MOCK_ANNOUNCEMENTS.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="border-l-4 border-primary pl-4">
                  <h4 className="text-sm font-medium">{announcement.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {announcement.content.substring(0, 80)}...
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">{announcement.publishedDate}</p>
                </div>
              ))}
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
            <Button 
              variant="outline" 
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => navigate('/reports')}
            >
              <FileText className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm font-medium">Generate Report</span>
            </Button>
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
          <CardHeader>
            <CardTitle>Pending Leave Requests</CardTitle>
            <CardDescription>Requires your approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
            <CardDescription>Tasks requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500' :
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
