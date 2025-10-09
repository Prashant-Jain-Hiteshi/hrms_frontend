import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../ui/Toast';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2, 
  BarChart3, 
  Eye,
  Download,
  Clock,
  Receipt,
  Building,
  User,
  FileText,
  Settings,
  MessageSquare,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Input } from '../ui/Input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import ExpenseConfig from './ExpenseConfig';
import expenseReimbursementAPI from '../../lib/expenseReimbursementApi';
import ViewReimbursementModal from './ViewReimbursementModal';
import ApprovalModal from './ApprovalModal';

const ExpenseManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    expenses, 
    addExpense, 
    updateExpense, 
    deleteExpense, 
    getFilteredData,
    canUserPerformAction
  } = useData();
  
  // State management
  const [selectedTab, setSelectedTab] = useState('reimbursements');
  const [reimbursements, setReimbursements] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);
  const [showReimbursementViewModal, setShowReimbursementViewModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('approve'); // 'approve' or 'reject'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Chart data state
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(false);
  
  // Tab loading states
  const [tabLoading, setTabLoading] = useState({
    reimbursements: false,
    analytics: false,
    config: false
  });
  
  // Legacy expense form states (keeping for backward compatibility)
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'Travel',
    date: '',
    receipt: null
  });
  const [selectedExpense, setSelectedExpense] = useState(null);
  
  // Load data based on selected tab
  useEffect(() => {
    if (!user) return;

    console.log(`🔍 DEBUG - Tab changed to: ${selectedTab}, User role: ${user.role}`);

    if (selectedTab === 'reimbursements') {
      // Load reimbursements data
      if (user.role === 'hr' || user.role === 'admin') {
        loadReimbursements();
        loadStatistics();
      } else if (user.role === 'finance') {
        loadApprovedReimbursements();
        loadStatistics();
      }
    } else if (selectedTab === 'analytics') {
      // Load analytics data
      if (user.role === 'hr' || user.role === 'admin' || user.role === 'finance') {
        loadStatistics();
        loadChartData();
      }
    }
    // Config tab doesn't need additional API calls as it's self-contained
  }, [selectedTab, user]);

  const loadReimbursements = async () => {
    try {
      setTabLoading(prev => ({ ...prev, reimbursements: true }));
      console.log('🔍 DEBUG - Loading reimbursements...');
      const response = await expenseReimbursementAPI.getAllRequests({
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setReimbursements(response.data || []);
      console.log(`✅ Loaded ${response.data?.length || 0} reimbursements`);
    } catch (error) {
      console.error('Error loading reimbursements:', error);
      toast.error('Failed to load reimbursements');
    } finally {
      setTabLoading(prev => ({ ...prev, reimbursements: false }));
    }
  };

  const loadStatistics = async () => {
    try {
      console.log('🔍 DEBUG - Loading statistics...');
      const response = await expenseReimbursementAPI.getStatistics();
      setStatistics(response.data);
      console.log('✅ Statistics loaded successfully');
    } catch (error) {
      console.error('Error loading statistics:', error);
      toast.error('Failed to load statistics');
    }
  };

  const loadApprovedReimbursements = async () => {
    try {
      setLoading(true);
      const response = await expenseReimbursementAPI.getApprovedRequests();
      setReimbursements(response.data || []);
    } catch (error) {
      console.error('Error loading approved reimbursements:', error);
      toast.error('Failed to load approved reimbursements');
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      setTabLoading(prev => ({ ...prev, analytics: true }));
      setChartsLoading(true);
      console.log('🔍 Loading chart data...');

      // Load monthly trends (last 6 months)
      const trendsResponse = await expenseReimbursementAPI.getMonthlyTrends(6);
      console.log('📊 Monthly trends data:', trendsResponse.data);
      
      // Transform data for charts - Use PAID amounts only
      const transformedTrends = trendsResponse.data.map(item => ({
        month: item.monthName,
        amount: item.paidAmount || 0, // Use paid amount instead of total
        approved: item.paidAmount || 0, // Use paid amount for consistency
        pending: item.counts.pending,
        rejected: item.counts.rejected
      }));
      setMonthlyTrends(transformedTrends);

      // Load category breakdown
      const categoryResponse = await expenseReimbursementAPI.getCategoryBreakdown();
      console.log('🥧 Category breakdown data:', categoryResponse.data);
      
      // Transform data for pie chart - Use PAID amounts only
      const transformedCategories = categoryResponse.data.map(item => ({
        name: item.categoryName,
        value: item.paidAmount || 0, // Use paid amount for pie chart
        color: item.color
      }));
      setCategoryBreakdown(transformedCategories);

      console.log('✅ Chart data loaded successfully');
    } catch (error) {
      console.error('Error loading chart data:', error);
      toast.error('Failed to load chart data');
    } finally {
      setChartsLoading(false);
      setTabLoading(prev => ({ ...prev, analytics: false }));
    }
  };

  // Handle tab switching
  const handleTabChange = (tabId) => {
    console.log(`🔄 Switching to tab: ${tabId}`);
    setSelectedTab(tabId);
  };

  // Reload data when status filter changes
  useEffect(() => {
    if (selectedTab === 'reimbursements' && user) {
      if (user.role === 'hr' || user.role === 'admin') {
        loadReimbursements();
      } else if (user.role === 'finance') {
        loadApprovedReimbursements();
      }
    }
  }, [statusFilter]);

  // Mock data for categories (keeping for backward compatibility)
  const expenseCategories = [
    { id: 1, name: 'Travel', budget: 50000, spent: 32000, limit: 15000 },
    { id: 2, name: 'Meals', budget: 25000, spent: 18500, limit: 8000 },
    { id: 3, name: 'Office Supplies', budget: 15000, spent: 9200, limit: 5000 },
    { id: 4, name: 'Transportation', budget: 20000, spent: 12800, limit: 6000 }
  ];
  

  // Export functionality
  const handleExportExpenses = () => {
    const paidCount = reimbursements.filter(r => r.status === 'paid').length;
    
    if (paidCount === 0) {
      toast.error('No paid reimbursements found to export');
      return;
    }
    
    const csvContent = generateExpenseCSV();
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `paid_reimbursements_${currentDate}.csv`;
    downloadCSV(csvContent, filename);
    toast.success(`${paidCount} paid reimbursements exported successfully!`);
  };

  const generateExpenseCSV = () => {
    // Filter only paid reimbursements for export
    const paidReimbursements = reimbursements.filter(r => r.status === 'paid');
    
    console.log(`🔍 DEBUG - Exporting ${paidReimbursements.length} paid reimbursements`);
    
    const headers = [
      'ID', 
      'Employee', 
      'Employee ID',
      'Category', 
      'Original Amount', 
      'Approved Amount',
      'Expense Date', 
      'Submitted Date',
      'Approved Date',
      'Paid Date',
      'Status', 
      'Description',
      'Business Purpose',
      'Vendor'
    ];
    
    const rows = paidReimbursements.map(reimbursement => [
      reimbursement.id,
      reimbursement.employee?.name || 'N/A',
      reimbursement.employee?.employeeId || 'N/A',
      reimbursement.category?.categoryName || 'N/A',
      `₹${parseFloat(reimbursement.amount || 0).toFixed(2)}`,
      `₹${parseFloat(reimbursement.approvedAmount || 0).toFixed(2)}`,
      new Date(reimbursement.expenseDate).toLocaleDateString('en-IN'),
      new Date(reimbursement.submittedAt).toLocaleDateString('en-IN'),
      reimbursement.approvedAt ? new Date(reimbursement.approvedAt).toLocaleDateString('en-IN') : 'N/A',
      reimbursement.paidAt ? new Date(reimbursement.paidAt).toLocaleDateString('en-IN') : 'N/A',
      reimbursement.status.toUpperCase(),
      reimbursement.description || 'N/A',
      reimbursement.businessPurpose || 'N/A',
      reimbursement.vendor || 'N/A'
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Get filtered expenses based on user role
  const userExpenses = getFilteredData('expenses', user?.role, user?.id) || expenses;

  const handleExpenseFormChange = (field, value) => {
    setExpenseForm(prev => ({ ...prev, [field]: value }));
  };

  const handleExpenseSubmit = () => {
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.date) {
      console.warn('Please fill in all required fields');
      return;
    }

    const newExpense = {
      ...expenseForm,
      amount: parseFloat(expenseForm.amount),
      employeeId: user?.id,
      employee: user?.name || 'Current User',
      receipt: expenseForm.receipt?.name || null
    };

    addExpense(newExpense);
    setExpenseForm({
      description: '',
      amount: '',
      category: 'Travel',
      date: '',
      receipt: null
    });
    setShowExpenseForm(false);
  };

  const handleStatusUpdate = (expenseId, newStatus) => {
    updateExpense(expenseId, { status: newStatus });
  };

  // Reimbursement action handlers
  const handleViewReimbursement = (reimbursement) => {
    setSelectedReimbursement(reimbursement);
    setShowReimbursementViewModal(true);
  };

  const handleApproveReimbursement = (reimbursement) => {
    setSelectedReimbursement(reimbursement);
    setApprovalAction('approve');
    setShowApprovalModal(true);
  };

  const handleRejectReimbursement = (reimbursement) => {
    setSelectedReimbursement(reimbursement);
    setApprovalAction('reject');
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async (comments) => {
    try {
      const status = approvalAction === 'approve' ? 'approved' : 'rejected';
      await expenseReimbursementAPI.updateRequestStatus(
        selectedReimbursement.id,
        status,
        comments
      );
      
      toast.success(`Reimbursement ${status} successfully`);
      setShowApprovalModal(false);
      setSelectedReimbursement(null);
      loadReimbursements(); // Reload the list
      loadStatistics(); // Update statistics
    } catch (error) {
      console.error('Error updating reimbursement status:', error);
      toast.error('Failed to update reimbursement status');
    }
  };

  const handleMarkAsPaid = async (reimbursement, comments = '') => {
    try {
      await expenseReimbursementAPI.markAsPaid(reimbursement.id, comments);
      
      toast.success('Reimbursement marked as paid successfully');
      loadApprovedReimbursements(); // Reload the approved list
      loadStatistics(); // Update statistics
    } catch (error) {
      console.error('Error marking reimbursement as paid:', error);
      toast.error('Failed to mark reimbursement as paid');
    }
  };

  // Legacy expense handlers (keeping for backward compatibility)
  const handleApproveExpense = (expenseId) => {
    updateExpense(expenseId, { status: 'approved', approvedDate: new Date().toISOString().split('T')[0] });
  };

  const handleRejectExpense = (expenseId) => {
    updateExpense(expenseId, { status: 'rejected' });
  };

  const handleDeleteExpense = (expenseId) => {
    console.log('Delete expense requested for ID:', expenseId);
    deleteExpense(expenseId);
  };

  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setExpenseForm({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      receipt: null
    });
    setShowEditModal(true);
  };

  const handleUpdateExpense = () => {
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.date) {
      console.warn('Please fill in all required fields');
      return;
    }

    updateExpense(selectedExpense.id, {
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      date: expenseForm.date
    });
    
    setShowEditModal(false);
    setSelectedExpense(null);
    setExpenseForm({
      description: '',
      amount: '',
      category: 'Travel',
      date: '',
      receipt: null
    });
  };

  // Filter reimbursements based on search term
  const filteredReimbursements = reimbursements.filter(reimbursement => {
    const searchLower = searchTerm.toLowerCase();
    return (
      reimbursement.employeeName?.toLowerCase().includes(searchLower) ||
      reimbursement.employee?.name?.toLowerCase().includes(searchLower) ||
      reimbursement.employee?.employeeId?.toLowerCase().includes(searchLower) ||
      reimbursement.vendor?.toLowerCase().includes(searchLower) ||
      reimbursement.category?.categoryName?.toLowerCase().includes(searchLower) ||
      reimbursement.description?.toLowerCase().includes(searchLower)
    );
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'paid': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {user?.role === 'finance' ? 'Finance - Expense Payments' : 'Expense Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === 'finance' 
              ? 'Review approved reimbursements and process payments' 
              : 'Track and manage employee expenses and reimbursements'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2" onClick={handleExportExpenses}>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          {/* {canUserPerformAction('create_expense', user?.role) && (
            <Button 
              variant="default" 
              className="flex items-center space-x-2"
              onClick={() => setShowExpenseForm(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Add Expense</span>
            </Button>
          )} */}
        </div>
      </div>

      {/* Stats Cards - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics ? formatCurrency(statistics.amounts.total) : '₹0'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Amount</div>
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
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics ? statistics.counts.approved : '0'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Approved</div>
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
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics ? statistics.counts.pending : '0'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-3">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics ? statistics.counts.rejected : '0'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'reimbursements', label: 'Reimbursements', icon: Receipt },
            // { id: 'expenses', label: 'Legacy Expenses', icon: FileText },
            // { id: 'categories', label: 'Categories', icon: Building },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'config', label: 'Config', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
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

      {/* Reimbursements Tab - New HR Interface */}
      {selectedTab === 'reimbursements' && (
        <div className="space-y-6">
          {tabLoading.reimbursements && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading reimbursements...</span>
            </div>
          )}
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by employee name, ID, vendor, category..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <select 
                  className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="paid">Paid</option>
                </select>
                <Button 
                  variant="outline" 
                  className="flex items-center space-x-2" 
                  onClick={loadReimbursements}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reimbursements Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Employee Reimbursement Requests</span>
                <span className="text-sm font-normal text-gray-500">
                  {filteredReimbursements.length} requests
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Loading reimbursements...</span>
                </div>
              ) : filteredReimbursements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mb-2 text-gray-300" />
                  <p>No reimbursement requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Employee</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Category</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Amount</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Date</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Status</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReimbursements.map((reimbursement) => (
                        <tr key={reimbursement.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {reimbursement.employeeName || reimbursement.employee?.name || `Employee ${reimbursement.employeeId?.slice(-4) || 'Unknown'}`}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {reimbursement.employeeId?.slice(-8) || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              <div>
                                <span className="text-sm text-gray-900 dark:text-white font-medium">
                                  {reimbursement.category?.categoryName || 'N/A'}
                                </span>
                                {reimbursement.vendor && (
                                  <p className="text-xs text-gray-500">
                                    Vendor: {reimbursement.vendor}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(reimbursement.amount)}
                              </div>
                              {reimbursement.approvedAmount && (
                                <div className="text-xs text-green-600">
                                  Approved: {formatCurrency(reimbursement.approvedAmount)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(reimbursement.expenseDate).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(reimbursement.status)}`}>
                              {reimbursement.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleViewReimbursement(reimbursement)}
                                title="View Details"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              {reimbursement.status === 'submitted' && (user?.role === 'hr' || user?.role === 'admin') && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => handleApproveReimbursement(reimbursement)}
                                    title="Approve"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleRejectReimbursement(reimbursement)}
                                    title="Reject"
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              {/* Finance: Different buttons based on status */}
                              {user?.role === 'finance' && (
                                <>
                                  {reimbursement.status === 'approved' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-green-600 hover:text-green-700"
                                      onClick={() => handleMarkAsPaid(reimbursement)}
                                      title="Mark as Paid"
                                    >
                                      <DollarSign className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {reimbursement.status === 'paid' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-blue-600 hover:text-blue-700"
                                      disabled
                                      title="Already Paid"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                    </Button>
                                  )}
                                </>
                              )}
                              {/* {reimbursement.approverComments && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-blue-600 hover:text-blue-700"
                                  title="Has Comments"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                </Button>
                              )} */}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Legacy Expenses Tab */}
      {selectedTab === 'expenses' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search expenses..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <select className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  <option value="">All Categories</option>
                  <option value="travel">Travel</option>
                  <option value="meals">Meals</option>
                  <option value="office">Office Supplies</option>
                  <option value="transport">Transportation</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                {/* <Button variant="outline" className="flex items-center space-x-2" onClick={() => console.log('Filter functionality coming soon!')}>
                  <Filter className="h-4 w-4" />
                  <span>More Filters</span>
                </Button> */}
              </div>
            </CardContent>
          </Card>

          {/* Expenses Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Employee</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Category</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Description</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Amount</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Date</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userExpenses.map(expense => (
                      <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{expense.employee || expense.employeeName}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{expense.employeeId || 'EMP-' + expense.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{expense.category}</td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900 dark:text-white">{expense.description}</div>
                          {expense.receipt && (
                            <div className="flex items-center mt-1">
                              <FileText className="h-3 w-3 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">Receipt attached</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-white">
                          ${expense.amount.toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{expense.date}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            expense.status === 'approved' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : expense.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {expense.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setSelectedExpense(expense);
                                setShowViewModal(true);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEditExpense(expense)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {expense.status === 'pending' && (
                              <>
                                {canUserPerformAction('approve_expense', user?.role) && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => handleApproveExpense(expense.id)}
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                )}
                                {canUserPerformAction('approve_expense', user?.role) && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleRejectExpense(expense.id)}
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                )}
                              </>
                            )}
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteExpense(expense.id)}
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

      {/* Categories Tab */}
      {selectedTab === 'categories' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Category</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Budget</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Spent</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Remaining</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Utilization</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Monthly Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseCategories.map((category) => {
                      const remaining = category.budget - category.spent;
                      const utilization = (category.spent / category.budget) * 100;
                      return (
                        <tr key={category.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                                <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="font-medium text-gray-900 dark:text-white">{category.name}</div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                            ${category.budget.toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                            ${category.spent.toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                            ${remaining.toLocaleString()}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    utilization > 90 ? 'bg-red-500' : utilization > 75 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(utilization, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem]">
                                {utilization.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                            ${category.limit.toLocaleString()}
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

      {/* Analytics Tab */}
      {selectedTab === 'analytics' && (
        <div className="space-y-6">
          {tabLoading.analytics && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading analytics data...</span>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Paid Expense Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {chartsLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Loading chart data...</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, '']} />
                      <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} name="Paid Amount" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paid Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {chartsLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Loading chart data...</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Expense Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {chartsLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Loading chart data...</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="approved" stackId="a" fill="#10B981" name="Approved" />
                      <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
                      <Bar dataKey="rejected" stackId="a" fill="#EF4444" name="Rejected" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Config Tab */}
      {selectedTab === 'config' && (
        <ExpenseConfig />
      )}

      {/* Add Expense Form Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Add New Expense</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <Input 
                  placeholder="Enter expense description" 
                  value={expenseForm.description}
                  onChange={(e) => handleExpenseFormChange('description', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount *</label>
                <Input 
                  type="number"
                  placeholder="0.00" 
                  value={expenseForm.amount}
                  onChange={(e) => handleExpenseFormChange('amount', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select 
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  value={expenseForm.category}
                  onChange={(e) => handleExpenseFormChange('category', e.target.value)}
                >
                  <option value="Travel">Travel</option>
                  <option value="Meals">Meals</option>
                  <option value="Office">Office Supplies</option>
                  <option value="Transport">Transportation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <Input 
                  type="date" 
                  value={expenseForm.date}
                  onChange={(e) => handleExpenseFormChange('date', e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowExpenseForm(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleExpenseSubmit}>
                Add Expense
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {showEditModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Edit Expense</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <Input 
                  placeholder="Enter expense description" 
                  value={expenseForm.description}
                  onChange={(e) => handleExpenseFormChange('description', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount *</label>
                <Input 
                  type="number"
                  placeholder="0.00" 
                  value={expenseForm.amount}
                  onChange={(e) => handleExpenseFormChange('amount', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select 
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  value={expenseForm.category}
                  onChange={(e) => handleExpenseFormChange('category', e.target.value)}
                >
                  <option value="Travel">Travel</option>
                  <option value="Meals">Meals</option>
                  <option value="Office">Office Supplies</option>
                  <option value="Transport">Transportation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <Input 
                  type="date" 
                  value={expenseForm.date}
                  onChange={(e) => handleExpenseFormChange('date', e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleUpdateExpense}>
                Update Expense
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Expense Modal */}
      {showViewModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Expense Details</h3>
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
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedExpense.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</label>
                  <p className="text-gray-900 dark:text-white font-bold text-lg">${selectedExpense.amount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</label>
                  <p className="text-gray-900 dark:text-white">{selectedExpense.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date</label>
                  <p className="text-gray-900 dark:text-white">{selectedExpense.date}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee</label>
                  <p className="text-gray-900 dark:text-white">{selectedExpense.employee}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedExpense.status === 'approved' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : selectedExpense.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {selectedExpense.status?.toUpperCase()}
                  </span>
                </div>
              </div>
              
              {selectedExpense.receipt && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Receipt</label>
                  <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-900 dark:text-white">Receipt attached</p>
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
                  handleEditExpense(selectedExpense);
                }}
              >
                Edit Expense
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Reimbursement Modal */}
      {showReimbursementViewModal && selectedReimbursement && (
        <ViewReimbursementModal
          isOpen={showReimbursementViewModal}
          onClose={() => {
            setShowReimbursementViewModal(false);
            setSelectedReimbursement(null);
          }}
          reimbursement={selectedReimbursement}
        />
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedReimbursement && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedReimbursement(null);
          }}
          reimbursement={selectedReimbursement}
          action={approvalAction}
          onSubmit={handleApprovalSubmit}
        />
      )}
    </div>
  );
};

export default ExpenseManagement;
