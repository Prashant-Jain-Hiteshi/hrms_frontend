import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Target, TrendingUp, Award, Calendar, Users, 
  Plus, Search, Filter, Eye, Star, BarChart3,
  CheckCircle, Clock, AlertCircle, Download, Trash2, AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../ui/Toast';
import { PerformanceAPI } from '../../lib/performanceApi';
import AssignGoalModal from './AssignGoalModal';
import ViewAssignmentsModal from './ViewAssignmentsModal';
import FeedbackFormsManagement from './Admin/FeedbackFormsManagement';

const PerformanceManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    goals, 
    reviews, 
    addGoal, 
    updateGoal, 
    deleteGoal, 
    addReview, 
    deleteReview,
    getFilteredData,
    canUserPerformAction
  } = useData();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEditGoalModal, setShowEditGoalModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewAssignmentsModal, setShowViewAssignmentsModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Export functionality
  const handleExportPerformance = async () => {
    try {
      setExportLoading(true);
      console.log('📊 Exporting performance data...');
      toast.success('Preparing export...');
      
      // Fetch feedback forms data from backend
      const response = await PerformanceAPI.admin.getAllFeedbackSubmissions();
      const feedbackData = response?.data || response || [];
      
      console.log('📊 Feedback data fetched for export:', feedbackData.length);
      
      if (feedbackData.length === 0) {
        toast.error('No feedback data available to export');
        return;
      }
      
      const csvContent = generatePerformanceCSV(feedbackData);
      const filename = `performance_feedback_report_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
      
      toast.success(`Exported ${feedbackData.length} feedback records successfully!`);
      
    } catch (error) {
      console.error('❌ Error exporting performance data:', error);
      toast.error('Failed to export performance data');
    } finally {
      setExportLoading(false);
    }
  };

  const generatePerformanceCSV = (feedbackData) => {
    // CSV Headers - only essential feedback details
    const headers = [
      'Employee Name',
      'Employee ID', 
      'Goal Name',
      'Goal Category',
      'Submission Status',
      'Submitted Date',
      'Final Review Rating',
      'Reviewer Comments',
      'Review Date',
      'Overall Performance Score'
    ];
    
    // Generate rows with essential feedback data only
    const rows = feedbackData.map(feedback => {
      // Calculate overall performance score from ratings
      const ratings = feedback.ratings || {};
      const ratingValues = Object.values(ratings).filter(val => typeof val === 'number');
      const avgRating = ratingValues.length > 0 
        ? (ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length).toFixed(1)
        : 'N/A';
      
      return [
        feedback.employeeName || 'N/A',
        feedback.employeeId || 'N/A',
        feedback.goalName || 'N/A',
        feedback.category || 'N/A',
        feedback.status || 'N/A',
        feedback.submittedAt ? new Date(feedback.submittedAt).toLocaleDateString() : 'N/A',
        feedback.overallRating || 'Not Reviewed',
        feedback.reviewerComments ? `"${feedback.reviewerComments.replace(/"/g, '""')}"` : 'No Comments',
        feedback.reviewedAt ? new Date(feedback.reviewedAt).toLocaleDateString() : 'Not Reviewed',
        avgRating
      ];
    });
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const [selectedReview, setSelectedReview] = useState(null);
  const [goalForm, setGoalForm] = useState({
    goalName: '',
    description: '',
    category: 'Project Work'
  });
  const [goalFormLoading, setGoalFormLoading] = useState(false);
  const [goalFormErrors, setGoalFormErrors] = useState({});
  const [realGoals, setRealGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsError, setGoalsError] = useState(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byStatus: 0,
    byCategory: 0
  });
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  const performanceData = [
    { month: 'Jan', performance: 85, goals: 90 },
    { month: 'Feb', performance: 88, goals: 85 },
    { month: 'Mar', performance: 92, goals: 88 },
    { month: 'Apr', performance: 87, goals: 90 },
    { month: 'May', performance: 94, goals: 92 },
    { month: 'Jun', performance: 91, goals: 89 }
  ];

  const teamPerformance = [
    { name: 'Engineering', current: 92, target: 90 },
    { name: 'Sales', current: 88, target: 85 },
    { name: 'Marketing', current: 85, target: 88 },
    { name: 'Design', current: 94, target: 90 },
    { name: 'HR', current: 87, target: 85 }
  ];

  // Use real goals from backend for Admin/HR, fallback to mock for others
  const userGoals = (user?.role === 'admin' || user?.role === 'hr') 
    ? realGoals 
    : getFilteredData('goals', user?.role, user?.id) || goals;
  const userReviews = getFilteredData('reviews', user?.role, user?.id) || reviews;

  const totalGoals = userGoals.length;
  const completedGoals = userGoals.filter(goal => goal.status === 'completed').length;
  const inProgressGoals = userGoals.filter(goal => goal.status === 'in-progress').length;
  const averageProgress = userGoals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / totalGoals || 0;

  const totalReviews = userReviews.length;
  const completedReviews = userReviews.filter(review => review.status === 'completed').length;
  const averageRating = userReviews
    .filter(review => review.status === 'completed')
    .reduce((sum, review) => sum + (review.overallRating || 0), 0) / completedReviews || 0;

  const skillsData = [
    { skill: 'Technical Skills', current: 85, target: 90 },
    { skill: 'Communication', current: 92, target: 85 },
    { skill: 'Leadership', current: 78, target: 80 },
    { skill: 'Problem Solving', current: 88, target: 85 },
    { skill: 'Teamwork', current: 94, target: 90 },
    { skill: 'Innovation', current: averageProgress },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in-progress':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      console.log('Delete goal requested for ID:', goalId);
      await PerformanceAPI.goals.delete(goalId);
      toast.success('Performance goal deleted successfully!');
      
      // Refresh goals list
      fetchGoals();
    } catch (error) {
      console.error('❌ Error deleting performance goal:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete performance goal';
      toast.error(errorMessage);
    }
  };

  const handleReviewUpdate = (reviewId, updates) => {
    updateReview(reviewId, updates);
  };

  // Fetch real goals from backend
  const fetchGoals = async () => {
    try {
      setGoalsLoading(true);
      setGoalsError(null);
      console.log('🔍 Fetching performance goals...');
      
      const response = await PerformanceAPI.goals.getAll();
      const goalsData = response.data || [];
      
      console.log('✅ Performance goals loaded:', goalsData);
      setRealGoals(goalsData);
      
    } catch (error) {
      console.error('❌ Error fetching performance goals:', error);
      setGoalsError('Failed to load performance goals');
      toast.error('Failed to load performance goals from server');
    } finally {
      setGoalsLoading(false);
    }
  };

  // Fetch performance statistics
  const fetchStatistics = async () => {
    try {
      setStatisticsLoading(true);
      console.log('📊 Fetching performance statistics...');
      
      const response = await PerformanceAPI.goals.getStatistics();
      const statsData = response.data || {};
      
      console.log('✅ Performance statistics loaded:', statsData);
      setStatistics(statsData);
      
    } catch (error) {
      console.error('❌ Error fetching performance statistics:', error);
      // Keep default values on error
    } finally {
      setStatisticsLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'hr')) {
      fetchGoals();
      fetchStatistics();
    }
  }, [user]);

  const handleGoalSubmit = async () => {
    // Reset errors
    setGoalFormErrors({});
    
    // Validate required fields
    const errors = {};
    if (!goalForm.goalName?.trim()) {
      errors.goalName = 'Goal name is required';
    } else if (goalForm.goalName.length < 3) {
      errors.goalName = 'Goal name must be at least 3 characters long';
    } else if (goalForm.goalName.length > 100) {
      errors.goalName = 'Goal name cannot exceed 100 characters';
    }
    
    if (!goalForm.description?.trim()) {
      errors.description = 'Description is required';
    } else if (goalForm.description.length < 1) {
      errors.description = 'Description is required';
    } else if (goalForm.description.length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters';
    }
    
    if (Object.keys(errors).length > 0) {
      setGoalFormErrors(errors);
      return;
    }

    try {
      setGoalFormLoading(true);
      
      const response = await PerformanceAPI.goals.create({
        goalName: goalForm.goalName.trim(),
        category: goalForm.category,
        description: goalForm.description.trim()
      });
      
      toast.success('Performance goal created successfully!');
      
      // Reset form
      setGoalForm({
        goalName: '',
        description: '',
        category: 'Project Work'
      });
      setShowGoalModal(false);
      
      // Refresh goals list
      fetchGoals();
      
    } catch (error) {
      console.error('❌ Error creating performance goal:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create performance goal';
      toast.error(errorMessage);
    } finally {
      setGoalFormLoading(false);
    }
  };

  const handleGoalUpdate = async () => {
    // Reset errors
    setGoalFormErrors({});
    
    // Validate required fields
    const errors = {};
    if (!goalForm.goalName?.trim()) {
      errors.goalName = 'Goal name is required';
    }
    
    if (!goalForm.description?.trim()) {
      errors.description = 'Description is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setGoalFormErrors(errors);
      return;
    }

    try {
      setGoalFormLoading(true);
      
      await PerformanceAPI.goals.update(selectedGoal.id, {
        goalName: goalForm.goalName.trim(),
        description: goalForm.description.trim(),
        category: goalForm.category
      });
      
      toast.success('Performance goal updated successfully!');
      
      setShowEditGoalModal(false);
      setSelectedGoal(null);
      setGoalForm({
        goalName: '',
        description: '',
        category: 'Project Work'
      });
      
      // Refresh goals list
      fetchGoals();
      
    } catch (error) {
      console.error('❌ Error updating performance goal:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update performance goal';
      toast.error(errorMessage);
    } finally {
      setGoalFormLoading(false);
    }
  };

  // Handle assignment success
  const handleAssignmentSuccess = (assignmentData) => {
    console.log('✅ Assignment completed successfully:', assignmentData);
    
    // Refresh goals list to show updated status
    fetchGoals();
    
    // Refresh statistics
    fetchStatistics();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Performance Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Track goals, reviews, and team performance</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            className="flex items-center space-x-2" 
            onClick={handleExportPerformance}
            disabled={exportLoading}
          >
            {exportLoading ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Export</span>
              </>
            )}
          </Button>
          {canUserPerformAction('create_goal', user?.role) && (
            <Button onClick={() => setShowGoalModal(true)} variant="default" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Set Goal</span>
            </Button>
          )}
          {/* <Button variant="outline" className="flex items-center space-x-2" onClick={() => setSelectedTab('analytics')}>
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </Button> */}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'goals', 'reviews', 'feedbackforms'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white'
              }`}
            >
              {tab === 'feedbackforms' ? 'Feedback Forms' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {statisticsLoading ? '...' : statistics.active}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statisticsLoading ? 'Loading...' : `${statistics.total} total goals`}
                </p>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">4.2</div>
                <p className="text-xs text-muted-foreground">+0.3 from last quarter</p>
              </CardContent>
            </Card> */}

            {/* <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">12</div>
                <p className="text-xs text-muted-foreground">Due this month</p>
              </CardContent>
            </Card> */}

            {/* <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">15</div>
                <p className="text-xs text-muted-foreground">Above 4.5 rating</p>
              </CardContent>
            </Card> */}
          </div>

          {/* Charts */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Monthly performance vs goals</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="performance" stroke="#10b981" name="Performance" />
                    <Line type="monotone" dataKey="goals" stroke="#3b82f6" name="Goals" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Department-wise performance scores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teamPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="current" fill="#10b981" name="Current" />
                    <Bar dataKey="target" fill="#3b82f6" name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div> */}

          {/* Recent Active Goals (Admin/HR View) */}
          {(user?.role === 'admin' || user?.role === 'hr') && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Active Goals</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedTab('goals')}
                  className="text-sm"
                >
                  View All Goals
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {realGoals.slice(0, 2).map((goal, index) => {
                  // Get status badge color and text
                  const getStatusBadge = (status) => {
                    switch (status?.toLowerCase()) {
                      case 'created':
                        return {
                          bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                          text: 'Created'
                        };
                      case 'assigned':
                        return {
                          bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                          text: 'Assigned'
                        };
                      case 'in_progress':
                        return {
                          bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                          text: 'In Progress'
                        };
                      case 'completed':
                        return {
                          bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                          text: 'Completed'
                        };
                      default:
                        return {
                          bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                          text: status || 'Active'
                        };
                    }
                  };

                  const statusBadge = getStatusBadge(goal.status);
                  const createdDate = new Date(goal.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <Card key={goal.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base font-medium text-gray-900 dark:text-white">
                              {goal.goalName || goal.title}
                            </CardTitle>
                            <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {goal.description || 'No description available'}
                            </CardDescription>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg}`}>
                            {statusBadge.text}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Category</span>
                            <span className="font-medium text-gray-900 dark:text-white">{goal.category}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">
                                  {goal.goalName ? goal.goalName.charAt(0).toUpperCase() : 'G'}
                                </span>
                              </div>
                              <span className="text-gray-600 dark:text-gray-400">Goal #{index + 1}</span>
                            </div>
                            <span className="text-gray-500 dark:text-gray-400">Created: {createdDate}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Show message if no goals */}
                {realGoals.length === 0 && (
                  <div className="col-span-2 text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No Goals Created Yet</p>
                      <p className="text-sm">Create your first performance goal to get started</p>
                    </div>
                  </div>
                )}

                {/* Show message if only 1 goal exists */}
                {realGoals.length === 1 && (
                  <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400">
                      <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Create more goals to see them here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Personal Performance (Employee View) */}
          {user?.role === 'employee' && (
            <Card>
              <CardHeader>
                <CardTitle>Your Performance Overview</CardTitle>
                <CardDescription>Current quarter performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-green-600">4.2</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Overall Rating</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">8/10</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Goals Completed</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">92%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Goal Achievement</div>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={skillsData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Current" dataKey="current" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    <Radar name="Target" dataKey="target" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Goals Tab */}
      {selectedTab === 'goals' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Goals & Objectives</CardTitle>
              <CardDescription>Track and manage individual and team goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search goals..."
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
              </div>

              {goalsLoading ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">Loading performance goals...</p>
                </div>
              ) : goalsError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                  <p className="text-red-500">{goalsError}</p>
                </div>
              ) : userGoals.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">No performance goals found</p>
                  {canUserPerformAction('create_goal', user?.role) && (
                    <Button 
                      onClick={() => setShowGoalModal(true)} 
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Goal
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {userGoals.map((goal) => (
                  <Card key={goal.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {goal.goalName || goal.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{goal.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(goal.status)}`}>
                          {getStatusIcon(goal.status)}
                          <span>{goal.status.replace('-', ' ').toUpperCase()}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{goal.category}</span>
                          <span>Created: {new Date(goal.createdAt).toLocaleDateString()}</span>
                          <span>Status: {goal.status}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Status</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            goal.status === 'created' ? 'bg-blue-100 text-blue-800' :
                            goal.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                            goal.status === 'submitted' ? 'bg-purple-100 text-purple-800' :
                            goal.status === 'reviewed' ? 'bg-orange-100 text-orange-800' :
                            goal.status === 'finalized' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {goal.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex items-center space-x-1"
                          onClick={() => {
                            setSelectedGoal(goal);
                            setShowReviewModal(true);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                          <span>View Details</span>
                        </Button>
                        {(user?.role === 'admin' || user?.role === 'hr') && (
                          <>
                            {goal.status === 'created' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setSelectedGoal(goal);
                                    setShowAssignModal(true);
                                  }}
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  Assign
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="secondary"
                                  onClick={() => {
                                    setSelectedGoal(goal);
                                    setGoalForm({
                                      goalName: goal.goalName || goal.title,
                                      description: goal.description,
                                      category: 'Project Work'
                                    });
                                    setShowEditGoalModal(true);
                                  }}
                                >
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Edit Goal
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDeleteGoal(goal.id)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </>
                            )}
                            {goal.status === 'assigned' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setSelectedGoal(goal);
                                    setShowAssignModal(true);
                                  }}
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  Update Assignment
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedGoal(goal);
                                    setShowViewAssignmentsModal(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Assignments
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reviews Tab */}
      {selectedTab === 'reviews' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reviews</CardTitle>
              <CardDescription>System overview of performance reviews and feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Review System Overview
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Performance review analytics and system management will be displayed here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback Forms Tab */}
      {selectedTab === 'feedbackforms' && (
        <FeedbackFormsManagement />
      )}

      {/* Analytics Tab */}
      {selectedTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
                <CardDescription>Employee performance score distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { range: '4.5 - 5.0', count: 15, percentage: 30, color: 'bg-green-500' },
                    { range: '4.0 - 4.4', count: 20, percentage: 40, color: 'bg-blue-500' },
                    { range: '3.5 - 3.9', count: 10, percentage: 20, color: 'bg-yellow-500' },
                    { range: '3.0 - 3.4', count: 4, percentage: 8, color: 'bg-orange-500' },
                    { range: '< 3.0', count: 1, percentage: 2, color: 'bg-red-500' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${item.color}`}></div>
                        <span className="font-medium">{item.range}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Goal Completion Rate</CardTitle>
                <CardDescription>Monthly goal completion trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="goals" 
                      stroke="#8b5cf6" 
                      name="Goal Completion %" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Set Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Create New Performance Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Goal Name *</label>
                <Input 
                  placeholder="Enter goal name..." 
                  value={goalForm.goalName}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, goalName: e.target.value }))}
                  className={goalFormErrors.goalName ? 'border-red-500' : ''}
                />
                {goalFormErrors.goalName && (
                  <p className="text-red-500 text-sm mt-1">{goalFormErrors.goalName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  className={`w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${goalFormErrors.description ? 'border-red-500' : ''}`}
                  rows="3"
                  placeholder="Describe the goal and success criteria..."
                  value={goalForm.description}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
                ></textarea>
                {goalFormErrors.description && (
                  <p className="text-red-500 text-sm mt-1">{goalFormErrors.description}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowGoalModal(false)}
                disabled={goalFormLoading}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handleGoalSubmit}
                disabled={goalFormLoading}
              >
                {goalFormLoading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Create Goal
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {showEditGoalModal && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Edit Performance Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Goal Name *</label>
                <Input 
                  placeholder="Enter goal name..." 
                  value={goalForm.goalName}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, goalName: e.target.value }))}
                  className={goalFormErrors.goalName ? 'border-red-500' : ''}
                />
                {goalFormErrors.goalName && (
                  <p className="text-red-500 text-sm mt-1">{goalFormErrors.goalName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  className={`w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${goalFormErrors.description ? 'border-red-500' : ''}`}
                  rows="3"
                  placeholder="Describe the goal and success criteria..."
                  value={goalForm.description}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
                ></textarea>
                {goalFormErrors.description && (
                  <p className="text-red-500 text-sm mt-1">{goalFormErrors.description}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowEditGoalModal(false)}
                disabled={goalFormLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handleGoalUpdate}
                disabled={goalFormLoading}
              >
                {goalFormLoading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Update Goal
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Details Modal */}
      {showReviewModal && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Goal Details</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedGoal(null);
                }}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Goal Name</label>
                <p className="text-gray-900 dark:text-white font-semibold">{selectedGoal.goalName || selectedGoal.title}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                <p className="text-gray-900 dark:text-white">{selectedGoal.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</label>
                  <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                    {selectedGoal.category}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created Date</label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedGoal.createdAt ? new Date(selectedGoal.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedGoal.status === 'created' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                    selectedGoal.status === 'assigned' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    selectedGoal.status === 'submitted' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                    selectedGoal.status === 'reviewed' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                    selectedGoal.status === 'finalized' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {selectedGoal.status?.toUpperCase()}
                  </span>
                </div>
              </div>
              
              {selectedGoal.createdAt && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedGoal.updatedAt || selectedGoal.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedGoal(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      <AssignGoalModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        selectedGoal={selectedGoal}
        onAssignmentSuccess={handleAssignmentSuccess}
      />

      {/* View Assignments Modal */}
      <ViewAssignmentsModal
        isOpen={showViewAssignmentsModal}
        onClose={() => setShowViewAssignmentsModal(false)}
        selectedGoal={selectedGoal}
      />
    </div>
  );
};

export default PerformanceManagement;
