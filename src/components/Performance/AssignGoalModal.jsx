import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Users, X, Search, CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { PerformanceAPI } from '../../lib/performanceApi';

const AssignGoalModal = ({ 
  isOpen, 
  onClose, 
  selectedGoal, 
  onAssignmentSuccess 
}) => {
  const { toast } = useToast();
  
  // State management
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [reviewerAssignments, setReviewerAssignments] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});

  // Fetch eligible employees when modal opens
  useEffect(() => {
    if (isOpen && selectedGoal) {
      fetchEligibleEmployees();
      
      // If goal is already assigned, load existing assignments
      if (selectedGoal.status === 'assigned') {
        loadExistingAssignments();
      }
    }
  }, [isOpen, selectedGoal]);

  const fetchEligibleEmployees = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching eligible employees for assignment...');
      
      const response = await PerformanceAPI.goals.getEligibleEmployees();
      const employees = response?.data || [];
      
      console.log('✅ Eligible employees fetched:', employees.length);
      setEligibleEmployees(employees);
    } catch (error) {
      console.error('❌ Error fetching eligible employees:', error);
      toast.error('Failed to load eligible employees');
      setEligibleEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Load existing assignments for update mode
  const loadExistingAssignments = async () => {
    try {
      console.log('📋 Loading existing assignments for goal:', selectedGoal.id);
      
      const response = await PerformanceAPI.goals.getAssignments(selectedGoal.id);
      const assignments = response?.data || [];
      
      console.log('✅ Existing assignments loaded:', assignments.length);
      
      // Convert assignments to selected employees and reviewer assignments
      const selectedEmps = [];
      const reviewerMap = {};
      
      assignments.forEach(assignment => {
        if (assignment.employee) {
          // Create employee object matching the structure from eligible employees
          const employee = {
            id: assignment.employee.id,
            employeeId: assignment.employee.employeeId,
            name: assignment.employee.name,
            department: 'Loading...' // Will be updated when eligible employees load
          };
          
          selectedEmps.push(employee);
          reviewerMap[assignment.employee.id] = assignment.reviewer?.id || '';
        }
      });
      
      setSelectedEmployees(selectedEmps);
      setReviewerAssignments(reviewerMap);
      
      console.log('✅ Pre-selected employees:', selectedEmps.length);
      
    } catch (error) {
      console.error('❌ Error loading existing assignments:', error);
      toast.error('Failed to load existing assignments');
    }
  };

  // Filter employees based on search term
  const filteredEmployees = eligibleEmployees.filter(employee => {
    const name = (employee.name || '').toLowerCase();
    const department = (employee.department || '').toLowerCase();
    const employeeId = (employee.employeeId || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return name.includes(search) || 
           department.includes(search) || 
           employeeId.includes(search);
  });

  // Handle employee selection
  const handleEmployeeSelect = (employee, isSelected) => {
    if (isSelected) {
      setSelectedEmployees(prev => [...prev, employee]);
      // Initialize reviewer assignment
      setReviewerAssignments(prev => ({
        ...prev,
        [employee.id]: ''
      }));
    } else {
      setSelectedEmployees(prev => prev.filter(emp => emp.id !== employee.id));
      // Remove reviewer assignment
      setReviewerAssignments(prev => {
        const newAssignments = { ...prev };
        delete newAssignments[employee.id];
        return newAssignments;
      });
    }
    
    // Clear errors when selection changes
    setErrors(prev => ({
      ...prev,
      employees: null,
      [`reviewer_${employee.id}`]: null
    }));
  };

  // Handle reviewer assignment
  const handleReviewerAssign = (employeeId, reviewerId) => {
    setReviewerAssignments(prev => ({
      ...prev,
      [employeeId]: reviewerId
    }));
    
    // Clear reviewer error
    setErrors(prev => ({
      ...prev,
      [`reviewer_${employeeId}`]: null
    }));
  };

  // Get available reviewers for an employee (exclude the employee themselves)
  const getAvailableReviewers = (employeeId) => {
    return eligibleEmployees.filter(emp => emp.id !== employeeId);
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    
    // Check if at least one employee is selected
    if (selectedEmployees.length === 0) {
      newErrors.employees = 'Please select at least one employee';
    }
    
    // Check if all selected employees have reviewers assigned
    selectedEmployees.forEach(employee => {
      const reviewerId = reviewerAssignments[employee.id];
      if (!reviewerId) {
        newErrors[`reviewer_${employee.id}`] = 'Please assign a reviewer';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      console.log('🎯 Submitting goal assignment...');
      
      // Prepare assignment data
      const assignmentData = {
        assignments: selectedEmployees.map(employee => ({
          employeeId: employee.id,
          reviewerId: reviewerAssignments[employee.id]
        }))
      };
      
      console.log('📋 Assignment data:', assignmentData);
      
      // Submit assignment or update
      const response = selectedGoal.status === 'assigned' 
        ? await PerformanceAPI.goals.updateAssignment(selectedGoal.id, assignmentData)
        : await PerformanceAPI.goals.assign(selectedGoal.id, assignmentData);
      
      console.log('✅ Goal operation completed successfully:', response);
      const successMessage = selectedGoal.status === 'assigned' 
        ? `Goal assignment updated for ${selectedEmployees.length} employee(s) successfully!`
        : `Goal assigned to ${selectedEmployees.length} employee(s) successfully!`;
      toast.success(successMessage);
      
      // Call success callback
      if (onAssignmentSuccess) {
        onAssignmentSuccess(response.data);
      }
      
      // Close modal
      handleClose();
      
    } catch (error) {
      console.error('❌ Error assigning goal:', error);
      const errorMessage = error.response?.data?.message || 'Failed to assign goal';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setSelectedEmployees([]);
    setReviewerAssignments({});
    setSearchTerm('');
    setErrors({});
    setEligibleEmployees([]);
    onClose();
  };

  // Select/Deselect all employees
  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      // Deselect all
      setSelectedEmployees([]);
      setReviewerAssignments({});
    } else {
      // Select all filtered employees
      setSelectedEmployees(filteredEmployees);
      const newAssignments = {};
      filteredEmployees.forEach(emp => {
        newAssignments[emp.id] = '';
      });
      setReviewerAssignments(newAssignments);
    }
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedGoal?.status === 'assigned' ? 'Update Goal Assignment' : 'Assign Goal to Employees'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {selectedGoal?.goalName || selectedGoal?.title}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
            disabled={submitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Goal Info */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Goal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">Category:</span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                    {selectedGoal?.category}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded text-sm">
                    {selectedGoal?.status?.toUpperCase()}
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

          {/* Employee Selection */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Select Employees ({selectedEmployees.length} selected)
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={loading || filteredEmployees.length === 0}
                >
                  {selectedEmployees.length === filteredEmployees.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search employees by name, department, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {errors.employees && (
                <p className="text-red-500 text-sm mt-2">{errors.employees}</p>
              )}
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">Loading employees...</p>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">
                    {searchTerm ? 'No employees found matching your search' : 'No eligible employees available'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-48 md:max-h-60 overflow-y-auto">
                  {filteredEmployees.map((employee) => {
                    const isSelected = selectedEmployees.some(emp => emp.id === employee.id);
                    return (
                      <div
                        key={employee.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                        onClick={() => handleEmployeeSelect(employee, !isSelected)}
                      >
                        <div className="flex items-center">
                          <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {employee.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {employee.employeeId} • {employee.department || 'No Department'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviewer Assignment */}
          {selectedEmployees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Assign Reviewers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedEmployees.map((employee) => {
                    const availableReviewers = getAvailableReviewers(employee.id);
                    const selectedReviewerId = reviewerAssignments[employee.id];
                    const hasError = errors[`reviewer_${employee.id}`];
                    
                    return (
                      <div key={employee.id} className="flex flex-col md:flex-row md:items-center gap-3 p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {employee.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {employee.employeeId} • {employee.department || 'No Department'}
                          </p>
                        </div>
                        
                        <div className="flex-1 max-w-full md:max-w-xs">
                          <select
                            className={`w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${
                              hasError ? 'border-red-500' : ''
                            }`}
                            value={selectedReviewerId}
                            onChange={(e) => handleReviewerAssign(employee.id, e.target.value)}
                          >
                            <option value="">Select Reviewer</option>
                            {availableReviewers.map((reviewer) => (
                              <option key={reviewer.id} value={reviewer.id}>
                                {reviewer.name} ({reviewer.employeeId})
                              </option>
                            ))}
                          </select>
                          {hasError && (
                            <p className="text-red-500 text-xs mt-1">{hasError}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row justify-end gap-3 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={submitting || selectedEmployees.length === 0}
            className="w-full sm:w-auto"
          >
            {submitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                {selectedGoal?.status === 'assigned' ? 'Updating...' : 'Assigning...'}
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                {selectedGoal?.status === 'assigned' 
                  ? `Update Assignment (${selectedEmployees.length})` 
                  : `Assign Goal (${selectedEmployees.length})`
                }
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssignGoalModal;
