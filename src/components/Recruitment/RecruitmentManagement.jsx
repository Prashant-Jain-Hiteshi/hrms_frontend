import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Users, Plus, Search, Filter, Eye, Calendar, 
  MapPin, Briefcase, Clock, CheckCircle, XCircle,
  FileText, Mail, Phone, Download, Trash2, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { RecruitmentAPI } from '../../lib/api';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell
} from 'recharts';

const RecruitmentManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Modal states
  const [showJobForm, setShowJobForm] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showJobViewModal, setShowJobViewModal] = useState(false);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [showEditCandidateModal, setShowEditCandidateModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  
  // Data states
  const [jobs, setJobs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [overviewStats, setOverviewStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [candidatesPagination, setCandidatesPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Export functionality
  const handleExportRecruitment = () => {
    const csvContent = generateRecruitmentCSV();
    const filename = `recruitment_report_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

  const generateRecruitmentCSV = () => {
    const headers = ['Job ID', 'Title', 'Department', 'Location', 'Type', 'Status', 'Posted Date', 'Applications'];
    const rows = jobs.map(job => [
      job.id,
      job.title,
      job.department?.name || job.department,
      job.location,
      job.type,
      job.status,
      job.postedDate,
      job.applications || 0
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
  // Form states
  const [jobForm, setJobForm] = useState({
    title: '',
    departmentId: '',
    location: '',
    jobType: 'full-time',
    experienceRequired: '',
    applicationDeadline: '',
    description: '',
    status: 'active'
  });
  
  const [candidateForm, setCandidateForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    jobId: ''
  });
  
  const [onboardingTasks, setOnboardingTasks] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [candidateFormErrors, setCandidateFormErrors] = useState({});
  
  // Department management states
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: ''
  });
  const [departmentFormErrors, setDepartmentFormErrors] = useState({});

  // API Functions
  const loadOverviewData = async () => {
    if (selectedTab !== 'overview') return;
    
    try {
      setLoading(true);
      const data = await RecruitmentAPI.dashboard.getOverviewStats();
      setOverviewStats(data);
      // toast.success('Overview data loaded successfully');
    } catch (error) {
      console.error('Error loading overview data:', error);
      // toast.error(error.response?.data?.message || 'Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };
  
  const loadJobs = async (params = {}) => {
    
    try {
      setLoading(true);
      const response = await RecruitmentAPI.jobs.list({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...params
      });
      
      console.log('📥 Jobs API Response:', response.data);
      console.log('🔍 First job object:', response.data.data[0]);
      console.log('📊 Total jobs loaded:', response.data.data.length);
      console.log('🎯 Active jobs for dropdown:', response.data.data.filter(job => job.status === 'active').length);
      console.log('📈 Jobs with application counts:', response.data.data.map(job => ({ 
        title: job.title, 
        applications: job.applications || 0 
      })));
      setJobs(response.data.data);
      setPagination(response.data.pagination);
      // toast.success('Jobs loaded successfully');
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error(error.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };
  
  const loadDepartments = async () => {
    try {
      const response = await RecruitmentAPI.departments.list();
      console.log('📥 Departments API Response:', response.data);
      setDepartments(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading departments:', error);
      // toast.error('Failed to load departments');
    }
  };

  const loadCandidates = async (params = {}) => {
    if (selectedTab !== 'candidates') return;
    
    try {
      setLoading(true);
      const response = await RecruitmentAPI.candidates.list({
        page: candidatesPagination.page,
        limit: candidatesPagination.limit,
        search: searchTerm,
        ...params
      });
      
      console.log('📥 Candidates API Response:', response.data);
      console.log('🔍 First candidate object:', response.data.data[0]);
      setCandidates(response.data.data);
      setCandidatesPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading candidates:', error);
      toast.error(error.response?.data?.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const initialOnboardingTasks = [
    { id: 1, task: 'Send welcome email', status: 'completed', assignee: 'HR Team' },
    { id: 2, task: 'Prepare workspace & equipment', status: 'completed', assignee: 'IT Team' },
    { id: 3, task: 'Create system accounts', status: 'in-progress', assignee: 'IT Team' },
    { id: 4, task: 'Schedule orientation meeting', status: 'pending', assignee: 'HR Team' },
    { id: 5, task: 'Assign buddy/mentor', status: 'pending', assignee: 'Manager' },
    { id: 6, task: 'Complete documentation', status: 'pending', assignee: 'Employee' }
  ];

  // Effects
  useEffect(() => {
    setOnboardingTasks(initialOnboardingTasks);
    loadDepartments(); // Load departments on mount
    loadJobs(); // Load jobs on mount for candidate form dropdown
  }, []);
  
  // Tab-based data loading
  useEffect(() => {
    if (selectedTab === 'overview') {
      loadOverviewData();
    } else if (selectedTab === 'jobs') {
      loadJobs();
    } else if (selectedTab === 'candidates') {
      loadCandidates();
    } else if (selectedTab === 'config') {
      loadDepartments();
    }
  }, [selectedTab]);
  
  // Search effect for jobs
  useEffect(() => {
    if (selectedTab === 'jobs' && searchTerm) {
      const timeoutId = setTimeout(() => {
        loadJobs({ search: searchTerm });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, selectedTab]);

  // Search effect for candidates
  useEffect(() => {
    if (selectedTab === 'candidates' && searchTerm) {
      const timeoutId = setTimeout(() => {
        loadCandidates({ search: searchTerm });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, selectedTab]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'hired':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'interview':
      case 'shortlisted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'closed':
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Department form validation
  const validateDepartmentForm = () => {
    const errors = {};
    
    if (!departmentForm.name || departmentForm.name.trim() === '') {
      errors.name = 'Department name is required';
    } else if (departmentForm.name.length > 100) {
      errors.name = 'Department name must be less than 100 characters';
    }
    
    if (departmentForm.description && departmentForm.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }
    
    setDepartmentFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Candidate form validation
  const validateCandidateForm = () => {
    const errors = {};
    
    if (!candidateForm.fullName || candidateForm.fullName.trim() === '') {
      errors.fullName = 'Full name is required';
    } else if (candidateForm.fullName.length > 100) {
      errors.fullName = 'Full name must be less than 100 characters';
    }
    
    if (!candidateForm.email || candidateForm.email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(candidateForm.email)) {
      errors.email = 'Please provide a valid email address';
    }
    
    if (!candidateForm.position || candidateForm.position.trim() === '') {
      errors.position = 'Position is required';
    } else if (candidateForm.position.length > 100) {
      errors.position = 'Position must be less than 100 characters';
    }
    
    if (!candidateForm.jobId) {
      errors.jobId = 'Please select a job';
    }
    
    if (candidateForm.phone && candidateForm.phone.length > 20) {
      errors.phone = 'Phone number must be less than 20 characters';
    }
    
    if (candidateForm.experience && (isNaN(candidateForm.experience) || candidateForm.experience < 0 || candidateForm.experience > 50)) {
      errors.experience = 'Experience must be a number between 0 and 50';
    }
    
    setCandidateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset candidate form
  const resetCandidateForm = () => {
    setCandidateForm({
      fullName: '',
      email: '',
      phone: '',
      position: '',
      experience: '',
      jobId: ''
    });
    setCandidateFormErrors({});
  };

  // Form validation
  const validateJobForm = () => {
    const errors = {};
    
    if (!jobForm.title || jobForm.title.trim() === '') {
      errors.title = 'Job title is required';
    }
    
    if (!jobForm.departmentId) {
      errors.departmentId = 'Please select a department';
    }
    
    if (!jobForm.location || jobForm.location.trim() === '') {
      errors.location = 'Location is required';
    }
    
    if (!jobForm.description || jobForm.description.trim() === '') {
      errors.description = 'Job description is required';
    }
    
    // Optional field validations with helpful messages
    if (jobForm.experienceRequired && jobForm.experienceRequired.length > 50) {
      errors.experienceRequired = 'Experience description should be concise (max 50 characters)';
    }
    
    if (jobForm.applicationDeadline) {
      const deadline = new Date(jobForm.applicationDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadline < today) {
        errors.applicationDeadline = 'Application deadline cannot be in the past';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Event handlers
  const handleJobFormChange = (field, value) => {
    setJobForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCandidateFormChange = (field, value) => {
    setCandidateForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (candidateFormErrors[field]) {
      setCandidateFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Department form handlers
  const handleDepartmentFormChange = (field, value) => {
    setDepartmentForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (departmentFormErrors[field]) {
      setDepartmentFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDepartmentSubmit = async () => {
    if (!validateDepartmentForm()) {
      return;
    }

    try {
      setLoading(true);
      
      if (editingDepartment) {
        // Update existing department
        await RecruitmentAPI.departments.update(editingDepartment.id, departmentForm);
        toast.success('Department updated successfully');
      } else {
        // Create new department
        await RecruitmentAPI.departments.create(departmentForm);
        toast.success('Department created successfully');
      }

      // Reset form and close modal
      setDepartmentForm({ name: '', description: '' });
      setDepartmentFormErrors({});
      setShowDepartmentForm(false);
      setEditingDepartment(null);
      
      // Reload departments
      loadDepartments();
    } catch (error) {
      console.error('Department operation failed:', error);
      
      // Handle specific validation errors
      if (error.response?.status === 409) {
        setDepartmentFormErrors({ name: 'Department name already exists' });
      } else {
        toast.error(error.response?.data?.message || 'Failed to save department');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setDepartmentForm({
      name: department.name,
      description: department.description || ''
    });
    setDepartmentFormErrors({});
    setShowDepartmentForm(true);
  };

  const handleDeleteDepartment = async (departmentId) => {
    

    try {
      setLoading(true);
      await RecruitmentAPI.departments.delete(departmentId);
      toast.success('Department deleted successfully');
      loadDepartments();
    } catch (error) {
      console.error('Department deletion failed:', error);
      if (error.response?.status === 400) {
        toast.error('Cannot delete department with active jobs');
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete department');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJobSubmit = async () => {
    console.log(' Job form submission started');
    console.log('Current form data:', jobForm);
    
    // Validate form
    if (!validateJobForm()) {
      console.log('Validation failed - form has errors');
      console.log('Form errors:', formErrors);
      return;
    }

    try {
      setLoading(true);
      console.log('Sending API request with data:', jobForm);
      
      const response = await RecruitmentAPI.jobs.create(jobForm);
      
      console.log('Job creation successful');
      console.log('API Response:', response);
      
      toast.success('Job posted successfully');
      
      // Reset form and close modal
      setJobForm({
        title: '',
        departmentId: '',
        location: '',
        jobType: 'full-time',
        experienceRequired: '',
        applicationDeadline: '',
        description: '',
        status: 'active'
      });
      setFormErrors({});
      setShowJobForm(false);
      
      // Reload jobs if on jobs tab
      if (selectedTab === 'jobs') {
        loadJobs();
      }
    } catch (error) {
      console.error('Job creation failed');
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.response?.data?.message);
      console.error('Error data:', error.response?.data);
      
      toast.error(error.response?.data?.message || 'Failed to create job');
    } finally {
      setLoading(false);
      console.log('Job submission process completed');
    }
  };

  const handleCandidateSubmit = async () => {
    console.log('🚀 Candidate form submission started');
    console.log('📥 Current candidate form data:', candidateForm);
    console.log('📋 Current form errors:', candidateFormErrors);
    
    // Validate form
    const isValid = validateCandidateForm();
    console.log('✅ Form validation result:', isValid);
    
    if (!isValid) {
      console.log('❌ Validation failed - form has errors');
      console.log('🔍 Validation errors:', candidateFormErrors);
      return;
    }
    
    console.log('✅ Validation passed, proceeding with API call');

    try {
      setLoading(true);
      
      // Convert experience to number if provided
      const candidateData = {
        ...candidateForm,
        experience: candidateForm.experience ? parseInt(candidateForm.experience) : undefined
      };
      
      console.log('📤 Sending candidate data to API:', candidateData);
      console.log('🌐 API endpoint: POST /api/recruitment/candidates');
      
      const response = await RecruitmentAPI.candidates.create(candidateData);
      console.log('✅ API Response:', response);
      toast.success('Candidate added successfully');

      // Reset form and close modal
      resetCandidateForm();
      setShowCandidateForm(false);
      
      // Reload candidates and jobs to update application counts
      loadCandidates();
      loadJobs(); // Refresh job application counts
    } catch (error) {
      console.error('❌ ERROR in candidate creation:');
      console.error('🔍 Error type:', error.constructor.name);
      console.error('📝 Error message:', error.message);
      console.error('📊 Full error object:', error);
      console.error('🌐 Error response:', error.response);
      console.error('📥 Error response data:', error.response?.data);
      console.error('🔢 Error status:', error.response?.status);
      console.error('📤 Data that caused error:', candidateForm);
      
      // Handle specific validation errors
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Invalid candidate data';
        console.log('🔍 400 Bad Request - Validation Error:', errorMessage);
        
        if (errorMessage.includes('email')) {
          console.log('📧 Email validation error detected');
          setCandidateFormErrors({ email: 'Email address is already in use' });
        } else if (errorMessage.includes('job')) {
          console.log('💼 Job validation error detected');
          setCandidateFormErrors({ jobId: 'Selected job is not available' });
        } else if (errorMessage.includes('fullName')) {
          console.log('👤 Full name validation error detected');
          setCandidateFormErrors({ fullName: 'Full name is required' });
        } else {
          console.log('⚠️ Generic validation error, showing toast');
          toast.error(errorMessage);
        }
      } else if (error.response?.status === 404) {
        console.log('🔍 404 Not Found - API endpoint issue');
        toast.error('API endpoint not found. Please check backend server.');
      } else if (error.response?.status === 500) {
        console.log('🔍 500 Server Error - Backend issue');
        toast.error('Server error. Please try again later.');
      } else if (!error.response) {
        console.log('🔍 Network Error - No response from server');
        toast.error('Network error. Please check your connection.');
      } else {
        console.log('🔍 Unknown error occurred');
        toast.error(error.response?.data?.message || 'Failed to add candidate');
      }
    } finally {
      setLoading(false);
      console.log('🏁 Candidate submission process completed');
    }
  };

  const handleJobUpdate = async () => {
    if (!jobForm.title || !jobForm.departmentId || !jobForm.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await RecruitmentAPI.jobs.update(selectedJob.id, jobForm);
      toast.success('Job updated successfully');
      
      setShowEditJobModal(false);
      setSelectedJob(null);
      setJobForm({
        title: '',
        departmentId: '',
        location: '',
        jobType: 'full-time',
        experienceRequired: 0,
        applicationDeadline: '',
        description: '',
        status: 'active'
      });
      
      // Reload jobs if on jobs tab
      if (selectedTab === 'jobs') {
        loadJobs();
      }
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error(error.response?.data?.message || 'Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      setLoading(true);
      await RecruitmentAPI.jobs.delete(jobId);
      toast.success('Job deleted successfully');
      
      // Reload jobs if on jobs tab
      if (selectedTab === 'jobs') {
        loadJobs();
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error(error.response?.data?.message || 'Failed to delete job');
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateStatusUpdate = async (candidateId, newStatus) => {
    try {
      setLoading(true);
      await RecruitmentAPI.candidates.updateStatus(candidateId, newStatus);
      toast.success(`Candidate status updated to ${newStatus}`);
      
      // Reload candidates to show updated status
      loadCandidates();
    } catch (error) {
      console.error('Candidate status update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update candidate status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    try {
      setLoading(true);
      console.log('🗑️ Deleting candidate:', candidateId);
      
      await RecruitmentAPI.candidates.delete(candidateId);
      console.log('✅ Candidate deleted successfully');
      
      toast.success('Candidate deleted successfully');
      
      // Reload candidates and jobs to update application counts
      loadCandidates();
      loadJobs(); // Refresh job application counts
    } catch (error) {
      console.error('❌ ERROR in candidate deletion:');
      console.error('🔍 Error type:', error.constructor.name);
      console.error('📝 Error message:', error.message);
      console.error('🌐 Error response:', error.response);
      console.error('📤 Candidate ID that caused error:', candidateId);
      
      if (error.response?.status === 404) {
        toast.error('Candidate not found');
      } else if (error.response?.status === 400) {
        toast.error('Cannot delete candidate - may have related records');
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete candidate');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditCandidate = (candidate) => {
    console.log('✏️ Opening edit modal for candidate:', candidate);
    
    setEditingCandidate(candidate);
    setCandidateForm({
      fullName: candidate.fullName || '',
      email: candidate.email || '',
      phone: candidate.phone || '',
      position: candidate.position || '',
      experience: candidate.experience?.toString() || '',
      jobId: candidate.jobId || candidate.job?.id || ''
    });
    setCandidateFormErrors({});
    setShowEditCandidateModal(true);
  };

  const handleCandidateUpdate = async () => {
    console.log('🚀 Candidate update submission started');
    console.log('📥 Current candidate form data:', candidateForm);
    console.log('👤 Editing candidate:', editingCandidate);
    
    // Validate form
    const isValid = validateCandidateForm();
    console.log('✅ Form validation result:', isValid);
    
    if (!isValid) {
      console.log('❌ Validation failed - form has errors');
      console.log('🔍 Validation errors:', candidateFormErrors);
      return;
    }
    
    console.log('✅ Validation passed, proceeding with API call');

    try {
      setLoading(true);
      
      // Convert experience to number if provided
      const candidateData = {
        ...candidateForm,
        experience: candidateForm.experience ? parseInt(candidateForm.experience) : undefined
      };
      
      console.log('📤 Sending candidate update data to API:', candidateData);
      console.log('🌐 API endpoint: PATCH /api/recruitment/candidates/' + editingCandidate.id);
      
      const response = await RecruitmentAPI.candidates.update(editingCandidate.id, candidateData);
      console.log('✅ API Response:', response);
      
      toast.success('Candidate updated successfully');

      // Reset form and close modal
      setCandidateForm({
        fullName: '',
        email: '',
        phone: '',
        position: '',
        experience: '',
        jobId: ''
      });
      setCandidateFormErrors({});
      setShowEditCandidateModal(false);
      setEditingCandidate(null);
      
      // Reload candidates and jobs to update application counts
      loadCandidates();
      loadJobs(); // Refresh job application counts
    } catch (error) {
      console.error('❌ ERROR in candidate update:');
      console.error('🔍 Error type:', error.constructor.name);
      console.error('📝 Error message:', error.message);
      console.error('📊 Full error object:', error);
      console.error('🌐 Error response:', error.response);
      console.error('📥 Error response data:', error.response?.data);
      console.error('🔢 Error status:', error.response?.status);
      console.error('📤 Data that caused error:', candidateForm);
      
      // Handle specific validation errors
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Invalid candidate data';
        console.log('🔍 400 Bad Request - Validation Error:', errorMessage);
        
        if (errorMessage.includes('email')) {
          console.log('📧 Email validation error detected');
          setCandidateFormErrors({ email: 'Email address is already in use by another candidate' });
        } else if (errorMessage.includes('job')) {
          console.log('💼 Job validation error detected');
          setCandidateFormErrors({ jobId: 'Selected job is not available' });
        } else if (errorMessage.includes('fullName')) {
          console.log('👤 Full name validation error detected');
          setCandidateFormErrors({ fullName: 'Full name is required' });
        } else {
          console.log('⚠️ Generic validation error, showing toast');
          toast.error(errorMessage);
        }
      } else if (error.response?.status === 404) {
        console.log('🔍 404 Not Found - Candidate not found');
        toast.error('Candidate not found. It may have been deleted.');
        setShowEditCandidateModal(false);
        loadCandidates();
      } else if (error.response?.status === 500) {
        console.log('🔍 500 Server Error - Backend issue');
        toast.error('Server error. Please try again later.');
      } else if (!error.response) {
        console.log('🔍 Network Error - No response from server');
        toast.error('Network error. Please check your connection.');
      } else {
        console.log('🔍 Unknown error occurred');
        toast.error(error.response?.data?.message || 'Failed to update candidate');
      }
    } finally {
      setLoading(false);
      console.log('🏁 Candidate update process completed');
    }
  };

  const handleTaskStatusUpdate = (taskId, newStatus) => {
    setOnboardingTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus }
          : task
      )
    );
  };

  const viewCandidateProfile = (candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateModal(true);
  };

  // Permission check helper
  const canUserPerformAction = (action, role) => {
    const permissions = {
      'create_job': ['admin', 'hr'],
      'manage_candidates': ['admin', 'hr'],
      'view_all': ['admin', 'hr', 'employee', 'finance']
    };
    return permissions[action]?.includes(role?.toLowerCase()) || false;
  };

  // Format candidate experience for display
  const formatExperience = (experience) => {
    if (!experience) return 'Not specified';
    return typeof experience === 'number' ? `${experience} years` : experience;
  };

  const formatJobType = (jobType) => {
    switch (jobType) {
      case 'full-time':
        return 'Full-time';
      case 'part-time':
        return 'Part-time';
      case 'internship':
        return 'Internship';
      default:
        return 'Not specified';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Recruitment & Onboarding</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage job openings, candidates, and hiring process</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2" onClick={handleExportRecruitment}>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          {canUserPerformAction('create_job', user?.role) && (
            <Button 
              variant="default" 
              className="flex items-center space-x-2"
              onClick={() => setShowJobForm(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Post Job</span>
            </Button>
          )}
          {canUserPerformAction('manage_candidates', user?.role) && (
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
              onClick={() => setSelectedTab('candidates')}
            >
              <Users className="h-4 w-4" />
              <span>View Applications</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'jobs', 'candidates', 'config'].map((tab) => (
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
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-blue-600">
                      {overviewStats?.jobStats?.activeJobs || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Active positions</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-green-600">
                      {overviewStats?.totalApplications || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Total received</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interviews Scheduled</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-yellow-600">
                      {overviewStats?.interviewsScheduled || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">This week</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hired This Month</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-purple-600">
                      {overviewStats?.hiredThisMonth || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recruitment Funnel</CardTitle>
                <CardDescription>Candidate status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const funnelData = overviewStats?.recruitmentFunnel || [];
                        // Check if all values are zero
                        const allZero = funnelData.every(item => item.value === 0);
                        
                        if (allZero && funnelData.length > 0) {
                          // If all are zero, give each segment a small value for visualization
                          return funnelData.map(item => ({
                            ...item,
                            displayValue: 1, // For pie chart rendering
                            actualValue: item.value // Keep original value for tooltips
                          }));
                        }
                        
                        // Normal case - use actual values
                        return funnelData.map(item => ({
                          ...item,
                          displayValue: item.value,
                          actualValue: item.value
                        }));
                      })()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="displayValue"
                    >
                      {(overviewStats?.recruitmentFunnel || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${props.payload.actualValue || 0} candidates`, 
                        name
                      ]}
                      labelFormatter={() => 'Recruitment Status'}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-4 mt-4 flex-wrap">
                  {(overviewStats?.recruitmentFunnel || []).map((entry, index) => (
                    <div key={`cell-${index}`} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span className="text-sm">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Hiring Trends</CardTitle>
                <CardDescription>Applications vs. hires over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={overviewStats?.monthlyHiring || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value} ${name.toLowerCase()}`, 
                        name === 'Applications' ? 'Applications Received' : 'Candidates Hired'
                      ]}
                      labelFormatter={(label) => `${label} 2024`}
                    />
                    <Bar dataKey="applications" fill="#3b82f6" name="Applications" />
                    <Bar dataKey="hired" fill="#10b981" name="Hired" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Jobs Tab */}
      {selectedTab === 'jobs' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Openings</CardTitle>
              <CardDescription>Manage active and closed job positions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading jobs...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {jobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{job.department?.name || job.department}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {job.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4 mr-2" />
                          {job.location}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4 mr-2" />
                          {job.jobType || job.type} {job.experienceRequired && `• ${
                            job.experienceRequired.toString().toLowerCase().includes('year') || 
                            job.experienceRequired.toString().toLowerCase().includes('exp') ||
                            job.experienceRequired.toString().includes('-')
                              ? job.experienceRequired 
                              : `${job.experienceRequired} years experience`
                          }`}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Users className="h-4 w-4 mr-2" />
                          {job.applications || 0} applications
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                        <span>Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : job.postedDate || 'N/A'}</span>
                        <span>Deadline: {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : job.deadline || 'N/A'}</span>
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex items-center space-x-1"
                          onClick={() => {
                            setSelectedJob(job);
                            setShowJobViewModal(true);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => {
                            setSelectedJob(job);
                            setJobForm({
                              title: job.title,
                              departmentId: job.departmentId || job.department?.id,
                              location: job.location,
                              jobType: job.jobType || job.type,
                              experienceRequired: job.experienceRequired || job.experience,
                              applicationDeadline: job.applicationDeadline || job.deadline,
                              description: job.description,
                              status: job.status || 'active'
                            });
                            setShowEditJobModal(true);
                          }}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
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

      {/* Candidates Tab */}
      {selectedTab === 'candidates' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Candidate Applications</CardTitle>
              <CardDescription>Review and manage candidate applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search candidates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
                {canUserPerformAction('manage_candidates', user?.role) && (
                  <Button 
                    variant="default" 
                    className="flex items-center space-x-2"
                    onClick={() => {
                      resetCandidateForm();
                      setShowCandidateForm(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Candidate</span>
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Candidate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Position</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Experience</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Job Applied</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Applied Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>Loading candidates...</span>
                          </div>
                        </td>
                      </tr>
                    ) : candidates && candidates.length > 0 ? (
                      candidates.map((candidate) => (
                        <tr key={candidate.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-primary/10 rounded-full p-2">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{candidate.fullName}</div>
                                <div className="text-sm text-gray-500 flex items-center space-x-2">
                                  <Mail className="h-3 w-3" />
                                  <span>{candidate.email}</span>
                                </div>
                                {candidate.phone && (
                                  <div className="text-sm text-gray-500 flex items-center space-x-2">
                                    <Phone className="h-3 w-3" />
                                    <span>{candidate.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">{candidate.position}</td>
                          <td className="py-3 px-4 text-sm">{formatExperience(candidate.experience)}</td>
                          <td className="py-3 px-4 text-sm">{candidate.job?.title || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                              {candidate.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {candidate.appliedDate ? new Date(candidate.appliedDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => viewCandidateProfile(candidate)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Profile
                              </Button>
                              <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={() => handleEditCandidate(candidate)}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteCandidate(candidate.id)}
                                className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-500"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                              <div className="flex space-x-1">
                                {/* Primary Action Buttons */}
                                {candidate.status === 'applied' && (
                                  <Button 
                                    size="sm" 
                                    variant="default"
                                    onClick={() => handleCandidateStatusUpdate(candidate.id, 'screening')}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Screen
                                  </Button>
                                )}
                                {candidate.status === 'screening' && (
                                  <Button 
                                    size="sm" 
                                    variant="default"
                                    onClick={() => handleCandidateStatusUpdate(candidate.id, 'interview')}
                                  >
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Interview
                                  </Button>
                                )}
                                {candidate.status === 'interview' && (
                                  <Button 
                                    size="sm" 
                                    variant="default"
                                    onClick={() => handleCandidateStatusUpdate(candidate.id, 'hired')}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Hire
                                  </Button>
                                )}
                                
                                {/* Reject Button - Available for all statuses except hired and rejected */}
                                {!['hired', 'rejected'].includes(candidate.status) && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleCandidateStatusUpdate(candidate.id, 'rejected')}
                                    className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-500"
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-500 dark:text-gray-400">
                          No candidates found. Add your first candidate to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onboarding Tab */}
      {selectedTab === 'onboarding' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Checklist</CardTitle>
              <CardDescription>Track new hire onboarding progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {onboardingTasks.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          const nextStatus = item.status === 'pending' ? 'in-progress' : 
                                           item.status === 'in-progress' ? 'completed' : 'pending';
                          handleTaskStatusUpdate(item.id, nextStatus);
                        }}
                        className="focus:outline-none"
                      >
                        {item.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : item.status === 'in-progress' ? (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full hover:border-blue-500 transition-colors"></div>
                        )}
                      </button>
                      <div>
                        <p className={`font-medium ${item.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                          {item.task}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Assigned to: {item.assignee}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Config Tab */}
      {selectedTab === 'config' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Department Management</CardTitle>
                  <CardDescription>Manage departments for job postings</CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    setEditingDepartment(null);
                    setDepartmentForm({ name: '', description: '' });
                    setDepartmentFormErrors({});
                    setShowDepartmentForm(true);
                  }}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Department</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading departments...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Description</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Created Date</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments && departments.length > 0 ? (
                        departments.map((department) => (
                          <tr key={department.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {department.name}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-gray-600 dark:text-gray-400">
                                {department.description || 'No description'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-gray-600 dark:text-gray-400">
                                {department.createdAt ? new Date(department.createdAt).toLocaleDateString() : 'N/A'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditDepartment(department)}
                                  className="flex items-center space-x-1"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span>Edit</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteDepartment(department.id)}
                                  className="text-red-600 hover:text-red-700 flex items-center space-x-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Delete</span>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-gray-500 dark:text-gray-400">
                            No departments found. Create your first department to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Post Job Modal */}
      {showJobForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Post New Job</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Job Title *</label>
                <Input 
                  placeholder="e.g. Senior Software Engineer" 
                  value={jobForm.title}
                  onChange={(e) => handleJobFormChange('title', e.target.value)}
                  className={formErrors.title ? 'border-red-500' : ''}
                />
                {formErrors.title && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department *</label>
                <select 
                  className={`w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${formErrors.departmentId ? 'border-red-500' : ''}`}
                  value={jobForm.departmentId}
                  onChange={(e) => handleJobFormChange('departmentId', e.target.value)}
                >
                  <option value="">Select Department</option>
                  {departments && departments.length > 0 ? (
                    departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))
                  ) : (
                    <option disabled>Loading departments...</option>
                  )}
                </select>
                {formErrors.departmentId && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.departmentId}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location *</label>
                <Input 
                  placeholder="e.g. San Francisco, CA" 
                  value={jobForm.location}
                  onChange={(e) => handleJobFormChange('location', e.target.value)}
                  className={formErrors.location ? 'border-red-500' : ''}
                />
                {formErrors.location && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Job Type</label>
                <select 
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  value={jobForm.jobType}
                  onChange={(e) => handleJobFormChange('jobType', e.target.value)}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Experience Required</label>
                <Input 
                  placeholder="e.g. 3-5 years" 
                  value={jobForm.experienceRequired}
                  onChange={(e) => handleJobFormChange('experienceRequired', e.target.value)}
                  className={formErrors.experienceRequired ? 'border-red-500' : ''}
                />
                {formErrors.experienceRequired && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.experienceRequired}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Application Deadline</label>
                <Input 
                  type="date" 
                  value={jobForm.applicationDeadline}
                  onChange={(e) => handleJobFormChange('applicationDeadline', e.target.value)}
                  className={formErrors.applicationDeadline ? 'border-red-500' : ''}
                  min={new Date().toISOString().split('T')[0]}
                />
                {formErrors.applicationDeadline && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.applicationDeadline}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Job Description *</label>
              <textarea
                className={`w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${formErrors.description ? 'border-red-500' : ''}`}
                rows="4"
                placeholder="Describe the role, responsibilities, and requirements..."
                value={jobForm.description}
                onChange={(e) => handleJobFormChange('description', e.target.value)}
              ></textarea>
              {formErrors.description && (
                <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => {
                setShowJobForm(false);
                setFormErrors({});
              }}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button variant="default" onClick={handleJobSubmit}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Post Job
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {showEditJobModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Edit Job Posting</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Job Title *</label>
                <Input 
                  placeholder="Enter job title" 
                  value={jobForm.title}
                  onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Department *</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={jobForm.departmentId}
                    onChange={(e) => setJobForm(prev => ({ ...prev, departmentId: e.target.value }))}
                  >
                    <option value="">Select Department</option>
                    {departments && departments.length > 0 ? (
                      departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))
                    ) : (
                      <option disabled>Loading departments...</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location *</label>
                  <Input 
                    placeholder="Job location" 
                    value={jobForm.location}
                    onChange={(e) => setJobForm(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Job Type</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={jobForm.jobType}
                    onChange={(e) => setJobForm(prev => ({ ...prev, jobType: e.target.value }))}
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Job Status *</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={jobForm.status}
                    onChange={(e) => setJobForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active"> Active - Accepting Applications</option>
                    <option value="paused"> Paused - Temporarily Closed</option>
                    <option value="closed"> Closed - No Longer Hiring</option>
                    {/* <option value="draft">Draft - Not Published</option> */}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {jobForm.status === 'active' && 'Job is visible and accepting applications'}
                    {jobForm.status === 'paused' && 'Job is visible but not accepting new applications'}
                    {jobForm.status === 'closed' && 'Job is closed and no longer visible to applicants'}
                    {jobForm.status === 'draft' && 'Job is saved but not published yet'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Experience Required</label>
                  <Input 
                    placeholder="e.g., 3-5 years" 
                    value={jobForm.experienceRequired}
                    onChange={(e) => setJobForm(prev => ({ ...prev, experienceRequired: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Application Deadline</label>
                  <Input 
                    type="date" 
                    value={jobForm.applicationDeadline}
                    onChange={(e) => setJobForm(prev => ({ ...prev, applicationDeadline: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Job Description</label>
                <textarea
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows="4"
                  placeholder="Describe the role, responsibilities, and requirements..."
                  value={jobForm.description}
                  onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowEditJobModal(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleJobUpdate}>
                Update Job
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Job View Modal */}
      {showJobViewModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedJob.title}</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowJobViewModal(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Department</label>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedJob.department?.name || selectedJob.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Location</label>
                  <p className="text-gray-900 dark:text-white">{selectedJob.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Job Type</label>
                  <p className="text-gray-900 dark:text-white">{selectedJob.jobType || selectedJob.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Experience Required</label>
                  <p className="text-gray-900 dark:text-white">{selectedJob.experienceRequired || selectedJob.experience || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Applications</label>
                  <p className="text-gray-900 dark:text-white">{selectedJob.applications || 0} candidates</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedJob.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {selectedJob.status?.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Job Description</label>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedJob.description || 'No description provided.'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Posted Date</label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedJob.createdAt ? new Date(selectedJob.createdAt).toLocaleDateString() : selectedJob.postedDate || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Application Deadline</label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedJob.applicationDeadline ? new Date(selectedJob.applicationDeadline).toLocaleDateString() : selectedJob.deadline || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowJobViewModal(false)}>
                Close
              </Button>
              <Button 
                variant="default"
                onClick={() => {
                  setShowJobViewModal(false);
                  setSelectedJob(selectedJob);
                  setJobForm({
                    title: selectedJob.title,
                    departmentId: selectedJob.departmentId || selectedJob.department?.id,
                    location: selectedJob.location,
                    jobType: selectedJob.jobType || selectedJob.type,
                    experienceRequired: selectedJob.experienceRequired || selectedJob.experience,
                    applicationDeadline: selectedJob.applicationDeadline || selectedJob.deadline,
                    description: selectedJob.description,
                    status: selectedJob.status || 'active'
                  });
                  setShowEditJobModal(true);
                }}
              >
                Edit Job
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Form Modal */}
      {showCandidateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Add New Candidate</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <Input 
                  placeholder="Enter candidate name" 
                  value={candidateForm.fullName}
                  onChange={(e) => handleCandidateFormChange('fullName', e.target.value)}
                  className={candidateFormErrors.fullName ? 'border-red-500' : ''}
                />
                {candidateFormErrors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{candidateFormErrors.fullName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input 
                  type="email"
                  placeholder="candidate@email.com" 
                  value={candidateForm.email}
                  onChange={(e) => handleCandidateFormChange('email', e.target.value)}
                  className={candidateFormErrors.email ? 'border-red-500' : ''}
                />
                {candidateFormErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{candidateFormErrors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input 
                  placeholder="Enter phone number" 
                  value={candidateForm.phone}
                  onChange={(e) => handleCandidateFormChange('phone', e.target.value)}
                  className={candidateFormErrors.phone ? 'border-red-500' : ''}
                />
                {candidateFormErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{candidateFormErrors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Position *</label>
                <Input 
                  placeholder="e.g. Software Engineer" 
                  value={candidateForm.position}
                  onChange={(e) => handleCandidateFormChange('position', e.target.value)}
                  className={candidateFormErrors.position ? 'border-red-500' : ''}
                />
                {candidateFormErrors.position && (
                  <p className="text-red-500 text-xs mt-1">{candidateFormErrors.position}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Experience</label>
                <Input 
                  placeholder="e.g. 3 years" 
                  value={candidateForm.experience}
                  onChange={(e) => handleCandidateFormChange('experience', e.target.value)}
                  className={candidateFormErrors.experience ? 'border-red-500' : ''}
                />
                {candidateFormErrors.experience && (
                  <p className="text-red-500 text-xs mt-1">{candidateFormErrors.experience}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apply for Job *</label>
                <select 
                  className={`w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${candidateFormErrors.jobId ? 'border-red-500' : ''}`}
                  value={candidateForm.jobId}
                  onChange={(e) => handleCandidateFormChange('jobId', e.target.value)}
                >
                  <option value="">Select a job...</option>
                  {jobs.filter(job => job.status === 'active').map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} - {job.department?.name || job.department}
                    </option>
                  ))}
                </select>
                {candidateFormErrors.jobId && (
                  <p className="text-red-500 text-xs mt-1">{candidateFormErrors.jobId}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => {
                resetCandidateForm();
                setShowCandidateForm(false);
              }}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button variant="default" onClick={handleCandidateSubmit}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Add Candidate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Profile Modal */}
      {showCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCandidate.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedCandidate.position}</p>
              </div>
              <button
                onClick={() => setShowCandidateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedCandidate.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedCandidate.phone}</span>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Application Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Experience</p>
                    <p className="font-medium">{selectedCandidate.experience}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Applied Date</p>
                    <p className="font-medium">{selectedCandidate.appliedDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Stage</p>
                    <p className="font-medium">{selectedCandidate.stage}</p>
                  </div>
                  {/* <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
                    <div className="flex items-center">
                      <span className="font-medium">{selectedCandidate.rating}</span>
                      <span className="text-yellow-400 ml-1">★</span>
                    </div>
                  </div> */}
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Current Status</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCandidate.status)}`}>
                  {selectedCandidate.status.toUpperCase()}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                {selectedCandidate.status === 'shortlisted' && (
                  <Button 
                    variant="default"
                    onClick={() => {
                      handleCandidateStatusUpdate(selectedCandidate.id, 'interview');
                      setShowCandidateModal(false);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                )}
                {selectedCandidate.status === 'interview' && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        handleCandidateStatusUpdate(selectedCandidate.id, 'rejected');
                        setShowCandidateModal(false);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      variant="default"
                      onClick={() => {
                        handleCandidateStatusUpdate(selectedCandidate.id, 'hired');
                        setShowCandidateModal(false);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Hire
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setShowCandidateModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Form Modal */}
      {showDepartmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              {editingDepartment ? 'Edit Department' : 'Add New Department'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Department Name *</label>
                <Input 
                  placeholder="e.g. Engineering" 
                  value={departmentForm.name}
                  onChange={(e) => handleDepartmentFormChange('name', e.target.value)}
                  className={departmentFormErrors.name ? 'border-red-500' : ''}
                />
                {departmentFormErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{departmentFormErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className={`w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${departmentFormErrors.description ? 'border-red-500' : ''}`}
                  rows="3"
                  placeholder="Brief description of the department..."
                  value={departmentForm.description}
                  onChange={(e) => handleDepartmentFormChange('description', e.target.value)}
                ></textarea>
                {departmentFormErrors.description && (
                  <p className="text-red-500 text-xs mt-1">{departmentFormErrors.description}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDepartmentForm(false);
                  setDepartmentFormErrors({});
                  setEditingDepartment(null);
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handleDepartmentSubmit}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {editingDepartment ? 'Update Department' : 'Create Department'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Candidate Modal */}
      {showEditCandidateModal && editingCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Edit Candidate</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name Field */}
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <Input 
                  placeholder="Enter candidate name" 
                  value={candidateForm.fullName}
                  onChange={(e) => handleCandidateFormChange('fullName', e.target.value)}
                  className={candidateFormErrors.fullName ? 'border-red-500' : ''}
                />
                {candidateFormErrors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{candidateFormErrors.fullName}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input 
                  type="email"
                  placeholder="candidate@email.com" 
                  value={candidateForm.email}
                  onChange={(e) => handleCandidateFormChange('email', e.target.value)}
                  className={candidateFormErrors.email ? 'border-red-500' : ''}
                />
                {candidateFormErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{candidateFormErrors.email}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input 
                  placeholder="+1 (555) 123-4567" 
                  value={candidateForm.phone}
                  onChange={(e) => handleCandidateFormChange('phone', e.target.value)}
                  className={candidateFormErrors.phone ? 'border-red-500' : ''}
                />
                {candidateFormErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{candidateFormErrors.phone}</p>
                )}
              </div>

              {/* Position Field */}
              <div>
                <label className="block text-sm font-medium mb-1">Position *</label>
                <Input 
                  placeholder="e.g. Software Engineer" 
                  value={candidateForm.position}
                  onChange={(e) => handleCandidateFormChange('position', e.target.value)}
                  className={candidateFormErrors.position ? 'border-red-500' : ''}
                />
                {candidateFormErrors.position && (
                  <p className="text-red-500 text-xs mt-1">{candidateFormErrors.position}</p>
                )}
              </div>

              {/* Experience Field */}
              <div>
                <label className="block text-sm font-medium mb-1">Experience (years)</label>
                <Input 
                  type="number"
                  placeholder="e.g. 3" 
                  value={candidateForm.experience}
                  onChange={(e) => handleCandidateFormChange('experience', e.target.value)}
                  className={candidateFormErrors.experience ? 'border-red-500' : ''}
                  min="0"
                  max="50"
                />
                {candidateFormErrors.experience && (
                  <p className="text-red-500 text-xs mt-1">{candidateFormErrors.experience}</p>
                )}
              </div>

              {/* Job Selection Field */}
              <div>
                <label className="block text-sm font-medium mb-1">Apply for Job *</label>
                <select 
                  className={`w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${candidateFormErrors.jobId ? 'border-red-500' : ''}`}
                  value={candidateForm.jobId}
                  onChange={(e) => handleCandidateFormChange('jobId', e.target.value)}
                >
                  <option value="">Select a job...</option>
                  {jobs.filter(job => job.status === 'active').map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} - {job.department?.name || job.department}
                    </option>
                  ))}
                </select>
                {candidateFormErrors.jobId && (
                  <p className="text-red-500 text-xs mt-1">{candidateFormErrors.jobId}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditCandidateModal(false);
                  setCandidateFormErrors({});
                  setEditingCandidate(null);
                }}
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handleCandidateUpdate}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {loading ? 'Updating...' : 'Update Candidate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruitmentManagement;

