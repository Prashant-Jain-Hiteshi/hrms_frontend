import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { X, AlertCircle } from 'lucide-react';
import { PerformanceAPI } from '../../../lib/performanceApi';
import { useToast } from '../../ui/Toast';
import CurrentProjectFeedbackForm from './Forms/CurrentProjectFeedbackForm';

const FeedbackFormModal = ({ isOpen, onClose, selectedGoal, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState(null);

  // Load existing submission if available
  const loadExistingSubmission = async () => {
    if (!selectedGoal?.goalAssignmentId) return;

    try {
      setLoading(true);
      console.log('📋 Loading existing feedback submission...');
      
      const response = await PerformanceAPI.feedback.getSubmission(selectedGoal.goalAssignmentId);
      
      if (response?.data) {
        setExistingSubmission(response.data);
        console.log('✅ Existing submission loaded:', response.data);
      } else {
        setExistingSubmission(null);
        console.log('ℹ️ No existing submission found');
      }
      
    } catch (error) {
      console.error('❌ Error loading existing submission:', error);
      // Don't show error toast for 404 (no existing submission)
      if (error.response?.status !== 404) {
        toast.error('Failed to load existing submission');
      }
      setExistingSubmission(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (formData) => {
    if (!selectedGoal?.goalAssignmentId) return;

    try {
      setSubmitting(true);
      console.log('📤 Submitting feedback form...');
      
      const response = await PerformanceAPI.feedback.submit(
        selectedGoal.goalAssignmentId,
        formData
      );
      
      console.log('✅ Feedback submitted successfully:', response);
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Load existing submission when modal opens
  useEffect(() => {
    if (isOpen && selectedGoal) {
      loadExistingSubmission();
    }
  }, [isOpen, selectedGoal]);

  // Handle modal close
  const handleClose = () => {
    if (submitting) return; // Prevent closing while submitting
    setExistingSubmission(null);
    onClose();
  };

  // Render appropriate form based on goal category
  const renderForm = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading form...</span>
        </div>
      );
    }

    // Determine form type based on goal category

    switch (selectedGoal?.category?.toLowerCase()) {
      case 'project work':
      case 'current_project':
        return (
          <CurrentProjectFeedbackForm
            goalData={selectedGoal}
            existingData={existingSubmission}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            isSubmitting={submitting}
            isReadOnly={selectedGoal?.feedbackStatus === 'reviewed'}
          />
        );
      
      // Add other form types here in the future
      case 'technical skill':
      case 'technical_skill':
      case 'communication':
      case 'leadership':
      case 'performance':
        return (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Form Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The feedback form for "{selectedGoal?.category}" category is under development.
            </p>
            <Button onClick={handleClose}>
              Close
            </Button>
          </div>
        );
      
      default:
        return (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Unknown Category
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No feedback form available for category: "{selectedGoal?.category}"
            </p>
            <Button onClick={handleClose}>
              Close
            </Button>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedGoal?.feedbackStatus === 'reviewed' ? 'View Feedback' : 'Submit Feedback'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {selectedGoal?.goalName} • {selectedGoal?.category}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {renderForm()}
        </div>
      </div>
    </div>
  );
};

export default FeedbackFormModal;
