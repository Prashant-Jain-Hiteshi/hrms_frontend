import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Star, Send, X, AlertCircle } from 'lucide-react';
import StarRating from '../Employee/Components/StarRating';
import { useToast } from '../../ui/Toast';

const ReviewForm = ({ submissionData, onSubmit, onCancel }) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    overallRating: 0,
    reviewerComments: ''
  });
  const [errors, setErrors] = useState({});

  // Handle rating change
  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      overallRating: rating
    }));
    
    // Clear error when user provides rating
    if (errors.overallRating) {
      setErrors(prev => ({
        ...prev,
        overallRating: undefined
      }));
    }
  };

  // Handle comments change
  const handleCommentsChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      reviewerComments: value
    }));
    
    // Clear error when user starts typing
    if (errors.reviewerComments) {
      setErrors(prev => ({
        ...prev,
        reviewerComments: undefined
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.overallRating || formData.overallRating < 1 || formData.overallRating > 5) {
      newErrors.overallRating = 'Overall rating is required (1-5 stars)';
    }

    if (!formData.reviewerComments || formData.reviewerComments.trim().length === 0) {
      newErrors.reviewerComments = 'Comments are required';
    } else if (formData.reviewerComments.trim().length < 10) {
      newErrors.reviewerComments = 'Comments must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        overallRating: formData.overallRating,
        reviewerComments: formData.reviewerComments.trim()
      });
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Get rating description
  const getRatingDescription = (rating) => {
    switch (rating) {
      case 1: return 'Poor - Significant improvement needed';
      case 2: return 'Below Average - Some improvement needed';
      case 3: return 'Average - Meets expectations';
      case 4: return 'Good - Exceeds expectations';
      case 5: return 'Excellent - Outstanding performance';
      default: return 'Select a rating';
    }
  };

  return (
    <div className="p-4 md:p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employee Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Employee:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{submissionData?.employeeName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Goal:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{submissionData?.goalName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Category:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{submissionData?.category}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Submitted:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {submissionData?.submittedAt ? new Date(submissionData.submittedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Rating */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Star className="h-5 w-5 mr-2" />
              Overall Performance Rating
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Rate the employee's overall performance for this goal <span className="text-red-500">*</span>
              </label>
              
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-center">
                  <StarRating
                    value={formData.overallRating}
                    onChange={handleRatingChange}
                    size="lg"
                    showValue={true}
                  />
                </div>
                
                <div className="text-center">
                  <p className={`text-sm font-medium ${
                    formData.overallRating > 0 
                      ? formData.overallRating >= 4 
                        ? 'text-green-600 dark:text-green-400'
                        : formData.overallRating >= 3
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-orange-600 dark:text-orange-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {getRatingDescription(formData.overallRating)}
                  </p>
                </div>
              </div>
              
              {errors.overallRating && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.overallRating}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Provide detailed feedback and suggestions <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reviewerComments}
                onChange={handleCommentsChange}
                placeholder="Provide constructive feedback on the employee's performance, achievements, areas for improvement, and suggestions for future development..."
                rows={6}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-vertical ${
                  errors.reviewerComments ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Minimum 10 characters required
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.reviewerComments.length} characters
                </p>
              </div>
              
              {errors.reviewerComments && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.reviewerComments}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Review Guidelines
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Be specific and constructive in your feedback</li>
              <li>• Highlight both strengths and areas for improvement</li>
              <li>• Provide actionable suggestions for future development</li>
              <li>• Consider the employee's role, experience level, and goals</li>
              <li>• Maintain a professional and supportive tone</li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting Review...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Review
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
