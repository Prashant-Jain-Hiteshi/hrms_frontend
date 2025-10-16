import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { 
  Search, FileText, Clock, CheckCircle, AlertCircle, 
  Filter, Eye, Target, User, Calendar, Star
} from 'lucide-react';
import { PerformanceAPI } from '../../../lib/performanceApi';
import { useToast } from '../../ui/Toast';
import FeedbackFormViewModal from './FeedbackFormViewModal';

const FeedbackFormsManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackForms, setFeedbackForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);

  // Load all feedback forms (admin view)
  const loadAllFeedbackForms = async () => {
    try {
      setLoading(true);
      console.log('🎯 Loading all feedback forms for admin...');
      
      // Get all feedback submissions from all employees
      const response = await PerformanceAPI.admin.getAllFeedbackSubmissions();
      console.log('🔍 Raw API response:', response);
      
      // Handle both response formats: {data: [...]} or direct array [...]
      const forms = response?.data || response || [];
      
      console.log('🔍 Extracted forms:', forms);
      console.log('🔍 Forms is array:', Array.isArray(forms));
      console.log('🔍 Forms length:', forms.length);
      
      setFeedbackForms(forms);
      setFilteredForms(forms);
      
      console.log('✅ All feedback forms loaded:', forms.length);
      
    } catch (error) {
      console.error('❌ Error loading feedback forms:', error);
      toast.error('Failed to load feedback forms');
      setFeedbackForms([]);
      setFilteredForms([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter forms based on search, status, and category
  const filterForms = () => {
    let filtered = [...feedbackForms];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(form =>
        form.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.goalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(form => form.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(form => form.category === categoryFilter);
    }

    setFilteredForms(filtered);
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

  // Get unique categories for filter
  const getCategories = () => {
    const categories = [...new Set(feedbackForms.map(form => form.category).filter(Boolean))];
    return categories;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not submitted';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle view form
  const handleViewForm = (form) => {
    setSelectedForm(form);
    setShowViewModal(true);
  };

  // Load data on component mount
  useEffect(() => {
    loadAllFeedbackForms();
  }, []);

  // Filter forms when search term, status, or category filter changes
  useEffect(() => {
    filterForms();
  }, [searchTerm, statusFilter, categoryFilter, feedbackForms]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Forms
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : feedbackForms.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Assigned
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : feedbackForms.filter(f => f.status === 'assigned').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Submitted
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : feedbackForms.filter(f => f.status === 'submitted').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Reviewed
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : feedbackForms.filter(f => f.status === 'reviewed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by employee, goal, or category..."
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
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Categories</option>
                {getCategories().map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Forms Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Feedback Forms</CardTitle>
          <CardDescription>
            View and monitor all employee feedback submissions across the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading feedback forms...</p>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Feedback Forms Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feedbackForms.length === 0 
                  ? 'No feedback forms have been created yet.'
                  : 'No forms match your current filters.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Goal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Submitted
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
                  {filteredForms.map((form) => {
                    const statusInfo = getStatusInfo(form.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <tr key={form.submissionId || form.goalAssignmentId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {form.employeeName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {form.employeeId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {form.goalName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {form.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {form.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                            {formatDate(form.submittedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewForm(form)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
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

      {/* View Modal */}
      {showViewModal && selectedForm && (
        <FeedbackFormViewModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedForm(null);
          }}
          formData={selectedForm}
        />
      )}
    </div>
  );
};

export default FeedbackFormsManagement;
