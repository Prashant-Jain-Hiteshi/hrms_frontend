import React from 'react';
import { Button } from '../../ui/Button';
import { X, User, Calendar, FileText, Star } from 'lucide-react';
import CurrentProjectFeedbackForm from '../Employee/Forms/CurrentProjectFeedbackForm';

const FeedbackFormViewModal = ({ isOpen, onClose, formData }) => {
  if (!isOpen || !formData) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Feedback Form Details
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Read-only view of employee feedback submission
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {/* Employee and Goal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <User className="h-5 w-5 text-gray-500" />
                <h3 className="font-medium text-gray-900 dark:text-white">Employee Information</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">{formData.employeeName}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee ID:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">{formData.employeeId}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <FileText className="h-5 w-5 text-gray-500" />
                <h3 className="font-medium text-gray-900 dark:text-white">Goal Information</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Goal:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">{formData.goalName}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Category:</span>
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {formData.category}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Submitted:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {formatDate(formData.submittedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Form Content */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Feedback Submission
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Employee's feedback and self-assessment details
              </p>
            </div>
            
            {formData.category?.toLowerCase() === 'project work' ? (
              <CurrentProjectFeedbackForm
                goalData={formData}
                existingData={{
                  feedbackData: formData.feedbackData,
                  ratings: formData.ratings
                }}
                onSubmit={() => {}} // No-op for read-only
                onCancel={() => {}} // No-op for read-only
                isSubmitting={false}
                isReadOnly={true}
              />
            ) : (
              <div className="p-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Form Preview Not Available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Preview for "{formData.category}" category is not implemented yet.
                  </p>
                  
                  {/* Show raw data if available */}
                  {formData.feedbackData && (
                    <div className="mt-6 text-left">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Raw Feedback Data:</h4>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(formData.feedbackData, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {formData.ratings && (
                    <div className="mt-4 text-left">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Ratings:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(formData.ratings).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded">
                            <span className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < value ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="ml-1 text-xs text-gray-600">{value}/5</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Review Information (if reviewed) */}
          {formData.status === 'reviewed' && (
            <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="text-lg font-medium text-green-900 dark:text-green-100 mb-3">
                Review Completed
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">Reviewed At:</span>
                  <p className="text-sm text-green-700 dark:text-green-300">{formatDate(formData.reviewedAt)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">Overall Rating:</span>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < (formData.overallRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-green-700 dark:text-green-300">
                      {formData.overallRating || 0}/5
                    </span>
                  </div>
                </div>
              </div>
              {formData.reviewerComments && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">Reviewer Comments:</span>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1 bg-white dark:bg-gray-800 p-3 rounded border">
                    {formData.reviewerComments}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackFormViewModal;
