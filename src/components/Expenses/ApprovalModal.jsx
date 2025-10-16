import React, { useState } from 'react';
import { X, CheckCircle, XCircle, MessageSquare, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

const ApprovalModal = ({ 
  isOpen, 
  onClose, 
  reimbursement, 
  action, // 'approve' or 'reject'
  onSubmit 
}) => {
  const { toast } = useToast();
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (action === 'reject' && !comments.trim()) {
      toast.error('Comments are required when rejecting a reimbursement');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(comments.trim());
      setComments('');
      onClose();
    } catch (error) {
      console.error('Error submitting approval:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (!isOpen || !reimbursement) return null;

  const isApproval = action === 'approve';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {isApproval ? (
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-2">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isApproval ? 'Approve' : 'Reject'} Reimbursement
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Review and {isApproval ? 'approve' : 'reject'} this expense reimbursement request
              </p>
            </div>
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
          {/* Reimbursement Details */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Reimbursement Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Employee Name:</span>
                <p className="font-medium text-gray-900 dark:text-white">{reimbursement.employeeName}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Category:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {reimbursement.category?.categoryName || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Requested Amount:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(reimbursement.amount)}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Approved Amount:</span>
                <p className="font-medium text-green-600">
                  {formatCurrency(reimbursement.approvedAmount)}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Expense Date:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(reimbursement.expenseDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Submitted Date:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(reimbursement.submittedAt).toLocaleDateString()}
                </p>
              </div>
              {reimbursement.vendor && (
                <div className="md:col-span-2">
                  <span className="text-gray-600 dark:text-gray-400">Vendor:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{reimbursement.vendor}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <span className="text-gray-600 dark:text-gray-400">Description:</span>
                <p className="font-medium text-gray-900 dark:text-white">{reimbursement.description}</p>
              </div>
              {reimbursement.businessPurpose && (
                <div className="md:col-span-2">
                  <span className="text-gray-600 dark:text-gray-400">Business Purpose:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{reimbursement.businessPurpose}</p>
                </div>
              )}
            </div>
          </div>

          {/* Warning for Rejection */}
          {!isApproval && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Rejection Notice
                </h4>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                This reimbursement will be rejected and the employee will be notified. 
                Please provide a clear reason for rejection.
              </p>
            </div>
          )}

          {/* Comments Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                <MessageSquare className="inline h-4 w-4 mr-1" />
                Comments {!isApproval && <span className="text-red-500">*</span>}
              </label>
              <textarea
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                rows="4"
                placeholder={
                  isApproval 
                    ? "Add any comments for approval (optional)..."
                    : "Please provide a reason for rejection (required)..."
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                required={!isApproval}
              />
              <p className="text-xs text-gray-500 mt-1">
                {isApproval 
                  ? "Optional comments will be visible to the employee"
                  : "Required comments will help the employee understand the rejection"
                }
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || (!isApproval && !comments.trim())}
                className={
                  isApproval 
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {isApproval ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Reimbursement
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Reimbursement
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;
