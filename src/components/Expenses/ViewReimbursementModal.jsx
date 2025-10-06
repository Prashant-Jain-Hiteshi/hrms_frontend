import React from 'react';
import { 
  X, 
  Calendar, 
  DollarSign, 
  Building2, 
  FileText, 
  Download, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  MessageSquare,
  Receipt
} from 'lucide-react';
import { Button } from '../ui/Button';

const ViewReimbursementModal = ({ isOpen, onClose, request }) => {
  if (!isOpen || !request) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'paid': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5" />;
      case 'approved': return <CheckCircle className="h-5 w-5" />;
      case 'paid': return <DollarSign className="h-5 w-5" />;
      case 'rejected': return <XCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
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
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadReceipt = () => {
    if (request.receiptUrl) {
      // In real implementation, this would download the file
      window.open(request.receiptUrl, '_blank');
    }
  };

  const getStatusTimeline = () => {
    const timeline = [
      {
        status: 'submitted',
        label: 'Submitted',
        date: request.submittedAt,
        completed: true,
        icon: <FileText className="h-4 w-4" />
      },
      {
        status: 'approved',
        label: request.status === 'rejected' ? 'Reviewed' : 'Approved',
        date: request.approvedAt,
        completed: ['approved', 'paid', 'rejected'].includes(request.status),
        icon: request.status === 'rejected' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />
      }
    ];

    if (request.status === 'paid') {
      timeline.push({
        status: 'paid',
        label: 'Paid',
        date: request.paidAt,
        completed: true,
        icon: <DollarSign className="h-4 w-4" />
      });
    }

    return timeline;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Reimbursement Request Details
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Request ID: {request.id}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Amount Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border mt-1 ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Requested Amount</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(request.amount)}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {request.status === 'paid' ? 'Paid Amount' : 'Approved Amount'}
              </p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(request.approvedAmount)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {request.category.autoApprovalPercent}% of requested
              </p>
            </div>
          </div>

          {/* Expense Details */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Expense Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center">
                  <Receipt className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {request.category.categoryName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Expense Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(request.expenseDate)}
                    </p>
                  </div>
                </div>

                {request.vendor && (
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Vendor/Merchant</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {request.vendor}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Description</p>
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    {request.description}
                  </p>
                </div>

                {request.businessPurpose && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Business Purpose</p>
                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      {request.businessPurpose}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Receipt */}
          {request.receiptUrl && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Receipt
              </h3>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Receipt Document</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {request.receiptUrl.split('/').pop()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadReceipt}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadReceipt}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Request Timeline
            </h3>
            
            <div className="space-y-4">
              {getStatusTimeline().map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    item.completed 
                      ? 'bg-green-100 border-green-500 text-green-600' 
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${
                        item.completed ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {item.label}
                      </p>
                      {item.date && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDateTime(item.date)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Approver Comments */}
          {request.approverComments && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <MessageSquare className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Approver Comments
                </h3>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-900 dark:text-white">
                  {request.approverComments}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewReimbursementModal;
