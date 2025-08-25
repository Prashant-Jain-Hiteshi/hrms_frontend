import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { 
  FileText, BarChart3, TrendingUp, Plus, Search, Filter, 
  Calendar, Download, Edit, Trash2, Activity, Clock, Eye, XCircle
} from 'lucide-react';
import { Input } from '../ui/Input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const ReportsManagement = () => {
  const { user } = useAuth();
  const { 
    reports, 
    addReport, 
    updateReport, 
    deleteReport,
    getFilteredData,
    canUserPerformAction
  } = useData();
  const [selectedTab, setSelectedTab] = useState('reports');
  const [activeTab, setActiveTab] = useState('reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState({
    name: '',
    category: 'Attendance',
    frequency: 'Monthly',
    description: '',
    parameters: {}
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Get role-based filtered reports
  const userReports = getFilteredData('reports', user?.role, user?.id) || reports;

  const handleReportFormChange = (field, value) => {
    setReportForm(prev => ({ ...prev, [field]: value }));
  };

  const handleReportSubmit = () => {
    if (!reportForm.name || !reportForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    const newReport = {
      ...reportForm,
      createdBy: user?.name || 'Current User',
      lastGenerated: 'Never',
      downloads: 0,
      status: 'active'
    };

    addReport(newReport);
    setReportForm({
      name: '',
      category: 'Attendance',
      frequency: 'Monthly',
      description: '',
      parameters: {}
    });
    setShowReportForm(false);
  };

  const handleEditReport = (report) => {
    setSelectedReport(report);
    setReportForm({
      name: report.name,
      category: report.category,
      frequency: report.frequency,
      description: report.description,
      parameters: report.parameters || {}
    });
    setShowEditModal(true);
  };

  const handleUpdateReport = () => {
    if (!reportForm.name || !reportForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    updateReport(selectedReport.id, {
      name: reportForm.name,
      category: reportForm.category,
      frequency: reportForm.frequency,
      description: reportForm.description,
      parameters: reportForm.parameters
    });
    
    setShowEditModal(false);
    setSelectedReport(null);
    setReportForm({
      name: '',
      category: 'Attendance',
      frequency: 'Monthly',
      description: '',
      parameters: {}
    });
  };

  const handleDeleteReport = (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      deleteReport(reportId);
    }
  };

  const handleGenerateAndDownloadReport = (reportId) => {
    const report = filteredReports.find(r => r.id === reportId);
    if (report) {
      updateReport(reportId, { 
        lastGenerated: new Date().toLocaleDateString(),
        downloads: (report.downloads || 0) + 1
      });
      
      // Simulate report generation and download
      let csvContent = '';
      switch (report.category.toLowerCase()) {
        case 'attendance':
          csvContent = generateAttendanceCSV();
          break;
        case 'payroll':
          csvContent = generatePayrollCSV();
          break;
        case 'performance':
          csvContent = generatePerformanceCSV();
          break;
        case 'leave':
          csvContent = generateLeaveCSV();
          break;
        default:
          csvContent = generateGeneralCSV();
      }
      
      downloadCSV(csvContent, `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  const dashboardMetrics = {
    totalEmployees: 156,
    totalReports: 24,
    reportsGenerated: 89,
    avgResponseTime: '2.3s'
  };

  const reportCategories = [
    { name: 'Attendance', count: 8, color: '#3B82F6' },
    { name: 'Payroll', count: 6, color: '#10B981' },
    { name: 'Performance', count: 4, color: '#F59E0B' },
    { name: 'Leave', count: 3, color: '#EF4444' },
  ];

  const monthlyReports = [
    { month: 'Jan', generated: 15, downloaded: 45 },
    { month: 'Feb', generated: 18, downloaded: 52 },
    { month: 'Mar', generated: 22, downloaded: 38 },
    { month: 'Apr', generated: 16, downloaded: 61 },
    { month: 'May', generated: 20, downloaded: 55 },
    { month: 'Jun', generated: 25, downloaded: 67 }
  ];

  const attendanceData = [
    { department: 'Engineering', present: 85, absent: 5, late: 3 },
    { department: 'Marketing', present: 28, absent: 2, late: 1 },
    { department: 'Sales', present: 22, absent: 1, late: 2 },
    { department: 'HR', present: 8, absent: 0, late: 0 },
    { department: 'Finance', present: 12, absent: 1, late: 0 }
  ];

  const payrollData = [
    { department: 'Engineering', salary: 450000, benefits: 67500, total: 517500 },
    { department: 'Marketing', salary: 180000, benefits: 27000, total: 207000 },
    { department: 'Sales', salary: 160000, benefits: 24000, total: 184000 },
    { department: 'HR', salary: 120000, benefits: 18000, total: 138000 },
    { department: 'Finance', salary: 140000, benefits: 21000, total: 161000 }
  ];

  const performanceData = [
    { rating: 'Excellent', count: 45, percentage: 28.8 },
    { rating: 'Good', count: 67, percentage: 42.9 },
    { rating: 'Average', count: 32, percentage: 20.5 },
    { rating: 'Below Average', count: 12, percentage: 7.7 }
  ];

  const handleGenerateReport = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    // Create CSV content based on report type
    let csvContent = '';
    let filename = '';
    
    switch (report.category) {
      case 'Attendance':
        csvContent = generateAttendanceCSV();
        filename = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'Payroll':
        csvContent = generatePayrollCSV();
        filename = `payroll_report_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'Performance':
        csvContent = generatePerformanceCSV();
        filename = `performance_report_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'Leave':
        csvContent = generateLeaveCSV();
        filename = `leave_report_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      default:
        csvContent = generateGeneralCSV();
        filename = `general_report_${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    downloadCSV(csvContent, filename);
    alert(`Report "${report.name}" generated and downloaded successfully!`);
  };

  const handleDownloadReport = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    // Generate and download the report
    handleGenerateReport(reportId);
  };

  const handleShareReport = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    // Create shareable link (mock implementation)
    const shareUrl = `${window.location.origin}/reports/shared/${reportId}`;
    
    if (navigator.share) {
      navigator.share({
        title: report.name,
        text: report.description,
        url: shareUrl
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Report link copied to clipboard!');
      }).catch(() => {
        alert(`Share this link: ${shareUrl}`);
      });
    }
  };
  
  // CSV generation functions
  const generateAttendanceCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Date', 'Check In', 'Check Out', 'Status', 'Hours'];
    const data = [
      ['EMP001', 'John Doe', 'Engineering', '2024-01-22', '09:00 AM', '06:00 PM', 'Present', '9h 0m'],
      ['EMP002', 'Jane Smith', 'HR', '2024-01-22', '08:30 AM', '05:30 PM', 'Present', '9h 0m'],
      ['EMP003', 'Mike Johnson', 'Finance', '2024-01-22', '09:15 AM', '06:15 PM', 'Present', '9h 0m'],
      ['EMP004', 'Sarah Wilson', 'Engineering', '2024-01-22', '-', '-', 'Absent', '0h 0m']
    ];
    return convertToCSV([headers, ...data]);
  };
  
  const generatePayrollCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Base Salary', 'Allowances', 'Deductions', 'Net Salary'];
    const data = [
      ['EMP001', 'John Doe', 'Engineering', '$5000', '$500', '$200', '$5300'],
      ['EMP002', 'Jane Smith', 'HR', '$4500', '$400', '$180', '$4720'],
      ['EMP003', 'Mike Johnson', 'Finance', '$5200', '$520', '$210', '$5510'],
      ['EMP004', 'Sarah Wilson', 'Engineering', '$4800', '$480', '$190', '$5090']
    ];
    return convertToCSV([headers, ...data]);
  };
  
  const generatePerformanceCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Rating', 'Goals Completed', 'Score', 'Review Date'];
    const data = [
      ['EMP001', 'John Doe', 'Engineering', 'Excellent', '8/10', '92%', '2024-01-15'],
      ['EMP002', 'Jane Smith', 'HR', 'Good', '7/10', '85%', '2024-01-16'],
      ['EMP003', 'Mike Johnson', 'Finance', 'Good', '6/8', '88%', '2024-01-17'],
      ['EMP004', 'Sarah Wilson', 'Engineering', 'Average', '5/10', '75%', '2024-01-18']
    ];
    return convertToCSV([headers, ...data]);
  };
  
  const generateLeaveCSV = () => {
    const headers = ['Employee ID', 'Name', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason'];
    const data = [
      ['EMP001', 'John Doe', 'Annual Leave', '2024-01-25', '2024-01-27', '3', 'Approved', 'Family vacation'],
      ['EMP002', 'Jane Smith', 'Sick Leave', '2024-01-20', '2024-01-21', '2', 'Approved', 'Medical appointment'],
      ['EMP003', 'Mike Johnson', 'Personal Leave', '2024-01-30', '2024-01-30', '1', 'Pending', 'Personal matters'],
      ['EMP004', 'Sarah Wilson', 'Annual Leave', '2024-02-05', '2024-02-09', '5', 'Pending', 'Holiday trip']
    ];
    return convertToCSV([headers, ...data]);
  };
  
  const generateGeneralCSV = () => {
    const headers = ['Metric', 'Value', 'Date'];
    const data = [
      ['Total Employees', '156', '2024-01-22'],
      ['Present Today', '142', '2024-01-22'],
      ['Pending Leaves', '8', '2024-01-22'],
      ['Active Projects', '12', '2024-01-22']
    ];
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

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Generate and manage comprehensive HR reports</p>
        </div>
        {canUserPerformAction('generate_report', user?.role) && (
          <Button 
            variant="default" 
            className="flex items-center space-x-2" 
            onClick={() => setShowReportForm(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Create Report</span>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardMetrics.totalReports}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Reports</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardMetrics.reportsGenerated}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Generated This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-3">
                <Download className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">284</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Downloads</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-3">
                <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardMetrics.avgResponseTime}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Generation Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'reports', label: 'Reports', icon: FileText },
            { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart3 },
            { id: 'insights', label: 'HR Insights', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  <option value="">All Categories</option>
                  <option value="attendance">Attendance</option>
                  <option value="payroll">Payroll</option>
                  <option value="performance">Performance</option>
                  <option value="leave">Leave</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  <option value="">All Frequencies</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
                <Button variant="outline" className="flex items-center space-x-2" onClick={() => alert('Filter functionality coming soon!')}>
                  <Filter className="h-4 w-4" />
                  <span>More Filters</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Report Name</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Category</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Frequency</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Last Generated</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Downloads</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{report.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{report.description}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Created by {report.createdBy}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{report.category}</td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{report.frequency}</td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{report.lastGenerated}</td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{report.downloads}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            report.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {report.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedReport(report);
                                setShowViewModal(true);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleGenerateAndDownloadReport(report.id)}
                              title="Generate"
                            >
                              <Activity className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditReport(report)}
                              title="Edit"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteReport(report.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
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

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Categories</CardTitle>
                <CardDescription>Distribution of reports by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={reportCategories}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {reportCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Report Activity</CardTitle>
              <CardDescription>Reports generated and downloaded over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyReports}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="generated" 
                    stackId="1"
                    stroke="#3B82F6" 
                    fill="#3B82F6"
                    name="Generated" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="downloaded" 
                    stackId="1"
                    stroke="#10B981" 
                    fill="#10B981"
                    name="Downloaded" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Department Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance by Department</CardTitle>
              <CardDescription>Current attendance status across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="present" fill="#10B981" name="Present" />
                  <Bar dataKey="absent" fill="#EF4444" name="Absent" />
                  <Bar dataKey="late" fill="#F59E0B" name="Late" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payroll by Department</CardTitle>
              <CardDescription>Total compensation breakdown by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={payrollData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="salary" fill="#3B82F6" name="Base Salary" />
                  <Bar dataKey="benefits" fill="#8B5CF6" name="Benefits" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    )}

    {/* HR Insights Tab */}
    {activeTab === 'insights' && (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Distribution</CardTitle>
              <CardDescription>Employee performance ratings breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${
                        item.rating === 'Excellent' ? 'bg-green-500' :
                        item.rating === 'Good' ? 'bg-blue-500' :
                        item.rating === 'Average' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium">{item.rating}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.rating === 'Excellent' ? 'bg-green-500' :
                            item.rating === 'Good' ? 'bg-blue-500' :
                            item.rating === 'Average' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key HR Metrics</CardTitle>
              <CardDescription>Important HR indicators and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Employee Retention</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">94.2%</div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <div className="text-sm text-green-600 dark:text-green-400">Average Satisfaction</div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">4.3/5</div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex justify-between items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-400">Training Completion</div>
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">87%</div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )}

      {/* Create Report Modal */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Create New Report</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Report Name</label>
                <Input 
                  placeholder="Enter report name..." 
                  value={reportForm.name}
                  onChange={(e) => handleReportFormChange('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows="3"
                  placeholder="Describe the report purpose and content..."
                  value={reportForm.description}
                  onChange={(e) => handleReportFormChange('description', e.target.value)}
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={reportForm.category}
                    onChange={(e) => handleReportFormChange('category', e.target.value)}
                  >
                    <option value="Attendance">Attendance</option>
                    <option value="Payroll">Payroll</option>
                    <option value="Performance">Performance</option>
                    <option value="Leave">Leave</option>
                    <option value="Recruitment">Recruitment</option>
                    <option value="Training">Training</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={reportForm.frequency}
                    onChange={(e) => handleReportFormChange('frequency', e.target.value)}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowReportForm(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleReportSubmit}>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Report Modal */}
      {showEditModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Edit Report</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Report Name</label>
                <Input 
                  placeholder="Enter report name..." 
                  value={reportForm.name}
                  onChange={(e) => handleReportFormChange('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows="3"
                  placeholder="Describe the report purpose and content..."
                  value={reportForm.description}
                  onChange={(e) => handleReportFormChange('description', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={reportForm.category}
                    onChange={(e) => handleReportFormChange('category', e.target.value)}
                  >
                    <option value="Attendance">Attendance</option>
                    <option value="Payroll">Payroll</option>
                    <option value="Performance">Performance</option>
                    <option value="Leave">Leave</option>
                    <option value="Recruitment">Recruitment</option>
                    <option value="Training">Training</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={reportForm.frequency}
                    onChange={(e) => handleReportFormChange('frequency', e.target.value)}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleUpdateReport}>
                <Edit className="h-4 w-4 mr-2" />
                Update Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {showViewModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedReport.name}</h3>
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
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</label>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedReport.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Frequency</label>
                  <p className="text-gray-900 dark:text-white">{selectedReport.frequency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created By</label>
                  <p className="text-gray-900 dark:text-white">{selectedReport.createdBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Generated</label>
                  <p className="text-gray-900 dark:text-white">{selectedReport.lastGenerated}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Downloads</label>
                  <p className="text-gray-900 dark:text-white">{selectedReport.downloads}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedReport.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {selectedReport.status?.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-900 dark:text-white">{selectedReport.description || 'No description provided.'}</p>
                </div>
              </div>
              
              {selectedReport.parameters && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Parameters</label>
                  <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-900 dark:text-white text-sm">{JSON.stringify(selectedReport.parameters, null, 2)}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button 
                variant="default"
                onClick={() => {
                  setShowViewModal(false);
                  handleEditReport(selectedReport);
                }}
              >
                Edit Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManagement;
