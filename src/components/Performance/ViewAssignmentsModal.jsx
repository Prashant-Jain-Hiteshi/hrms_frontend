import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Users, X, Eye, Clock, CheckCircle, AlertTriangle, Calendar
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { PerformanceAPI } from '../../lib/performanceApi';

const ViewAssignmentsModal = ({ 
  isOpen, 
  onClose, 
  selectedGoal 
}) => {
  const { toast } = useToast();
  
  // State management
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch assignments when modal opens
  useEffect(() => {
    if (isOpen && selectedGoal) {
      fetchAssignments();
    }
  }, [isOpen, selectedGoal]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📋 Fetching assignments for goal:', selectedGoal.id);
      
      const response = await PerformanceAPI.goals.getAssignments(selectedGoal.id);
      const assignmentData = response?.data || [];
      
      console.log('✅ Assignments fetched:', assignmentData.length);
      setAssignments(assignmentData);
    } catch (error) {
      console.error('❌ Error fetching assignments:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load assignments';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get status color and icon
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'assigned':
        return {
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
          icon: <Clock className="h-3 w-3" />,
          label: 'Assigned'
        };
      case 'submitted':
        return {
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
          icon: <Eye className="h-3 w-3" />,
          label: 'Submitted'
        };
      case 'reviewed':
        return {
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
          icon: <AlertTriangle className="h-3 w-3" />,
          label: 'Reviewed'
        };
      case 'finalized':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          icon: <CheckCircle className="h-3 w-3" />,
          label: 'Finalized'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
          icon: <Clock className="h-3 w-3" />,
          label: status?.toUpperCase() || 'Unknown'
        };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle modal close
  const handleClose = () => {
    setAssignments([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Goal Assignments
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {selectedGoal?.goalName || selectedGoal?.title}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Goal Info */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Goal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium">Category:</span>
                  <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                    {selectedGoal?.category}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded text-sm">
                    {selectedGoal?.status?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Total Assignments:</span>
                  <span className="ml-2 font-semibold text-blue-600">
                    {assignments.length}
                  </span>
                </div>
              </div>
              {selectedGoal?.description && (
                <div className="mt-3">
                  <span className="text-sm font-medium">Description:</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedGoal.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignments List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Employee Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">Loading assignments...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                  <p className="text-red-500">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchAssignments}
                    className="mt-3"
                  >
                    Retry
                  </Button>
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">No assignments found for this goal</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment, index) => {
                    const statusDisplay = getStatusDisplay(assignment.status);
                    
                    return (
                      <div 
                        key={assignment.id || index} 
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Employee Info */}
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Employee
                            </h4>
                            <p className="text-sm font-semibold mt-1">
                              {assignment.employee?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {assignment.employee?.employeeId}
                            </p>
                          </div>

                          {/* Reviewer Info */}
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Reviewer
                            </h4>
                            <p className="text-sm font-semibold mt-1">
                              {assignment.reviewer?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {assignment.reviewer?.employeeId}
                            </p>
                          </div>

                          {/* Status */}
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Status
                            </h4>
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                                {statusDisplay.icon}
                                <span className="ml-1">{statusDisplay.label}</span>
                              </span>
                            </div>
                          </div>

                          {/* Assignment Date */}
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Assigned Date
                            </h4>
                            <div className="flex items-center mt-1">
                              <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {formatDate(assignment.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Additional Status Dates */}
                        {(assignment.submittedAt || assignment.reviewedAt || assignment.finalizedAt) && (
                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Timeline
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                              {assignment.submittedAt && (
                                <div className="flex items-center">
                                  <Eye className="h-3 w-3 text-purple-500 mr-1" />
                                  <span>Submitted: {formatDate(assignment.submittedAt)}</span>
                                </div>
                              )}
                              {assignment.reviewedAt && (
                                <div className="flex items-center">
                                  <AlertTriangle className="h-3 w-3 text-orange-500 mr-1" />
                                  <span>Reviewed: {formatDate(assignment.reviewedAt)}</span>
                                </div>
                              )}
                              {assignment.finalizedAt && (
                                <div className="flex items-center">
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                  <span>Finalized: {formatDate(assignment.finalizedAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Comments */}
                        {(assignment.employeeComments || assignment.reviewerComments) && (
                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Comments
                            </h5>
                            <div className="space-y-2">
                              {assignment.employeeComments && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                                  <p className="text-xs font-medium text-blue-800 dark:text-blue-400">
                                    Employee Comment:
                                  </p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                    {assignment.employeeComments}
                                  </p>
                                </div>
                              )}
                              {assignment.reviewerComments && (
                                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                                  <p className="text-xs font-medium text-green-800 dark:text-green-400">
                                    Reviewer Comment:
                                  </p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                    {assignment.reviewerComments}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewAssignmentsModal;
