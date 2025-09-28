import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Edit,
  Trash2,
  Share2,
  Lock,
  Unlock,
  AlertTriangle,
  Eye,
  Calendar,
  User,
  XCircle,
  Plus,
  CheckCircle,
  Clock,
  Building,
  Receipt,
  DollarSign
} from 'lucide-react';
import { Input } from '../ui/Input';
import jsPDF from 'jspdf';
import { useToast } from '../ui/Toast';
import { HRPayrollAPI } from '../../lib/hrPayrollApi';
import { api } from '../../lib/api';

const DocumentManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    documents, 
    addDocument, 
    updateDocument, 
    deleteDocument, 
    getFilteredData,
    canUserPerformAction
  } = useData();
  const [selectedTab, setSelectedTab] = useState('documents');
  const [activeTab, setActiveTab] = useState('documents');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    name: '',
    type: 'Policy',
    category: 'HR',
    description: '',
    file: null
  });
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  
  // Payslip states - using same structure as Finance
  const [payslips, setPayslips] = useState([]);
  const [payslipLoading, setPayslipLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showBankReceiptModal, setShowBankReceiptModal] = useState(false);
  const [bankReceiptData, setBankReceiptData] = useState(null);
  const [bankReceiptLoading, setBankReceiptLoading] = useState(false);

  // Get filtered documents based on user role
  const userDocuments = getFilteredData('documents', user?.role, user?.id) || documents;

  const handleDocumentFormChange = (field, value) => {
    setDocumentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentSubmit = () => {
    if (!documentForm.name || !documentForm.description) {
      console.warn('Please fill in all required fields');
      return;
    }

    const newDocument = {
      ...documentForm,
      size: documentForm.file ? `${(documentForm.file.size / 1024 / 1024).toFixed(1)} MB` : '0 MB',
      uploadedBy: user?.name || 'Current User',
      access: 'public'
    };

    addDocument(newDocument);
    setDocumentForm({
      name: '',
      type: 'Policy',
      category: 'HR',
      description: '',
      file: null
    });
    setShowDocumentForm(false);
  };

  const handleEditDocument = (document) => {
    setSelectedDocument(document);
    setDocumentForm({
      name: document.name,
      type: document.type,
      category: document.category,
      description: document.description,
      file: null
    });
    setShowEditModal(true);
  };

  const handleUpdateDocument = () => {
    if (!documentForm.name || !documentForm.description) {
      console.warn('Please fill in all required fields');
      return;
    }

    updateDocument(selectedDocument.id, {
      name: documentForm.name,
      type: documentForm.type,
      category: documentForm.category,
      description: documentForm.description
    });
    
    setShowEditModal(false);
    setSelectedDocument(null);
    setDocumentForm({
      name: '',
      type: 'Policy',
      category: 'HR',
      description: '',
      file: null
    });
  };

  const handleDeleteDocument = (documentId) => {
    console.log('Delete document requested for ID:', documentId);
    deleteDocument(documentId);
  };

  const handleDownloadDocument = (documentId) => {
    // Simulate download - increment download count
    const document = userDocuments.find(doc => doc.id === documentId);
    if (document) {
      updateDocument(documentId, { downloads: (document.downloads || 0) + 1 });
      
      // Create a downloadable file (simulate document content)
      const content = `Document: ${document.name}\nType: ${document.type}\nSize: ${document.size}\nUploaded: ${document.uploadDate}\nDescription: ${document.description || 'No description available'}\n\nThis is a simulated document download.`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${document.name}.txt`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`Document "${document.name}" downloaded successfully!`);
    }
  };

  const handleStatusUpdate = (documentId, newStatus) => {
    updateDocument(documentId, { status: newStatus });
  };

  const handleShareDocument = (documentId) => {
    // Simulate sharing functionality
    console.log('Share link copied to clipboard!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'draft':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'archived':
        return 'bg-gray-100 dark:bg-gray-900/30';
      default:
        return 'bg-red-100 dark:bg-red-900/30';
    }
  };

  // Payslip functions - using new employee-specific API
  const fetchEmployeePayslips = async () => {
    setPayslipLoading(true);
    try {
      console.log('🔍 Loading employee payslips for user:', user?.id);
      
      // Use new employee-specific endpoint
      const params = selectedMonth ? `?month=${selectedMonth}` : '';
      const response = await api.get(`/payroll/employee/my-payslips${params}`);
      
      console.log('✅ Employee payslips loaded:', response.data);
      setPayslips(response.data || []);
      
    } catch (error) {
      console.error('❌ Error fetching employee payslips:', error);
      toast.error('Failed to load payslips');
    } finally {
      setPayslipLoading(false);
    }
  };

  const generatePayslipPDF = (payslipData) => {
    try {
      const doc = new jsPDF();
      
      // Handle both old payslip data structure and new bankReceiptData structure
      const employeeName = payslipData.employee?.name || payslipData.employeeName || 'Employee';
      const employeeId = payslipData.employee?.id || payslipData.employeeId || 'N/A';
      const month = payslipData.month || payslipData.payrollMonth || 'N/A';
      const basicSalary = payslipData.salary?.basicSalary || payslipData.basicSalary || 0;
      const allowances = payslipData.salary?.allowances || payslipData.allowances || 0;
      const deductions = payslipData.salary?.deductions || payslipData.deductions || 0;
      const netSalary = payslipData.salary?.netSalary || payslipData.netSalary || payslipData.transferAmount || 0;
      const grossSalary = payslipData.salary?.grossSalary || payslipData.grossSalary || (Number(basicSalary) + Number(allowances));
      
      // Colors
      const primaryColor = [41, 128, 185]; // Blue
      const secondaryColor = [52, 73, 94]; // Dark Gray
      const accentColor = [39, 174, 96]; // Green
      const lightGray = [236, 240, 241];
      
      // Header Background
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 35, 'F');
      
      // Company Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('HITESHI INFOTECH', 105, 15, { align: 'center' });
      
      // Payslip Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('SALARY SLIP', 105, 25, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Month Badge
      doc.setFillColor(...accentColor);
      doc.roundedRect(70, 40, 70, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${month}`, 105, 48, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Employee Information Card
      let yPos = 65;
      doc.setFillColor(...lightGray);
      doc.roundedRect(15, yPos - 5, 180, 35, 3, 3, 'F');
      
      // Employee Info Header
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('EMPLOYEE INFORMATION', 20, yPos + 5);
      
      // Employee Details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      yPos += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Employee Name:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(employeeName, 75, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Employee ID:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(String(employeeId), 75, yPos);
      
      // Salary Breakdown Section
      yPos = 120;
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SALARY BREAKDOWN', 20, yPos);
      
      // Salary Table Header
      yPos += 15;
      doc.setFillColor(...primaryColor);
      doc.rect(15, yPos - 5, 180, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIPTION', 20, yPos + 2);
      doc.text('AMOUNT (₹)', 175, yPos + 2, { align: 'right' });
      
      // Reset colors
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      // Basic Salary Row
      yPos += 15;
      doc.setFillColor(250, 250, 250);
      doc.rect(15, yPos - 5, 180, 10, 'F');
      doc.setFont('helvetica', 'normal');
      doc.text('Basic Salary', 20, yPos);
      doc.text(Number(basicSalary).toLocaleString(), 175, yPos, { align: 'right' });
      
      // Allowances Row
      yPos += 12;
      doc.setFont('helvetica', 'normal');
      doc.text('Allowances', 20, yPos);
      doc.setTextColor(...accentColor);
      doc.text(`+${Number(allowances).toLocaleString()}`, 175, yPos, { align: 'right' });
      
      // Gross Salary Row
      yPos += 12;
      doc.setFillColor(240, 248, 255);
      doc.rect(15, yPos - 5, 180, 10, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Gross Salary', 20, yPos);
      doc.text(Number(grossSalary).toLocaleString(), 175, yPos, { align: 'right' });
      
      // Deductions Row
      yPos += 12;
      doc.setFont('helvetica', 'normal');
      doc.text('Total Deductions', 20, yPos);
      doc.setTextColor(231, 76, 60); // Red
      doc.text(`-${Number(deductions).toLocaleString()}`, 175, yPos, { align: 'right' });
      
      // Net Salary Section (Highlighted)
      yPos += 20;
      doc.setFillColor(...accentColor);
      doc.roundedRect(15, yPos - 8, 180, 20, 5, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('NET SALARY', 20, yPos);
      doc.setFontSize(16);
      doc.text(`₹${Number(netSalary).toLocaleString()}`, 175, yPos, { align: 'right' });
      
      // Footer
      yPos = 250;
      doc.setDrawColor(200, 200, 200);
      doc.line(15, yPos, 195, yPos);
      
      yPos += 10;
      doc.setTextColor(128, 128, 128);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('This is a system-generated payslip. No signature required.', 20, yPos);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, yPos + 6);
      
      // Company footer
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Hiteshi Infotech - HR Management System', 105, yPos + 15, { align: 'center' });
      
      // Generate filename
      const fileName = `Payslip_${employeeName.replace(/\s+/g, '_')}_${month}.pdf`;
      
      // Download the PDF
      doc.save(fileName);
      
      toast.success('Payslip downloaded successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate payslip PDF');
    }
  };

  // Load bank receipt data - using new employee-specific API
  const loadBankReceiptData = async (payrollRecord) => {
    setBankReceiptLoading(true);
    try {
      console.log('🔍 Loading payslip receipt for employee:', payrollRecord.id);
      
      // Use new employee-specific receipt endpoint
      const response = await api.get(`/payroll/employee/payslip-receipt/${payrollRecord.id}`);
      
      console.log('✅ Employee payslip receipt loaded:', response.data);
      setBankReceiptData(response.data);
      setShowBankReceiptModal(true);
      
    } catch (error) {
      console.error('❌ Error loading payslip receipt:', error);
      toast.error('Failed to load payslip details');
    } finally {
      setBankReceiptLoading(false);
    }
  };

  const handleViewPayslip = (payslip) => {
    // Pass the full payroll record to create receipt data
    loadBankReceiptData(payslip);
  };

  const handleDownloadPayslip = (payslip) => {
    // Generate PDF from the bank receipt data if available, otherwise use payslip data
    if (bankReceiptData) {
      generatePayslipPDF(bankReceiptData);
    } else {
      generatePayslipPDF(payslip);
    }
  };

  // Load payslips when payslip tab is selected
  useEffect(() => {
    if (selectedTab === 'payslips') {
      fetchEmployeePayslips();
    }
  }, [selectedTab, selectedMonth]);

  // Generate month options for the last 12 months
  const getMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM format
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      months.push({ value: monthStr, label: monthLabel });
    }
    
    return months;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Document Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Organize and manage company documents and files</p>
        </div>
        {canUserPerformAction('upload_document', user?.role) && (
          <Button 
            variant="default" 
            className="flex items-center space-x-2"
            onClick={() => setShowDocumentForm(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">186</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Documents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">162</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-3">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">18</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Draft</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-3">
                <Download className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">1,247</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Downloads</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'categories', label: 'Categories', icon: Building },
            { id: 'activity', label: 'Recent Activity', icon: Clock },
            { id: 'payslips', label: 'Pay Slips', icon: Receipt }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Documents Tab */}
      {selectedTab === 'documents' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  <option value="">All Categories</option>
                  <option value="hr-policies">HR Policies</option>
                  <option value="employee-docs">Employee Documents</option>
                  <option value="performance">Performance</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  <option value="">All Types</option>
                  <option value="policy">Policy</option>
                  <option value="template">Template</option>
                  <option value="certificate">Certificate</option>
                  <option value="personal">Personal</option>
                </select>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>More Filters</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Document</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Type</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Category</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Size</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Modified</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userDocuments.map(document => (
                      <tr key={document.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{document.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{document.description}</div>
                              <div className="flex items-center mt-1 space-x-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{document.format || 'PDF'}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">v{document.version}</span>
                                {document.access === 'private' && <Lock className="h-3 w-3 text-gray-400" />}
                                {document.access === 'restricted' && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                                {document.access === 'public' && <Unlock className="h-3 w-3 text-green-500" />}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{document.type}</td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{document.category}</td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{document.size}</td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-600 dark:text-gray-400">{document.lastModified}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">by {document.uploadedBy}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            document.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {document.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedDocument(document);
                                setShowViewModal(true);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadDocument(document.id)}
                              title="Download"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditDocument(document)}
                              title="Edit"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteDocument(document.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleShareDocument(document.id)}
                              title="Share"
                            >
                              <Share2 className="h-3 w-3" />
                            </Button>
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

      {/* Categories Tab */}
      {selectedTab === 'categories' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: 1, name: 'HR Policies', count: 45, description: 'Company policies and procedures' },
              { id: 2, name: 'Employee Documents', count: 78, description: 'Personal employee files and records' },
              { id: 3, name: 'Performance', count: 32, description: 'Performance reviews and evaluations' },
              { id: 4, name: 'Training Materials', count: 24, description: 'Training documents and resources' },
              { id: 5, name: 'Compliance', count: 18, description: 'Legal and compliance documents' },
              { id: 6, name: 'Templates', count: 15, description: 'Document templates and forms' }
            ].map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                      <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{category.count}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Tab */}
      {selectedTab === 'activity' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Document Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 1, user: 'Admin User', action: 'uploaded', document: 'Employee Handbook 2024', timestamp: '2 hours ago' },
                  { id: 2, user: 'HR Manager', action: 'updated', document: 'Leave Policy', timestamp: '4 hours ago' },
                  { id: 3, user: 'John Doe', action: 'downloaded', document: 'Performance Review Template', timestamp: '6 hours ago' },
                  { id: 4, user: 'Sarah Wilson', action: 'shared', document: 'Training Manual', timestamp: '1 day ago' },
                  { id: 5, user: 'Mike Johnson', action: 'deleted', document: 'Old Policy Document', timestamp: '2 days ago' }
                ].map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{activity.user}</span>
                        <span className="mx-2">{activity.action}</span>
                        <span className="font-medium">{activity.document}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{activity.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pay Slips Tab */}
      {selectedTab === 'payslips' && (
        <div className="space-y-6">
          {/* Month Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Filter by Month:</span>
                </div>
                <select 
                  className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">All Months</option>
                  {getMonthOptions().map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <Button 
                  variant="outline" 
                  onClick={fetchEmployeePayslips}
                  disabled={payslipLoading}
                  className="flex items-center space-x-2"
                >
                  <Search className="h-4 w-4" />
                  <span>Refresh</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payslips Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="h-5 w-5" />
                <span>My Pay Slips</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payslipLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading payslips...</p>
                  </div>
                </div>
              ) : payslips.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No payslips found</p>
                    <p className="text-sm text-gray-400">Your approved payslips will appear here</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Month</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Employee</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Net Salary</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Status</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Generated</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payslips.map(payslip => (
                        <tr key={payslip.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2">
                                <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {new Date(payslip.payrollMonth + '-01').toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long' 
                                  })}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{payslip.payrollMonth}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{payslip.employee?.name || 'Employee'}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">ID: {payslip.employee?.employeeId || payslip.employeeId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                ₹{Number(payslip.salary?.netSalary || 0).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              COMPLETED
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(payslip.updatedAt || payslip.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewPayslip(payslip)}
                                title="View Payslip Details"
                                className="flex items-center space-x-1"
                                disabled={bankReceiptLoading}
                              >
                                <Eye className="h-3 w-3" />
                                <span>View</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDownloadPayslip(payslip)}
                                title="Download PDF"
                                className="flex items-center space-x-1"
                              >
                                <Download className="h-3 w-3" />
                                <span>Download</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Document Modal */}
      {showDocumentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Upload New Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Document Name</label>
                <Input 
                  placeholder="Enter document name..." 
                  value={documentForm.name}
                  onChange={(e) => handleDocumentFormChange('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows="3"
                  placeholder="Describe the document..."
                  value={documentForm.description}
                  onChange={(e) => handleDocumentFormChange('description', e.target.value)}
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Document Type</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={documentForm.type}
                    onChange={(e) => handleDocumentFormChange('type', e.target.value)}
                  >
                    <option value="Policy">Policy</option>
                    <option value="Template">Template</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Personal">Personal</option>
                    <option value="Training">Training</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={documentForm.category}
                    onChange={(e) => handleDocumentFormChange('category', e.target.value)}
                  >
                    <option value="HR">HR Policies</option>
                    <option value="Employee">Employee Documents</option>
                    <option value="Performance">Performance</option>
                    <option value="Training">Training Materials</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Templates">Templates</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Upload File</label>
                <input
                  type="file"
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  onChange={(e) => handleDocumentFormChange('file', e.target.files[0])}
                  accept=".pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx"
                />
                <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, DOC, DOCX, TXT, XLSX, PPT, PPTX</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowDocumentForm(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleDocumentSubmit}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {showEditModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Edit Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Document Name</label>
                <Input 
                  placeholder="Enter document name..." 
                  value={documentForm.name}
                  onChange={(e) => handleDocumentFormChange('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows="3"
                  placeholder="Describe the document..."
                  value={documentForm.description}
                  onChange={(e) => handleDocumentFormChange('description', e.target.value)}
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Document Type</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={documentForm.type}
                    onChange={(e) => handleDocumentFormChange('type', e.target.value)}
                  >
                    <option value="Policy">Policy</option>
                    <option value="Template">Template</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Personal">Personal</option>
                    <option value="Training">Training</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={documentForm.category}
                    onChange={(e) => handleDocumentFormChange('category', e.target.value)}
                  >
                    <option value="HR">HR Policies</option>
                    <option value="Employee">Employee Documents</option>
                    <option value="Performance">Performance</option>
                    <option value="Training">Training Materials</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Templates">Templates</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleUpdateDocument}>
                <Edit className="h-4 w-4 mr-2" />
                Update Document
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {showViewModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedDocument.name}</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowViewModal(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Document Type</label>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedDocument.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</label>
                  <p className="text-gray-900 dark:text-white">{selectedDocument.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Size</label>
                  <p className="text-gray-900 dark:text-white">{selectedDocument.size}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Version</label>
                  <p className="text-gray-900 dark:text-white">v{selectedDocument.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Uploaded By</label>
                  <p className="text-gray-900 dark:text-white">{selectedDocument.uploadedBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedDocument.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {selectedDocument.status?.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-900 dark:text-white">{selectedDocument.description || 'No description provided.'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Modified</label>
                  <p className="text-gray-900 dark:text-white">{selectedDocument.lastModified}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Access Level</label>
                  <div className="flex items-center space-x-2">
                    {selectedDocument.access === 'private' && <Lock className="h-4 w-4 text-gray-400" />}
                    {selectedDocument.access === 'restricted' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    {selectedDocument.access === 'public' && <Unlock className="h-4 w-4 text-green-500" />}
                    <span className="text-gray-900 dark:text-white capitalize">{selectedDocument.access}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button 
                variant="default"
                onClick={() => {
                  setShowViewModal(false);
                  handleEditDocument(selectedDocument);
                }}
              >
                Edit Document
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Transfer Receipt Modal - Exact Finance UI */}
      {showBankReceiptModal && bankReceiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bank Transfer Receipt</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receipt #{bankReceiptData.receiptNumber}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowBankReceiptModal(false);
                  setBankReceiptData(null);
                }}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Transfer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Transfer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Transaction ID:</span>
                      <span className="font-mono text-sm">{bankReceiptData.transferId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Transfer Date:</span>
                      <span>{new Date(bankReceiptData.transferDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bankReceiptData.transferStatus === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : bankReceiptData.transferStatus === 'PROCESSING'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {bankReceiptData.transferStatus}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Month:</span>
                      <span>{bankReceiptData.month}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Method:</span>
                      <span>{bankReceiptData.transferMethod}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Employee Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Employee Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Employee ID:</span>
                      <span>{bankReceiptData.employee.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Name:</span>
                      <span className="font-medium">{bankReceiptData.employee.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Department:</span>
                      <span>{bankReceiptData.employee.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Designation:</span>
                      <span>{bankReceiptData.employee.designation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Email:</span>
                      <span className="text-sm">{bankReceiptData.employee.email}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Salary Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Salary Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Basic Salary:</span>
                      <span>₹{Number(bankReceiptData.salary.basicSalary || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Allowances:</span>
                      <span className="text-green-600">+₹{Number(bankReceiptData.salary.allowances || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Deductions:</span>
                      <span className="text-red-600">-₹{Number(bankReceiptData.salary.deductions || 0).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold">
                        <span>Net Salary:</span>
                        <span className="text-green-600">₹{Number(bankReceiptData.salary.netSalary || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Working Days:</span>
                        <span>{bankReceiptData.salary.workingDays}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paid Days:</span>
                        <span>{bankReceiptData.salary.paidDays}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LWP Days:</span>
                        <span>{bankReceiptData.salary.lwpDays}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Transfer Amount */}
                <Card className="border-2 border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-700 dark:text-green-400">Transfer Amount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        ₹{Number(bankReceiptData.transferAmount).toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {bankReceiptData.remarks}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Recipient Bank Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recipient Bank Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Bank Name:</span>
                      <span className="font-medium">{bankReceiptData.recipientBank.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Account Holder:</span>
                      <span>{bankReceiptData.recipientBank.accountHolderName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Account Number:</span>
                      <span className="font-mono text-sm">****{bankReceiptData.recipientBank.accountNumber.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">IFSC Code:</span>
                      <span className="font-mono text-sm">{bankReceiptData.recipientBank.ifscCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Branch:</span>
                      <span className="text-sm">{bankReceiptData.recipientBank.branchName}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Sender Bank Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sender Bank Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Company:</span>
                      <span className="font-medium">{bankReceiptData.senderBank.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Bank Name:</span>
                      <span className="font-medium">{bankReceiptData.senderBank.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Account Holder:</span>
                      <span>{bankReceiptData.senderBank.accountHolderName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Account Number:</span>
                      <span className="font-mono text-sm">****{bankReceiptData.senderBank.accountNumber.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">IFSC Code:</span>
                      <span className="font-mono text-sm">{bankReceiptData.senderBank.ifscCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Branch:</span>
                      <span className="text-sm">{bankReceiptData.senderBank.branchName}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>Generated on: {new Date(bankReceiptData.generatedAt).toLocaleString()}</p>
                  <p>This is a system-generated receipt.</p>
                </div>
                <div className="flex space-x-3">
                  <Button 
                    variant="outline"
                    onClick={() => handleDownloadPayslip(bankReceiptData)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download Payslip
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowBankReceiptModal(false);
                      setBankReceiptData(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagement;
