import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { 
  Users, Calendar, TrendingUp, UserPlus, Clock, 
  CheckCircle, AlertCircle, Star
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getDashboardStats, MOCK_LEAVE_REQUESTS, MOCK_JOB_OPENINGS } from '../../data/mockData';

const HRDashboard = () => {
  const navigate = useNavigate();
  const stats = getDashboardStats('hr');

  const recruitmentData = [
    { name: 'Jan', applications: 45, hired: 8 },
    { name: 'Feb', applications: 52, hired: 12 },
    { name: 'Mar', applications: 38, hired: 6 },
    { name: 'Apr', applications: 61, hired: 15 },
    { name: 'May', applications: 49, hired: 9 },
    { name: 'Jun', applications: 67, hired: 18 },
  ];

  const leaveStatusData = [
    { name: 'Approved', value: 85, color: '#10b981' },
    { name: 'Pending', value: 12, color: '#f59e0b' },
    { name: 'Rejected', value: 3, color: '#ef4444' },
  ];

  const upcomingInterviews = [
    { candidate: 'John Smith', position: 'Senior Developer', time: '10:00 AM', date: 'Today' },
    { candidate: 'Sarah Johnson', position: 'HR Executive', time: '2:00 PM', date: 'Today' },
    { candidate: 'Mike Wilson', position: 'UI Designer', time: '11:00 AM', date: 'Tomorrow' },
  ];

  const topPerformers = [
    { name: 'Alice Cooper', department: 'Engineering', rating: 4.8 },
    { name: 'Bob Martin', department: 'Sales', rating: 4.7 },
    { name: 'Carol Davis', department: 'Marketing', rating: 4.6 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">HR Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your workforce effectively</p>
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
            <p className="text-xs text-muted-foreground">Active workforce</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Interviews</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingInterviews}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingLeaves}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Applications</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newApplications}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruitment Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Recruitment Trends</CardTitle>
            <CardDescription>Applications vs Hires over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={recruitmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="applications" fill="#3b82f6" name="Applications" />
                <Bar dataKey="hired" fill="#10b981" name="Hired" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leave Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests Status</CardTitle>
            <CardDescription>Current month overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaveStatusData.map((status, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: status.color }}></div>
                    <span className="text-sm font-medium">{status.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          backgroundColor: status.color, 
                          width: `${status.value}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold">{status.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Interviews */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Interviews</CardTitle>
            <CardDescription>Scheduled interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingInterviews.map((interview, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="bg-primary/10 rounded-full p-2">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{interview.candidate}</p>
                    <p className="text-xs text-muted-foreground">{interview.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{interview.time}</p>
                    <p className="text-xs text-muted-foreground">{interview.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>This quarter's stars</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-full p-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{performer.name}</p>
                    <p className="text-xs text-muted-foreground">{performer.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{performer.rating}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common HR tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button 
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => navigate('/employees')}
              >
                <UserPlus className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Add New Employee</span>
              </button>
              <button 
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => navigate('/leave')}
              >
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Review Leave Requests</span>
              </button>
              <button 
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => navigate('/performance')}
              >
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Performance Reviews</span>
              </button>
              <button 
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => navigate('/recruitment')}
              >
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Recruitment Tracker</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest HR activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Leave approved for John Doe</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">New application received for Developer position</p>
                <p className="text-xs text-muted-foreground">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Performance review reminder for 5 employees</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRDashboard;
