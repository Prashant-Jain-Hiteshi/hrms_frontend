import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Calendar, Clock, FileText, TrendingUp, 
  CheckCircle, AlertCircle, BookOpen, DollarSign, Receipt
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getDashboardStats, MOCK_ANNOUNCEMENTS } from '../../data/mockData';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { LeaveAPI, api } from '../../lib/api';
import { expenseReimbursementAPI } from '../../lib/expenseReimbursementApi';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { leaveRequests, tasks, myAttendance, fetchMyAttendance } = useData();
  const stats = getDashboardStats('employee');


  // DOJ-based leave balance state
  const [leaveBalanceMap, setLeaveBalanceMap] = useState({});
  const [leaveBalanceLoading, setLeaveBalanceLoading] = useState(false);

  // Payslip state
  const [recentPayslips, setRecentPayslips] = useState([]);
  const [payslipsLoading, setPayslipsLoading] = useState(false);

  // Expense state
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(false);

  // Load my attendance for current month (for today status and month count)
  useEffect(() => {
    const from = new Date();
    from.setDate(1);
    fetchMyAttendance({ from: from.toISOString().slice(0, 10) });
  }, []);

  // Fetch DOJ-based leave balance
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLeaveBalanceLoading(true);
        const res = await LeaveAPI.myBalance();
        const data = res?.data || {};
        if (mounted) setLeaveBalanceMap(data);
      } catch (e) {
        // no-op; keep UI resilient
      } finally {
        if (mounted) setLeaveBalanceLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch recent payslips when component mounts
  useEffect(() => {
    if (user) {
      fetchRecentPayslips();
      fetchRecentExpenses();
    }
  }, [user]);

  // Get employee-specific data
  const myLeaveRequests = leaveRequests.filter(req => 
    req.employeeId === user?.employeeId || 
    req.employeeId === user?.id || 
    req.name === user?.name
  );
  const myAttendanceSafe = Array.isArray(myAttendance) ? myAttendance : [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const myAttendanceThisMonth = myAttendanceSafe.filter(r => {
    if (!r?.date) return false;
    const d = new Date(r.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const myTasks = tasks.filter(task => task.assignee === user?.name);

  // Calculate employee stats from DOJ-based balance
  const totals = Object.values(leaveBalanceMap || {}).reduce(
    (acc, v) => {
      const item = v || {};
      const total = Number(item.total || 0);
      const used = Number(item.used || 0);
      const remaining = Number(item.remaining || Math.max(0, total - used));
      acc.total += total;
      acc.used += used;
      acc.remaining += remaining;
      return acc;
    },
    { total: 0, used: 0, remaining: 0 }
  );
  const myLeaveBalance = Number(totals.remaining.toFixed(2));
  // Present this month: any day with a check-in (includes 'present' and 'late')
  const attendanceThisMonth = myAttendanceThisMonth.filter(rec => !!rec.checkIn).length;
  const today = new Date().toISOString().slice(0, 10);
  const todayRec = myAttendanceSafe.find(r => r.date === today);
  const presentToday = !!todayRec?.checkIn;
  const pendingTasks = myTasks.filter(task => task.status === 'pending').length;

  const handleApplyLeave = () => {
    navigate('/leave');
  };

  const handleCheckInOut = () => {
    navigate('/attendance');
  };

  const handleViewPayslip = () => {
    navigate('/documents');
  };

  const handlePerformance = () => {
    navigate('/employee/performance');
  };

  // Build weekly chart (current month only) with 4 buckets shown in UI
  const weeks = [
    { name: 'Week 1', present: 0, absent: 0 },
    { name: 'Week 2', present: 0, absent: 0 },
    { name: 'Week 3', present: 0, absent: 0 },
    { name: 'Week 4', present: 0, absent: 0 },
  ];
  myAttendanceThisMonth.forEach((rec) => {
    const d = new Date(rec.date);
    const day = d.getDate();
    const idx = Math.min(3, Math.floor((day - 1) / 7));
    if (rec.checkIn) weeks[idx].present += 1;
    else if (rec.status === 'absent') weeks[idx].absent += 1;
  });
  const attendanceData = weeks;

  const leaveBalanceData = [
    { name: 'Used', value: Number(totals.used.toFixed(2)), color: '#ef4444' },
    { name: 'Available', value: Number(totals.remaining.toFixed(2)), color: '#10b981' },
  ];

  // Function to fetch recent payslips using the correct employee API
  const fetchRecentPayslips = async () => {
    try {
      setPayslipsLoading(true);
      console.log('🔄 Loading recent payslips from employee API...');
      
      // Use the specific employee payslips API endpoint
      const response = await api.get('/payroll/employee/my-payslips');
      
      console.log('✅ Employee payslips data loaded:', response.data);
      
      // Handle different response structures
      const payslipsData = response.data?.payslips || response.data?.data || response.data || [];
      
      // Transform data to match UI format and get only the 3 most recent
      const transformedPayslips = payslipsData
        .sort((a, b) => new Date(b.payrollMonth || b.month) - new Date(a.payrollMonth || a.month)) // Sort by date desc
        .slice(0, 3) // Take only 3 most recent
        .map(payroll => {
          // Extract net salary from nested salary object or root level
          const netSalary = payroll.salary?.netSalary || 
                           payroll.netSalary || 
                           payroll.salary?.netAmount || 
                           payroll.netAmount || 
                           payroll.amount || 
                           0;
          
          return {
            id: payroll.id,
            month: formatPayrollMonth(payroll.payrollMonth || payroll.month),
            amount: `₹${parseFloat(netSalary).toLocaleString('en-IN')}`,
            status: getPayslipStatus(payroll.status),
            payrollMonth: payroll.payrollMonth || payroll.month,
            employeeName: payroll.employee?.name || 'Unknown',
            originalData: payroll // Keep original for debugging
          };
        });
      
      setRecentPayslips(transformedPayslips);
      console.log(`📊 Recent payslips loaded: ${transformedPayslips.length}`);
      
    } catch (error) {
      console.error('❌ Failed to load payslips:', error);
      console.error('🔍 Error details:', error.response?.data);
      // Keep empty array on error
      setRecentPayslips([]);
    } finally {
      setPayslipsLoading(false);
    }
  };

  // Function to fetch recent expenses using the expense reimbursement API
  const fetchRecentExpenses = async () => {
    try {
      setExpensesLoading(true);
      console.log('🔄 Loading recent expenses from API...');
      
      // Use the expense reimbursement API to get employee's requests
      const response = await expenseReimbursementAPI.getMyRequests();
      
      console.log('✅ Employee expenses data loaded:', response);
      
      // Handle different response structures
      const expensesData = response?.requests || response?.data || response || [];
      
      // Transform data to match UI format and get only the 3 most recent
      const transformedExpenses = expensesData
        .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)) // Sort by date desc
        .slice(0, 3) // Take only 3 most recent
        .map(expense => {
          // Extract amount from different possible fields
          const amount = expense.amount || expense.totalAmount || expense.requestedAmount || 0;
          
          return {
            id: expense.id,
            title: expense.description || expense.title || expense.category || 'Expense',
            date: formatExpenseDate(expense.createdAt || expense.date),
            amount: `₹${parseFloat(amount).toLocaleString('en-IN')}`,
            status: getExpenseStatus(expense.status),
            category: expense.category || 'General',
            originalData: expense // Keep original for debugging
          };
        });
      
      setRecentExpenses(transformedExpenses);
      console.log(`📊 Recent expenses loaded: ${transformedExpenses.length}`);
      
    } catch (error) {
      console.error('❌ Failed to load expenses:', error);
      console.error('🔍 Error details:', error.response?.data);
      // Keep empty array on error
      setRecentExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  };

  // Helper function to get expense status
  const getExpenseStatus = (status) => {
    if (!status) return 'Submitted';
    
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved' || statusLower === 'paid') {
      return 'Approved';
    } else if (statusLower === 'pending' || statusLower === 'submitted') {
      return 'Pending';
    } else if (statusLower === 'rejected' || statusLower === 'cancelled') {
      return 'Rejected';
    }
    return status; // Return original if not recognized
  };

  // Helper function to format expense date
  const formatExpenseDate = (dateString) => {
    try {
      if (!dateString) return 'Unknown';
      
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting expense date:', error);
      return dateString || 'Unknown';
    }
  };

  // Helper function to get payslip status
  const getPayslipStatus = (status) => {
    if (!status) return 'Processing';
    
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved' || 
        statusLower === 'paid' || 
        statusLower === 'completed' ||
        statusLower === 'finance_approved' ||
        statusLower === 'hr_approved') {
      return 'Paid';
    } else if (statusLower === 'pending' || 
               statusLower === 'processing' ||
               statusLower === 'hr_pending' ||
               statusLower === 'finance_pending') {
      return 'Pending';
    } else if (statusLower === 'rejected' || 
               statusLower === 'cancelled' ||
               statusLower === 'hr_rejected' ||
               statusLower === 'finance_rejected') {
      return 'Rejected';
    }
    return status; // Return original if not recognized
  };

  // Helper function to format payroll month
  const formatPayrollMonth = (payrollMonth) => {
    try {
      if (!payrollMonth) return 'Unknown';
      
      // Handle different date formats
      let date;
      if (payrollMonth.includes('-')) {
        // Format: YYYY-MM or YYYY-MM-DD
        const [year, month] = payrollMonth.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1);
      } else {
        date = new Date(payrollMonth);
      }
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
    } catch (error) {
      console.error('Error formatting payroll month:', error);
      return payrollMonth || 'Unknown';
    }
  };

  const upcomingTasks = [
    { task: 'Complete React certification', deadline: 'Aug 30', priority: 'high' },
    { task: 'Submit project report', deadline: 'Aug 25', priority: 'medium' },
    { task: 'Team meeting preparation', deadline: 'Aug 24', priority: 'low' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's your overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myLeaveBalance}</div>
            <p className="text-xs text-muted-foreground">Leaves remaining</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceThisMonth}</div>
            <p className="text-xs text-muted-foreground">Today: {presentToday ? 'Present' : 'Absent'}</p>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">To complete</p>
          </CardContent>
        </Card> */}

      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Attendance</CardTitle>
            <CardDescription>Your attendance pattern this month</CardDescription>
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
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leave Balance */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Balance</CardTitle>
            <CardDescription>Annual leave utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leaveBalanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {leaveBalanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {leaveBalanceData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value} days</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Payslips */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payslips</CardTitle>
            <CardDescription>
              {payslipsLoading ? 'Loading...' : `Your salary history (${recentPayslips.length} recent)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payslipsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-2 w-8 h-8"></div>
                      <div>
                        <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                        <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                    <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : recentPayslips.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payslips found</p>
                <p className="text-xs mt-1">Your payslips will appear here once processed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPayslips.map((payslip, index) => (
                  <div 
                    key={payslip.id || index} 
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                    onClick={handleViewPayslip}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`rounded-full p-2 ${
                        payslip.status === 'Paid' ? 'bg-green-100 dark:bg-green-900/20' :
                        payslip.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                        payslip.status === 'Rejected' ? 'bg-red-100 dark:bg-red-900/20' :
                        'bg-gray-100 dark:bg-gray-900/20'
                      }`}>
                        <DollarSign className={`h-4 w-4 ${
                          payslip.status === 'Paid' ? 'text-green-600' :
                          payslip.status === 'Pending' ? 'text-yellow-600' :
                          payslip.status === 'Rejected' ? 'text-red-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{payslip.month}</p>
                        <p className="text-xs text-muted-foreground">{payslip.status}</p>
                      </div>
                    </div>
                    <div className="text-sm font-bold">{payslip.amount}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Your pending assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.map((task, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={handlePerformance}>
                  <div className={`w-3 h-3 rounded-full ${
                    task.priority === 'high' ? 'bg-red-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.task}</p>
                    <p className="text-xs text-muted-foreground">Due: {task.deadline}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>
                  {expensesLoading ? 'Loading...' : `Your submitted expense claims (${recentExpenses.length} recent)`}
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/employee/expenses')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {expensesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-5 h-5"></div>
                      <div>
                        <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                        <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                      <div className="w-12 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentExpenses.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No expense claims found</p>
                <p className="text-xs mt-1">Your expense claims will appear here once submitted</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentExpenses.map((expense, index) => (
                  <div 
                    key={expense.id || index} 
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:opacity-80 transition-colors ${
                      expense.status === 'Approved' ? 'bg-green-50 dark:bg-green-900/20' :
                      expense.status === 'Pending' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                      expense.status === 'Rejected' ? 'bg-red-50 dark:bg-red-900/20' :
                      'bg-gray-50 dark:bg-gray-900/20'
                    }`}
                    onClick={() => navigate('/employee/expenses')}
                  >
                    <div className="flex items-center space-x-3">
                      <Receipt className={`h-5 w-5 ${
                        expense.status === 'Approved' ? 'text-green-600' :
                        expense.status === 'Pending' ? 'text-yellow-600' :
                        expense.status === 'Rejected' ? 'text-red-600' :
                        'text-gray-600'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{expense.title}</p>
                        <p className="text-xs text-muted-foreground">{expense.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{expense.amount}</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        expense.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        expense.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        expense.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {expense.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Company Announcements */}
        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>Latest company updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_ANNOUNCEMENTS.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="border-l-4 border-primary pl-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors">
                  <h4 className="text-sm font-medium">{announcement.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {announcement.content.substring(0, 60)}...
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
          <CardDescription>Common self-service tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              onClick={handleApplyLeave}
              className="flex flex-col items-center p-4 h-auto space-y-2"
            >
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Apply Leave</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCheckInOut}
              className="flex flex-col items-center p-4 h-auto space-y-2"
            >
              <Clock className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Check In/Out</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleViewPayslip}
              className="flex flex-col items-center p-4 h-auto space-y-2"
            >
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">View Payslip</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={handlePerformance}
              className="flex flex-col items-center p-4 h-auto space-y-2"
            >
              <TrendingUp className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Performance</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/expenses')}
              className="flex flex-col items-center p-4 h-auto space-y-2"
            >
              <Receipt className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Submit Expense</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your agenda for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Team Standup Meeting</p>
                  <p className="text-xs text-muted-foreground">9:30 AM - 10:00 AM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Code Review Session</p>
                  <p className="text-xs text-muted-foreground">2:00 PM - 3:00 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* Recent Expenses */}
        {/* <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>Your submitted expense claims</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/expenses')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-center space-x-3">
                  <Receipt className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Travel - Client Meeting</p>
                    <p className="text-xs text-muted-foreground">Dec 20, 2024</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">$245.00</p>
                  <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Pending
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center space-x-3">
                  <Receipt className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Lunch - Team Meeting</p>
                    <p className="text-xs text-muted-foreground">Dec 18, 2024</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">$85.50</p>
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Approved
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center space-x-3">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Office Supplies</p>
                    <p className="text-xs text-muted-foreground">Dec 15, 2024</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">$42.30</p>
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Approved
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>

      {/* Expense Summary Stats */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">$1,245</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-3">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">$245</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">$1,000</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Approved This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
};

export default EmployeeDashboard;
