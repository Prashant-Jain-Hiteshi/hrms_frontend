import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Users, Plus, Search, Filter, Eye, Calendar, 
  MapPin, Briefcase, Clock, CheckCircle, XCircle,
  FileText, Mail, Phone, Download, Trash2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const RecruitmentManagement = () => {
  const { user } = useAuth();
  const { 
    jobs, 
    candidates, 
    addJob, 
    updateJob, 
    deleteJob, 
    addCandidate, 
    updateCandidate, 
    deleteCandidate,
    getFilteredData,
    canUserPerformAction
  } = useData();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showJobForm, setShowJobForm] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showJobViewModal, setShowJobViewModal] = useState(false);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
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
      job.department,
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
  const [onboardingTasks, setOnboardingTasks] = useState([]);
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    jobId: ''
  });
  const [jobForm, setJobForm] = useState({
    title: '',
    department: '',
    location: '',
    type: 'Full-time',
    experience: '',
    deadline: '',
    description: ''
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [showEditJobModal, setShowEditJobModal] = useState(false);

  const initialJobs = [
    {
      id: 1,
      title: 'Senior Software Engineer',
      department: 'Engineering',
      location: 'San Francisco, CA',
      type: 'Full-time',
      experience: '5+ years',
      applications: 45,
      status: 'active',
      postedDate: '2024-02-01',
      deadline: '2024-03-01'
    },
    {
      id: 2,
      title: 'Product Manager',
      department: 'Product',
      location: 'New York, NY',
      type: 'Full-time',
      experience: '3-5 years',
      applications: 32,
      status: 'active',
      postedDate: '2024-02-05',
      deadline: '2024-02-28'
    },
    {
      id: 3,
      title: 'UX Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Contract',
      experience: '2-4 years',
      applications: 28,
      status: 'closed',
      postedDate: '2024-01-15',
      deadline: '2024-02-15'
    }
  ];

  const initialCandidates = [
    {
      id: 1,
      name: 'Alice Johnson',
      position: 'Senior Software Engineer',
      email: 'alice.johnson@email.com',
      phone: '+1 (555) 123-4567',
      experience: '6 years',
      status: 'interview',
      stage: 'Technical Round',
      appliedDate: '2024-02-10',
      rating: 4.5
    },
    {
      id: 2,
      name: 'Bob Smith',
      position: 'Product Manager',
      email: 'bob.smith@email.com',
      phone: '+1 (555) 987-6543',
      experience: '4 years',
      status: 'shortlisted',
      stage: 'Resume Review',
      appliedDate: '2024-02-12',
      rating: 4.2
    },
    {
      id: 3,
      name: 'Carol Davis',
      position: 'UX Designer',
      email: 'carol.davis@email.com',
      phone: '+1 (555) 456-7890',
      experience: '3 years',
      status: 'rejected',
      stage: 'Initial Screening',
      appliedDate: '2024-02-08',
      rating: 3.1
    }
  ];

  const recruitmentStats = [
    { name: 'Applied', value: 105, color: '#3b82f6' },
    { name: 'Shortlisted', value: 35, color: '#f59e0b' },
    { name: 'Interview', value: 18, color: '#10b981' },
    { name: 'Hired', value: 8, color: '#8b5cf6' },
    { name: 'Rejected', value: 44, color: '#ef4444' }
  ];

  const monthlyHiring = [
    { month: 'Aug', hired: 5, applications: 85 },
    { month: 'Sep', hired: 7, applications: 92 },
    { month: 'Oct', hired: 4, applications: 78 },
    { month: 'Nov', hired: 6, applications: 95 },
    { month: 'Dec', hired: 3, applications: 65 },
    { month: 'Jan', hired: 8, applications: 105 }
  ];

  const initialOnboardingTasks = [
    { id: 1, task: 'Send welcome email', status: 'completed', assignee: 'HR Team' },
    { id: 2, task: 'Prepare workspace & equipment', status: 'completed', assignee: 'IT Team' },
    { id: 3, task: 'Create system accounts', status: 'in-progress', assignee: 'IT Team' },
    { id: 4, task: 'Schedule orientation meeting', status: 'pending', assignee: 'HR Team' },
    { id: 5, task: 'Assign buddy/mentor', status: 'pending', assignee: 'Manager' },
    { id: 6, task: 'Complete documentation', status: 'pending', assignee: 'Employee' }
  ];

  // Initialize onboarding tasks
  useEffect(() => {
    setOnboardingTasks(initialOnboardingTasks);
  }, []);

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

  // Event handlers
  const handleJobFormChange = (field, value) => {
    setJobForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCandidateFormChange = (field, value) => {
    setCandidateForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCandidateSubmit = () => {
    if (!candidateForm.name || !candidateForm.email || !candidateForm.position) {
      alert('Please fill in all required fields');
      return;
    }

    addCandidate(candidateForm);
    setCandidateForm({
      name: '',
      email: '',
      phone: '',
      position: '',
      experience: '',
      jobId: ''
    });
    setShowCandidateForm(false);
  };

  const handleJobSubmit = () => {
    if (!jobForm.title || !jobForm.department || !jobForm.location) {
      alert('Please fill in all required fields');
      return;
    }

    addJob(jobForm);
    setJobForm({
      title: '',
      department: '',
      location: '',
      type: 'Full-time',
      experience: '',
      deadline: '',
      description: ''
    });
    setShowJobForm(false);
  };

  const handleJobUpdate = () => {
    if (!jobForm.title || !jobForm.department || !jobForm.location) {
      alert('Please fill in all required fields');
      return;
    }

    updateJob(selectedJob.id, {
      title: jobForm.title,
      department: jobForm.department,
      location: jobForm.location,
      type: jobForm.type,
      experience: jobForm.experience,
      deadline: jobForm.deadline,
      description: jobForm.description
    });
    
    setShowEditJobModal(false);
    setSelectedJob(null);
    setJobForm({
      title: '',
      department: '',
      location: '',
      type: 'Full-time',
      experience: '',
      deadline: '',
      description: ''
    });
  };

  const handleDeleteJob = (jobId) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      deleteJob(jobId);
    }
  };

  const handleCandidateStatusUpdate = (candidateId, newStatus) => {
    updateCandidate(candidateId, { status: newStatus });
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

  // Get role-based filtered data
  const userJobs = getFilteredData('jobs', user?.role, user?.id) || [];
  const userCandidates = getFilteredData('candidates', user?.role, user?.id) || [];

  const filteredJobs = userJobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCandidates = userCandidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          {['overview', 'jobs', 'candidates', 'onboarding'].map((tab) => (
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
                <div className="text-2xl font-bold text-blue-600">12</div>
                <p className="text-xs text-muted-foreground">3 new this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">105</div>
                <p className="text-xs text-muted-foreground">+15% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interviews Scheduled</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">18</div>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hired This Month</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">8</div>
                <p className="text-xs text-muted-foreground">Target: 10</p>
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
                      data={recruitmentStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {recruitmentStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-4 mt-4 flex-wrap">
                  {recruitmentStats.map((entry) => (
                    <div key={entry.name} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span className="text-sm">{entry.name}</span>
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
                  <BarChart data={monthlyHiring}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{job.department}</p>
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
                          {job.type} • {job.experience}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Users className="h-4 w-4 mr-2" />
                          {job.applications} applications
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                        <span>Posted: {job.postedDate}</span>
                        <span>Deadline: {job.deadline}</span>
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
                              department: job.department,
                              location: job.location,
                              type: job.type,
                              experience: job.experience,
                              deadline: job.deadline,
                              description: job.description
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
                    onClick={() => setShowCandidateForm(true)}
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
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Stage</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Rating</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-primary/10 rounded-full p-2">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{candidate.name}</div>
                              <div className="text-sm text-gray-500 flex items-center space-x-2">
                                <Mail className="h-3 w-3" />
                                <span>{candidate.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{candidate.position}</td>
                        <td className="py-3 px-4 text-sm">{candidate.experience}</td>
                        <td className="py-3 px-4 text-sm">{candidate.stage}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                            {candidate.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className="text-sm font-medium">{candidate.rating}</span>
                            <span className="text-yellow-400 ml-1">★</span>
                          </div>
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
                            {candidate.status === 'shortlisted' && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleCandidateStatusUpdate(candidate.id, 'interview')}
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                Schedule Interview
                              </Button>
                            )}
                            {candidate.status === 'interview' && (
                              <div className="flex space-x-1">
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => handleCandidateStatusUpdate(candidate.id, 'hired')}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Hire
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleCandidateStatusUpdate(candidate.id, 'rejected')}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department *</label>
                <select 
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  value={jobForm.department}
                  onChange={(e) => handleJobFormChange('department', e.target.value)}
                >
                  <option value="">Select Department</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location *</label>
                <Input 
                  placeholder="e.g. San Francisco, CA" 
                  value={jobForm.location}
                  onChange={(e) => handleJobFormChange('location', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Job Type</label>
                <select 
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  value={jobForm.type}
                  onChange={(e) => handleJobFormChange('type', e.target.value)}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Experience Required</label>
                <Input 
                  placeholder="e.g. 3-5 years" 
                  value={jobForm.experience}
                  onChange={(e) => handleJobFormChange('experience', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Application Deadline</label>
                <Input 
                  type="date" 
                  value={jobForm.deadline}
                  onChange={(e) => handleJobFormChange('deadline', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Job Description</label>
              <textarea
                className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                rows="4"
                placeholder="Describe the role, responsibilities, and requirements..."
                value={jobForm.description}
                onChange={(e) => handleJobFormChange('description', e.target.value)}
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowJobForm(false)}>
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
                    value={jobForm.department}
                    onChange={(e) => setJobForm(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="">Select Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">Human Resources</option>
                    <option value="Finance">Finance</option>
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
                    value={jobForm.type}
                    onChange={(e) => setJobForm(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Experience Required</label>
                  <Input 
                    placeholder="e.g., 3-5 years" 
                    value={jobForm.experience}
                    onChange={(e) => setJobForm(prev => ({ ...prev, experience: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Application Deadline</label>
                <Input 
                  type="date" 
                  value={jobForm.deadline}
                  onChange={(e) => setJobForm(prev => ({ ...prev, deadline: e.target.value }))}
                />
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
                  <p className="text-gray-900 dark:text-white font-medium">{selectedJob.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Location</label>
                  <p className="text-gray-900 dark:text-white">{selectedJob.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Job Type</label>
                  <p className="text-gray-900 dark:text-white">{selectedJob.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Experience Required</label>
                  <p className="text-gray-900 dark:text-white">{selectedJob.experience}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Applications</label>
                  <p className="text-gray-900 dark:text-white">{selectedJob.applications} candidates</p>
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
                  <p className="text-gray-900 dark:text-white">{selectedJob.postedDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Application Deadline</label>
                  <p className="text-gray-900 dark:text-white">{selectedJob.deadline}</p>
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
                  setJobForm({
                    title: selectedJob.title,
                    department: selectedJob.department,
                    location: selectedJob.location,
                    type: selectedJob.type,
                    experience: selectedJob.experience,
                    deadline: selectedJob.deadline,
                    description: selectedJob.description
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
                  value={candidateForm.name}
                  onChange={(e) => handleCandidateFormChange('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input 
                  type="email"
                  placeholder="candidate@email.com" 
                  value={candidateForm.email}
                  onChange={(e) => handleCandidateFormChange('email', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input 
                  placeholder="+1 (555) 123-4567" 
                  value={candidateForm.phone}
                  onChange={(e) => handleCandidateFormChange('phone', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Position *</label>
                <Input 
                  placeholder="e.g. Software Engineer" 
                  value={candidateForm.position}
                  onChange={(e) => handleCandidateFormChange('position', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Experience</label>
                <Input 
                  placeholder="e.g. 3 years" 
                  value={candidateForm.experience}
                  onChange={(e) => handleCandidateFormChange('experience', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apply for Job</label>
                <select 
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  value={candidateForm.jobId}
                  onChange={(e) => handleCandidateFormChange('jobId', e.target.value)}
                >
                  <option value="">Select a job...</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowCandidateForm(false)}>
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
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
                    <div className="flex items-center">
                      <span className="font-medium">{selectedCandidate.rating}</span>
                      <span className="text-yellow-400 ml-1">★</span>
                    </div>
                  </div>
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
    </div>
  );
};

export default RecruitmentManagement;
