import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Target, TrendingUp, Award, Calendar, Users, 
  Plus, Search, Filter, Eye, Star, BarChart3,
  CheckCircle, Clock, AlertCircle, Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const PerformanceManagement = () => {
  const { user } = useAuth();
  const { 
    goals, 
    reviews, 
    addGoal, 
    updateGoal, 
    deleteGoal, 
    addReview, 
    updateReview, 
    deleteReview,
    getFilteredData,
    canUserPerformAction
  } = useData();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Export functionality
  const handleExportPerformance = () => {
    const csvContent = generatePerformanceCSV();
    const filename = `performance_report_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

  const generatePerformanceCSV = () => {
    const headers = ['Employee', 'Goal', 'Progress', 'Status', 'Due Date', 'Priority', 'Description'];
    const rows = goals.map(goal => [
      goal.employee,
      goal.title,
      `${goal.progress}%`,
      goal.status,
      goal.dueDate,
      goal.priority,
      goal.description || 'N/A'
    ]);
    
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
    title: '',
    description: '',
    category: 'Performance',
    priority: 'medium',
    targetDate: '',
    progress: 0
  });
  const [showEditGoalModal, setShowEditGoalModal] = useState(false);

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

  const userGoals = getFilteredData('goals', user?.role, user?.id) || goals;
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

  const handleDeleteGoal = (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      deleteGoal(goalId);
    }
  };

  const handleReviewUpdate = (reviewId, updates) => {
    updateReview(reviewId, updates);
  };

  const handleGoalSubmit = () => {
    if (!goalForm.title || !goalForm.description || !goalForm.targetDate) {
      alert('Please fill in all required fields');
      return;
    }

    const newGoal = {
      ...goalForm,
      deadline: goalForm.targetDate,
      owner: user?.name || 'Current User',
      status: 'pending'
    };

    addGoal(newGoal);
    setGoalForm({
      title: '',
      description: '',
      category: 'Performance',
      priority: 'medium',
      targetDate: '',
      progress: 0
    });
    setShowGoalModal(false);
  };

  const handleGoalUpdate = () => {
    if (!goalForm.title || !goalForm.description || !goalForm.targetDate) {
      alert('Please fill in all required fields');
      return;
    }

    updateGoal(selectedGoal.id, {
      title: goalForm.title,
      description: goalForm.description,
      category: goalForm.category,
      priority: goalForm.priority,
      deadline: goalForm.targetDate,
      progress: parseInt(goalForm.progress),
      status: parseInt(goalForm.progress) >= 100 ? 'completed' : 
               parseInt(goalForm.progress) > 0 ? 'in-progress' : 'pending'
    });
    
    setShowEditGoalModal(false);
    setSelectedGoal(null);
    setGoalForm({
      title: '',
      description: '',
      category: 'Performance',
      priority: 'medium',
      targetDate: '',
      progress: 0
    });
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
          <Button variant="outline" className="flex items-center space-x-2" onClick={handleExportPerformance}>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          {canUserPerformAction('create_goal', user?.role) && (
            <Button onClick={() => setShowGoalModal(true)} variant="default" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Set Goal</span>
            </Button>
          )}
          <Button variant="outline" className="flex items-center space-x-2" onClick={() => setSelectedTab('analytics')}>
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'goals', 'reviews', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                selectedTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white'
              }`}
            >
              {tab}
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
                <div className="text-2xl font-bold text-blue-600">24</div>
                <p className="text-xs text-muted-foreground">8 completed this quarter</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">4.2</div>
                <p className="text-xs text-muted-foreground">+0.3 from last quarter</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">12</div>
                <p className="text-xs text-muted-foreground">Due this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">15</div>
                <p className="text-xs text-muted-foreground">Above 4.5 rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          </div>

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

              <div className="space-y-4">
                {userGoals.map((goal) => (
                  <Card key={goal.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{goal.title}</h3>
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
                          <span>Due: {goal.deadline}</span>
                          <span>Owner: {goal.owner}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${goal.progress}%` }}
                          ></div>
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
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => {
                            setSelectedGoal(goal);
                            setGoalForm({
                              title: goal.title,
                              description: goal.description,
                              category: goal.category,
                              priority: goal.priority,
                              targetDate: goal.deadline,
                              progress: goal.progress
                            });
                            setShowEditGoalModal(true);
                          }}
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Update Progress
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
              <CardDescription>Manage employee performance reviews and feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Employee</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Reviewer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Period</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Score</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userReviews.map((review) => (
                      <tr key={review.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-primary/10 rounded-full p-2">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{review.employee}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{review.reviewer}</td>
                        <td className="py-3 px-4 text-sm">{review.period}</td>
                        <td className="py-3 px-4 text-sm">{review.type}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className="font-medium">{review.score}</span>
                            <Star className="h-4 w-4 text-yellow-400 ml-1" />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                            {review.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              View Review
                            </Button>
                            {review.status === 'pending' && (
                              <Button size="sm" variant="success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
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
            <h3 className="text-lg font-medium mb-4">Set New Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Goal Title</label>
                <Input 
                  placeholder="Enter goal title..." 
                  value={goalForm.title}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows="3"
                  placeholder="Describe the goal and success criteria..."
                  value={goalForm.description}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={goalForm.category}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option>Performance</option>
                    <option>Technical Skills</option>
                    <option>Leadership</option>
                    <option>Communication</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Date</label>
                  <Input 
                    type="date" 
                    value={goalForm.targetDate}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, targetDate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select 
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  value={goalForm.priority}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Progress</label>
                <Input 
                  type="number" 
                  value={goalForm.progress}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, progress: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowGoalModal(false)}>
                <AlertCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button variant="success" onClick={handleGoalSubmit}>
                <Target className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {showEditGoalModal && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Update Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Goal Title</label>
                <Input 
                  placeholder="Enter goal title..." 
                  value={goalForm.title}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows="3"
                  placeholder="Describe the goal and success criteria..."
                  value={goalForm.description}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={goalForm.category}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option>Performance</option>
                    <option>Technical Skills</option>
                    <option>Leadership</option>
                    <option>Communication</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Date</label>
                  <Input 
                    type="date" 
                    value={goalForm.targetDate}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, targetDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={goalForm.priority}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Progress (%)</label>
                  <Input 
                    type="number" 
                    min="0"
                    max="100"
                    value={goalForm.progress}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, progress: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowEditGoalModal(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleGoalUpdate}>
                Update Goal
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
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Goal Title</label>
                <p className="text-gray-900 dark:text-white font-semibold">{selectedGoal.title}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                <p className="text-gray-900 dark:text-white">{selectedGoal.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Target Date</label>
                  <p className="text-gray-900 dark:text-white">{selectedGoal.targetDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedGoal.priority === 'high' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      : selectedGoal.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  }`}>
                    {selectedGoal.priority?.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</label>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{selectedGoal.progress}% Complete</span>
                    <span>{selectedGoal.status}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${selectedGoal.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedGoal.status === 'completed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : selectedGoal.status === 'in-progress'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {selectedGoal.status?.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Update Progress
              </Button>
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
    </div>
  );
};

export default PerformanceManagement;
