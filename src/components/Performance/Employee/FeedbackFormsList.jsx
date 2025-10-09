import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { 
  Search, FileText, Clock, CheckCircle, AlertCircle, 
  Filter, Eye, Edit3, Target
} from 'lucide-react';
import { PerformanceAPI } from '../../../lib/performanceApi';
import { useToast } from '../../ui/Toast';
import FeedbackFormModal from './FeedbackFormModal';

const FeedbackFormsList = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackGoals, setFeedbackGoals] = useState([]);
  const [filteredGoals, setFilteredGoals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Load feedback goals
  const loadFeedbackGoals = async () => {
    try {
      setLoading(true);
      console.log('🎯 Loading feedback goals...');
      
      const response = await PerformanceAPI.feedback.getGoals();
      const goals = response?.data || [];
      
      setFeedbackGoals(goals);
      setFilteredGoals(goals);
      
      console.log('✅ Feedback goals loaded:', goals.length);
      
    } catch (error) {
      console.error('❌ Error loading feedback goals:', error);
      toast.error('Failed to load feedback goals');
      setFeedbackGoals([]);
      setFilteredGoals([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter goals based on search and status
  const filterGoals = () => {
    let filtered = feedbackGoals;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(goal =>
        goal.goalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goal.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goal.assignedBy?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(goal => goal.feedbackStatus === statusFilter);
    }

    setFilteredGoals(filtered);
  };

  // Get status display info
  const getStatusInfo = (status) => {
    switch (status) {
      case 'assigned':
        return {
          label: 'Assigned',
          color: 'text-purple-600 bg-purple-100',
          icon: Target
        };
      case 'not_started':
        return {
          label: 'Not Started',
          color: 'text-gray-600 bg-gray-100',
          icon: AlertCircle
        };
      case 'draft':
        return {
          label: 'Draft',
          color: 'text-orange-600 bg-orange-100',
          icon: Edit3
        };
      case 'submitted':
        return {
          label: 'Submitted',
          color: 'text-blue-600 bg-blue-100',
          icon: Clock
        };
      case 'reviewed':
        return {
          label: 'Reviewed',
          color: 'text-green-600 bg-green-100',
          icon: CheckCircle
        };
      default:
        return {
          label: 'Unknown',
          color: 'text-gray-600 bg-gray-100',
          icon: AlertCircle
        };
    }
  };

  // Handle feedback form submission success
  const handleFeedbackSuccess = () => {
    setShowFeedbackModal(false);
    setSelectedGoal(null);
    loadFeedbackGoals(); // Refresh the list
    toast.success('Feedback submitted successfully!');
  };

  // Load data on component mount
  useEffect(() => {
    loadFeedbackGoals();
  }, []);

  // Filter goals when search term or status filter changes
  useEffect(() => {
    filterGoals();
  }, [searchTerm, statusFilter, feedbackGoals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Feedback Forms
          </CardTitle>
          <CardDescription>
            Submit feedback for your assigned goals and track submission status
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search goals, categories, or assigned by..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="not_started">Not Started</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals List */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Goals</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${filteredGoals.length} goal(s) found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading feedback goals...</p>
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {feedbackGoals.length === 0 ? 'No Goals Assigned' : 'No Goals Found'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feedbackGoals.length === 0 
                  ? 'You have no goals assigned for feedback yet.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Goal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Assigned By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredGoals.map((goal) => {
                    const statusInfo = getStatusInfo(goal.feedbackStatus);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <tr key={goal.goalAssignmentId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {goal.goalName}
                            </div>
                            {goal.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {goal.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {goal.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {goal.assignedBy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {goal.feedbackStatus === 'reviewed' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedGoal(goal);
                                setShowFeedbackModal(true);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedGoal(goal);
                                setShowFeedbackModal(true);
                              }}
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              {goal.feedbackStatus === 'not_started' ? 'Fill' : 'Edit'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Form Modal */}
      {showFeedbackModal && selectedGoal && (
        <FeedbackFormModal
          isOpen={showFeedbackModal}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedGoal(null);
          }}
          selectedGoal={selectedGoal}
          onSuccess={handleFeedbackSuccess}
        />
      )}
    </div>
  );
};

export default FeedbackFormsList;
