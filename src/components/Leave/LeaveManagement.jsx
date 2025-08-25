import React, { useState } from 'react';
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

const LeaveManagement = () => {
  const { user } = useAuth();
  const { leaveRequests, addLeaveRequest, approveLeave, rejectLeave } = useData();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

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
    type: 'Annual Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const handleApplyLeave = () => {
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const startDate = new Date(leaveForm.startDate);
    const endDate = new Date(leaveForm.endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    const newLeaveRequest = {
      employeeId: user.employeeId || user.id,
      name: user.name,
      type: leaveForm.type,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      days: daysDiff,
      status: 'pending',
      reason: leaveForm.reason,
      appliedDate: new Date().toISOString().split('T')[0]
    };

    addLeaveRequest(newLeaveRequest);
    setShowApplyForm(false);
    setLeaveForm({ type: 'Annual Leave', startDate: '', endDate: '', reason: '' });
    alert('Leave request submitted successfully!');
  };

  const handleApprove = (requestId) => {
    approveLeave(requestId);
  };

  const handleReject = (requestId) => {
    rejectLeave(requestId);
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
        {['overview', 'requests', 'policies'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              selectedTab === tab
                ? 'bg-primary text-white shadow-md transform scale-105'
                : 'text-primary hover:text-primary/80 hover:bg-primary/20'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
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

      {/* Requests Tab */}
      {selectedTab === 'requests' && (
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
                <Button variant="outline" className="flex items-center space-x-2" onClick={() => alert('Filter functionality coming soon!')}>
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
                              <div className="font-medium text-gray-900 dark:text-white">{request.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">ID: {request.employeeId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{request.type}</td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div>{request.startDate} to {request.endDate}</div>
                            <div className="text-xs text-gray-500">{request.days} days</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{request.appliedDate}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === 'approved' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : request.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Apply for Leave</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Leave Type</label>
                <select 
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value})}
                >
                  <option>Annual Leave</option>
                  <option>Sick Leave</option>
                  <option>Personal Leave</option>
                  <option>Maternity Leave</option>
                  <option>Emergency Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <Input 
                  type="date" 
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <Input 
                  type="date" 
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows="3"
                  placeholder="Please provide a reason for your leave..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowApplyForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleApplyLeave}>
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Details Modal */}
      {showDetailsModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
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
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee</label>
                <p className="text-gray-900 dark:text-white">{selectedLeave.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Leave Type</label>
                <p className="text-gray-900 dark:text-white">{selectedLeave.type}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Start Date</label>
                  <p className="text-gray-900 dark:text-white">{selectedLeave.startDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">End Date</label>
                  <p className="text-gray-900 dark:text-white">{selectedLeave.endDate}</p>
                </div>
              </div>
              
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
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                }`}>
                  {selectedLeave.status.toUpperCase()}
                </span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Applied Date</label>
                <p className="text-gray-900 dark:text-white">{selectedLeave.appliedDate}</p>
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
