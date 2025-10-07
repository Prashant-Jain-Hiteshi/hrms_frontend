import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Eye, 
  X, 
  Filter, 
  Receipt, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  Building2,
  FileText,
  Upload,
  Download
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import ApplyReimbursementModal from './ApplyReimbursementModal';
import ViewReimbursementModal from './ViewReimbursementModal';
import expenseReimbursementAPI from '../../lib/expenseReimbursementApi';

const ExpenseReimbursement = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    thisMonth: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load employee's requests and categories in parallel
      const [requestsResponse, categoriesResponse] = await Promise.all([
        expenseReimbursementAPI.getMyRequests(),
        expenseReimbursementAPI.getActiveCategories()
      ]);

      const requestsData = requestsResponse?.data || requestsResponse || [];
      const categoriesData = categoriesResponse?.data || categoriesResponse || [];

      setRequests(requestsData);
      setCategories(categoriesData);
      
      // Calculate stats from real data
      const totalRequests = requestsData.length;
      const pendingRequests = requestsData.filter(r => r.status === 'submitted').length;
      const approvedRequests = requestsData.filter(r => r.status === 'approved').length;
      const paidRequests = requestsData.filter(r => r.status === 'paid').length;
      const thisMonthPaidRequests = requestsData.filter(r => {
        const expenseDate = new Date(r.expenseDate);
        const currentDate = new Date();
        const isThisMonth = expenseDate.getMonth() === currentDate.getMonth() && 
                           expenseDate.getFullYear() === currentDate.getFullYear();
        const isPaid = r.status === 'paid';
        return isThisMonth && isPaid;
      });

      console.log('🔍 DEBUG - This month PAID requests:', thisMonthPaidRequests);

      const thisMonthAmount = thisMonthPaidRequests.reduce((sum, r) => {
        // Use approvedAmount for paid requests (this is the actual paid amount)
        const amount = r.approvedAmount || 0;
        const parsedAmount = parseFloat(amount);
        console.log(`🔍 DEBUG - Paid Request ${r.id}: approvedAmount=${amount}, parsedAmount=${parsedAmount}`);
        return sum + (isNaN(parsedAmount) ? 0 : parsedAmount);
      }, 0);

      console.log('🔍 DEBUG - Final thisMonthAmount:', thisMonthAmount);

      setStats({
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        paid: paidRequests,
        thisMonth: thisMonthAmount
      });
      
    } catch (error) {
      console.error('Error loading reimbursement data:', error);
      toast.error(error.response?.data?.message || 'Failed to load reimbursement data');
      
      // Set empty state on error
      setRequests([]);
      setCategories([]);
      setStats({
        total: 0,
        pending: 0,
        approved: 0,
        paid: 0,
        thisMonth: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'submitted': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'paid': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
      case 'submitted': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'paid': return <DollarSign className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewRequest = (request) => {
    console.log('🔍 DEBUG - View button clicked for request:', request);
    setSelectedRequest(request);
    setShowViewModal(true);
    console.log('🔍 DEBUG - Modal should open now, showViewModal:', true);
  };

  const handleCancelRequest = async (requestId) => {
    // if (!window.confirm('Are you sure you want to cancel this request?')) {
    //   return;
    // }

    try {
      await expenseReimbursementAPI.cancelRequest(requestId);
      
      // Remove from local state
      setRequests(prev => prev.filter(r => r.id !== requestId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        pending: prev.pending - 1
      }));
      
      toast.success('Request cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel request:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  const handleSubmitRequest = async (submittedRequest) => {
    try {
      // Modal has already submitted the request, just reload data
      console.log('✅ Request submitted successfully:', submittedRequest);
      
      // Reload data to get updated list
      await loadData();
      
      // Success toast is already shown in modal
    } catch (error) {
      console.error('Error reloading data after submission:', error);
      toast.error('Request submitted but failed to refresh list');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Expense Reimbursement
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Submit and track your expense reimbursement requests
          </p>
        </div>
        <Button
          onClick={() => setShowApplyModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Apply for Reimbursement
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <Receipt className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
              <p className="text-2xl font-bold text-blue-600">{stats.paid}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">This Month (Paid)</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.thisMonth)}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setShowApplyModal(true)}
          className="border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            My Reimbursement Requests
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Approved Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(request.expenseDate)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {request.category.categoryName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(request.amount)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatCurrency(request.approvedAmount)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRequest(request)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    {(request.status === 'pending' || request.status === 'submitted') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelRequest(request.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ApplyReimbursementModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        categories={categories}
        onSubmit={handleSubmitRequest}
      />

      <ViewReimbursementModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        reimbursement={selectedRequest}
      />
    </div>
  );
};

export default ExpenseReimbursement;
