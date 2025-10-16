import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { X, AlertCircle, User, Calendar, FileText, CheckCircle } from 'lucide-react';
import { PerformanceAPI } from '../../../lib/performanceApi';
import { useToast } from '../../ui/Toast';
import CurrentProjectFeedbackForm from '../Employee/Forms/CurrentProjectFeedbackForm';
import ReviewForm from './ReviewForm';

const ReviewSubmissionModal = ({ isOpen, onClose, submissionData, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submissionDetails, setSubmissionDetails] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Use existing data directly (no API call needed)
  const loadSubmissionDetails = async () => {
    if (!submissionData) return;

    try {
      setLoading(true);
      console.log('📄 Using existing submission data for review (no API call needed)...');
      console.log('🔍 Existing submission data:', submissionData);
      
      // Use the data directly from the pending reviews API
      setSubmissionDetails(submissionData);
      console.log('✅ Submission details set from existing data');
      
    } catch (error) {
      console.error('❌ Error setting submission details:', error);
      toast.error('Failed to load submission details');
    } finally {
      setLoading(false);
    }
  };

  // Handle review submission
  const handleReviewSubmit = async (reviewData) => {
    if (!submissionData?.submissionId) return;

    try {
      console.log('📝 Submitting review...');
      
      const response = await PerformanceAPI.reviewer.submitReview(
        submissionData.submissionId,
        reviewData
      );
      
      console.log('✅ Review submitted successfully:', response);
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    }
  };

  // Load submission details when modal opens
  useEffect(() => {
    if (isOpen && submissionData) {
      loadSubmissionDetails();
      setShowReviewForm(false);
    }
  }, [isOpen, submissionData]);

  // Handle modal close
  const handleClose = () => {
    setSubmissionDetails(null);
    setShowReviewForm(false);
    onClose();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-6xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {showReviewForm ? 'Submit Review' : 'Review Employee Feedback'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {submissionData?.goalName} • {submissionData?.category}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading submission details...</span>
            </div>
          ) : showReviewForm ? (
            // Review Form
            <ReviewForm
              submissionData={submissionDetails}
              onSubmit={handleReviewSubmit}
              onCancel={() => setShowReviewForm(false)}
            />
          ) : submissionDetails ? (
            <div className="p-4 md:p-6">
              {/* Employee Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-12 w-12">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {submissionDetails.employeeName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Employee ID: {submissionDetails.employeeId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      Submitted: {formatDate(submissionDetails.submittedAt)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <FileText className="h-4 w-4 mr-1" />
                      Status: {submissionDetails.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee's Feedback Form (Read-Only) */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Employee's Feedback Submission
                </h4>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                  {submissionDetails.category?.toLowerCase() === 'project work' ? (
                    <CurrentProjectFeedbackForm
                      goalData={submissionDetails}
                      existingData={{
                        feedbackData: submissionDetails.feedbackData,
                        ratings: submissionDetails.ratings
                      }}
                      onSubmit={() => {}} // No-op for read-only
                      onCancel={() => {}} // No-op for read-only
                      isSubmitting={false}
                      isReadOnly={true}
                    />
                  ) : (
                    <div className="p-6 text-center">
                      <AlertCircle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Form Preview Not Available
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Preview for "{submissionDetails.category}" category is not implemented yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Status */}
              {submissionDetails.status === 'reviewed' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                        Already Reviewed
                      </h3>
                      <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                        <p>Overall Rating: {submissionDetails.overallRating}/5 stars</p>
                        <p>Reviewed on: {formatDate(submissionDetails.reviewedAt)}</p>
                        <p className="mt-2">Comments: {submissionDetails.reviewerComments}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Failed to Load Submission
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Unable to load the submission details. Please try again.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && submissionDetails && submissionDetails.status !== 'reviewed' && !showReviewForm && (
          <div className="flex justify-end gap-3 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Close
            </Button>
            <Button
              onClick={() => setShowReviewForm(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Submit Review
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSubmissionModal;
