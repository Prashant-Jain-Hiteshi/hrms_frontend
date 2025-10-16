import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Target, FileText, MessageSquare, Star, 
  TrendingUp, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PerformanceAPI } from '../../lib/performanceApi';
import { useToast } from '../ui/Toast';
import FeedbackFormsList from './Employee/FeedbackFormsList';
import ReviewerDashboard from './Reviewer/ReviewerDashboard';

const PerformanceEmployee = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // Performance data state
  const [performanceStats, setPerformanceStats] = useState({
    totalGoals: 0,
    completedGoals: 0,
    pendingFeedback: 0,
    reviewsReceived: 0
  });

  // Tab configuration for employee
  const tabs = ['overview', 'feedbackforms', 'reviews', 'myreviews'];
  
  const tabLabels = {
    overview: 'Overview',
    feedbackforms: 'Feedback Forms',
    reviews: 'Reviews'
   
  };

  // Load performance overview data
  const loadPerformanceOverview = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading performance overview...');
      
      // Get feedback goals to calculate stats
      const feedbackResponse = await PerformanceAPI.feedback.getGoals();
      const goals = feedbackResponse?.data || [];
      
      const stats = {
        totalGoals: goals.length,
        completedGoals: goals.filter(g => g.feedbackStatus === 'reviewed').length,
        pendingFeedback: goals.filter(g => g.feedbackStatus === 'not_started').length,
        reviewsReceived: goals.filter(g => g.feedbackStatus === 'reviewed').length
      };
      
      setPerformanceStats(stats);
      console.log('✅ Performance overview loaded:', stats);
      
    } catch (error) {
      console.error('❌ Error loading performance overview:', error);
      toast.error('Failed to load performance overview');
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    if (selectedTab === 'overview') {
      loadPerformanceOverview();
    }
  }, [selectedTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Performance
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your goals, submit feedback, and view performance reviews
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                selectedTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Performance Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Goals */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Goals
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loading ? '...' : performanceStats.totalGoals}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Completed Goals */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Completed
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loading ? '...' : performanceStats.completedGoals}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Feedback */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Pending Feedback
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loading ? '...' : performanceStats.pendingFeedback}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Received */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Reviews Received
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loading ? '...' : performanceStats.reviewsReceived}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common performance-related actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setSelectedTab('feedbackforms')}
                >
                  <FileText className="h-6 w-6" />
                  <span>Submit Feedback</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setSelectedTab('reviews')}
                >
                  <MessageSquare className="h-6 w-6" />
                  <span>View Reviews</span>
                </Button>
                
                {/* <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setSelectedTab('myreviews')}
                >
                  <Star className="h-6 w-6" />
                  <span>My Reviews</span>
                </Button> */}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            {/* <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest performance-related activities
              </CardDescription>
            </CardHeader> */}
            {/* <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Activity feed will be implemented soon
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Recent feedback submissions, reviews, and goal updates will appear here
                    </p>
                  </div>
                </div>
              </div>
            </CardContent> */}
          </Card>
        </div>
      )}

      {/* Feedback Forms Tab */}
      {selectedTab === 'feedbackforms' && (
        <FeedbackFormsList />
      )}

      {/* Reviews Tab */}
      {selectedTab === 'reviews' && (
        <ReviewerDashboard />
      )}

      {/* My Reviews Tab */}
      {selectedTab === 'myreviews' && (
        <Card>
          <CardHeader>
            <CardTitle>Reviews I've Given</CardTitle>
            <CardDescription>
              Feedback and reviews you've provided to other team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                My Reviews Coming Soon
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Reviews you've given to other employees will be displayed here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceEmployee;
