import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useEmployeeMode } from '../../hooks/useEmployeeMode';
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
  DollarSign,
  Settings
} from 'lucide-react';
import { Input } from '../ui/Input';
import jsPDF from 'jspdf';
import { useToast } from '../ui/Toast';
import { HRPayrollAPI } from '../../lib/hrPayrollApi';
import { api } from '../../lib/api';
import { DocumentAPI } from '../../lib/documentApi';
import DocumentUploadModal from './DocumentUploadModal';

const DocumentManagement = () => {
  const { user } = useAuth();
  const { isEmployeeMode, effectiveRole } = useEmployeeMode();
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
    documentName: '',
    typeId: '',
    categoryId: '',
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

  // Config tab states
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    categoryName: '',
    description: '',
    icon: 'folder',
    isActive: true
  });
  const [typeForm, setTypeForm] = useState({
    typeName: '',
    description: '',
    icon: 'file-text',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});

  // Upload form states
  const [activeCategories, setActiveCategories] = useState([]);
  const [activeTypes, setActiveTypes] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Real document data states
  const [realDocuments, setRealDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState(null);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  // Statistics states
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byCategory: 0,
    byType: 0
  });
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  // Get filtered documents based on user role - use real documents from backend
  const userDocuments = realDocuments.filter(doc => {
    // Search filter
    const matchesSearch = !searchTerm || 
      doc.documentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = !selectedCategory || doc.categoryId === selectedCategory;
    
    // Type filter
    const matchesType = !selectedType || doc.typeId === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const handleDocumentFormChange = (field, value) => {
    setDocumentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentSubmit = async () => {
    if (!documentForm.documentName || !documentForm.description || !documentForm.typeId || !documentForm.categoryId || !documentForm.file) {
      toast.error('Please fill in all required fields and select a file');
      return;
    }

    try {
      console.log(' Submitting document:', documentForm);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('documentName', documentForm.documentName);
      formData.append('description', documentForm.description);
      formData.append('typeId', documentForm.typeId);
      formData.append('categoryId', documentForm.categoryId);
      formData.append('files', documentForm.file);

      // Call backend API
      const response = await DocumentAPI.documents.create(formData);
      
      toast.success('Document uploaded successfully!');
      setShowDocumentForm(false);
      
      // Reset form
      setDocumentForm({
        documentName: '',
        typeId: '',
        categoryId: '',
        description: '',
        file: null
      });
      
      console.log(' Document uploaded:', response.data);
    } catch (error) {
      console.error(' Error uploading document:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    }
  };

  const handleEditDocument = (document) => {
    setSelectedDocument(document);
    setDocumentForm({
      documentName: document.documentName,
      typeId: document.typeId,
      categoryId: document.categoryId,
      description: document.description,
      file: null
    });
    
    // Load active categories and types for dropdowns
    fetchActiveDropdownData();
    setShowEditModal(true);
  };

  const handleUpdateDocument = async () => {
    if (!documentForm.documentName || !documentForm.description || !documentForm.typeId || !documentForm.categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      console.log('🔍 Updating document:', selectedDocument.id, documentForm);
      
      const updateData = {
        documentName: documentForm.documentName,
        description: documentForm.description,
        typeId: documentForm.typeId,
        categoryId: documentForm.categoryId
      };

      await DocumentAPI.documents.update(selectedDocument.id, updateData);
      
      toast.success('Document updated successfully!');
      setShowEditModal(false);
      setSelectedDocument(null);
      
      // Reset form
      setDocumentForm({
        documentName: '',
        typeId: '',
        categoryId: '',
        description: '',
        file: null
      });
      
      // Refresh document list to show updated data
      fetchRealDocuments();
      
    } catch (error) {
      console.error('❌ Error updating document:', error);
      toast.error(error.response?.data?.message || 'Failed to update document');
    }
  };

  const handleDeleteDocument = async (documentId) => {
    // Find the document to get its name for confirmation
    const document = realDocuments.find(doc => doc.id === documentId);
    if (!document) {
      toast.error('Document not found');
      return;
    }

    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${document.documentName}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) {
      return;
    }

    try {
      console.log('🗑️ Deleting document via API:', documentId, document.documentName);
      
      // Call the backend delete API
      await DocumentAPI.documents.delete(documentId);
      
      toast.success(`Document "${document.documentName}" deleted successfully!`);
      console.log('✅ Document deleted from backend:', document.documentName);
      
      // Refresh document list to remove deleted document from UI
      fetchRealDocuments();
      
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      toast.error(error.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleDownloadDocument = (documentId) => {
    // Find the document to get its public URL
    const document = realDocuments.find(doc => doc.id === documentId);
    if (!document) {
      toast.error('Document not found');
      return;
    }

    try {
      console.log('📥 Downloading document via public URL:', document.documentName);
      
      // Check if document has a public URL
      if (!document.fileUrl) {
        toast.error('Document download URL not available');
        console.error('❌ No fileUrl found for document:', document);
        return;
      }

      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = document.fileUrl;
      
      // Use original filename or fallback to document name
      const filename = document.fileName || `${document.documentName.replace(/[^a-z0-9]/gi, '_')}.${document.fileName?.split('.').pop() || 'file'}`;
      link.download = filename;
      
      // Set target to _blank to handle cross-origin downloads
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Trigger download
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Document "${document.documentName}" downloaded successfully!`);
      console.log('✅ Document downloaded via public URL:', {
        filename,
        url: document.fileUrl,
        documentName: document.documentName
      });
      
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      toast.error('Failed to download document');
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

  // Config Tab Functions
  const fetchCategories = async () => {
    try {
      setConfigLoading(true);
      const response = await DocumentAPI.categories.getAll();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setConfigLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      setConfigLoading(true);
      const response = await DocumentAPI.types.getAll();
      setTypes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching types:', error);
      toast.error('Failed to load types');
    } finally {
      setConfigLoading(false);
    }
  };

  // Load config data when config tab is selected
  useEffect(() => {
    if (selectedTab === 'config') {
      fetchCategories();
      fetchTypes();
    }
  }, [selectedTab]);

  // Form validation
  const validateCategoryForm = () => {
    const errors = {};
    if (!categoryForm.categoryName || categoryForm.categoryName.length < 2) {
      errors.categoryName = 'Category name must be at least 2 characters';
    }
    if (categoryForm.categoryName && categoryForm.categoryName.length > 100) {
      errors.categoryName = 'Category name must be less than 100 characters';
    }
    if (categoryForm.description && categoryForm.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateTypeForm = () => {
    const errors = {};
    if (!typeForm.typeName || typeForm.typeName.length < 2) {
      errors.typeName = 'Type name must be at least 2 characters';
    }
    if (typeForm.typeName && typeForm.typeName.length > 100) {
      errors.typeName = 'Type name must be less than 100 characters';
    }
    if (typeForm.description && typeForm.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Category handlers
  const handleCategorySubmit = async () => {
    if (!validateCategoryForm()) return;

    try {
      if (editingCategory) {
        await DocumentAPI.categories.update(editingCategory.id, categoryForm);
        toast.success('Category updated successfully');
      } else {
        await DocumentAPI.categories.create(categoryForm);
        toast.success('Category created successfully');
      }
      setShowCategoryModal(false);
      resetCategoryForm();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      categoryName: category.categoryName,
      description: category.description || '',
      icon: category.icon || 'folder',
      isActive: category.isActive
    });
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await DocumentAPI.categories.delete(categoryId);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      categoryName: '',
      description: '',
      icon: 'folder',
      isActive: true
    });
    setEditingCategory(null);
    setFormErrors({});
  };

  // Type handlers
  const handleTypeSubmit = async () => {
    if (!validateTypeForm()) return;

    try {
      if (editingType) {
        await DocumentAPI.types.update(editingType.id, typeForm);
        toast.success('Type updated successfully');
      } else {
        await DocumentAPI.types.create(typeForm);
        toast.success('Type created successfully');
      }
      setShowTypeModal(false);
      resetTypeForm();
      fetchTypes();
    } catch (error) {
      console.error('Error saving type:', error);
      toast.error(error.response?.data?.message || 'Failed to save type');
    }
  };

  const handleEditType = (type) => {
    setEditingType(type);
    setTypeForm({
      typeName: type.typeName,
      description: type.description || '',
      icon: type.icon || 'file-text',
      isActive: type.isActive
    });
    setShowTypeModal(true);
  };

  const handleDeleteType = async (typeId) => {
    try {
      await DocumentAPI.types.delete(typeId);
      toast.success('Type deleted successfully');
      fetchTypes();
    } catch (error) {
      console.error('Error deleting type:', error);
      toast.error('Failed to delete type');
    }
  };

  const resetTypeForm = () => {
    setTypeForm({
      typeName: '',
      description: '',
      icon: 'file-text',
      isActive: true
    });
    setEditingType(null);
    setFormErrors({});
  };

  // Icon options
  const iconOptions = [
    { value: 'folder', label: 'Folder', icon: Building },
    { value: 'file-text', label: 'Document', icon: FileText },
    { value: 'settings', label: 'Settings', icon: Settings },
    { value: 'user', label: 'User', icon: User },
    { value: 'calendar', label: 'Calendar', icon: Calendar },
    { value: 'receipt', label: 'Receipt', icon: Receipt }
  ];

  // Fetch active categories and types for dropdowns
  const fetchActiveDropdownData = async () => {
    try {
      setDropdownLoading(true);
      console.log('🔍 Fetching active categories and types for dropdowns...');
      
      const [categoriesResponse, typesResponse] = await Promise.all([
        DocumentAPI.categories.getActive(),
        DocumentAPI.types.getActive()
      ]);
      
      setActiveCategories(categoriesResponse.data.data || []);
      setActiveTypes(typesResponse.data.data || []);
      
      console.log('✅ Dropdown data loaded:', {
        categories: categoriesResponse.data.data?.length || 0,
        types: typesResponse.data.data?.length || 0
      });
    } catch (error) {
      console.error('❌ Error fetching dropdown data:', error);
      toast.error('Failed to load categories and types');
    } finally {
      setDropdownLoading(false);
    }
  };

  // Fetch real documents from backend
  const fetchRealDocuments = async () => {
    try {
      setDocumentsLoading(true);
      setDocumentsError(null);
      console.log('🔍 Fetching real documents from backend...');
      
      const response = await DocumentAPI.documents.getAll();
      const documentsData = response.data.data || [];
      
      console.log('✅ Real documents loaded:', documentsData.length);
      setRealDocuments(documentsData);
      
    } catch (error) {
      console.error('❌ Error fetching real documents:', error);
      setDocumentsError('Failed to load documents');
      toast.error('Failed to load documents from server');
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Fetch active categories for filter dropdown
  const fetchActiveCategories = async () => {
    try {
      console.log('🔍 Fetching active categories for filters...');
      const response = await DocumentAPI.categories.getActive();
      const categoriesData = response.data.data || [];
      console.log('✅ Active categories loaded:', categoriesData.length);
      setActiveCategories(categoriesData);
    } catch (error) {
      console.error('❌ Error fetching active categories:', error);
    }
  };

  // Fetch active types for filter dropdown
  const fetchActiveTypes = async () => {
    try {
      console.log('🔍 Fetching active types for filters...');
      const response = await DocumentAPI.types.getActive();
      const typesData = response.data.data || [];
      console.log('✅ Active types loaded:', typesData.length);
      setActiveTypes(typesData);
    } catch (error) {
      console.error('❌ Error fetching active types:', error);
    }
  };

  // Fetch document statistics with role-based filtering
  const fetchStatistics = async () => {
    try {
      setStatisticsLoading(true);
      console.log('🔍 Fetching document statistics...');
      const response = await DocumentAPI.documents.getStatistics();
      const statsData = response.data.data || {};
      console.log('✅ Document statistics loaded:', statsData);
      setStatistics(statsData);
    } catch (error) {
      console.error('❌ Error fetching document statistics:', error);
      // Keep default values on error
    } finally {
      setStatisticsLoading(false);
    }
  };

  // Load documents when component mounts
  useEffect(() => {
    fetchRealDocuments();
    fetchActiveCategories();
    fetchActiveTypes();
    fetchStatistics();
  }, []);

  // Load dropdown data when component mounts or when upload form opens
  useEffect(() => {
    if (showDocumentForm) {
      fetchActiveDropdownData();
    }
  }, [showDocumentForm]);

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
            onClick={() => setShowUploadModal(true)}
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
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statisticsLoading ? '...' : statistics.total}
                </div>
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
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statisticsLoading ? '...' : statistics.active}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* <Card>
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
        </Card> */}

        {/* <Card>
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
        </Card> */}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'documents', label: 'Documents', icon: FileText },
            // { id: 'categories', label: 'Categories', icon: Building },
            // { id: 'activity', label: 'Recent Activity', icon: Clock },
            { id: 'payslips', label: 'Pay Slips', icon: Receipt },
            ...(user?.role === 'admin' || user?.role === 'hr' ? [
              { id: 'config', label: 'Config', icon: Settings }
            ] : [])
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
                <select 
                  className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {activeCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
                <select 
                  className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="">All Types</option>
                  {activeTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.typeName}
                    </option>
                  ))}
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
                              <div className="font-medium text-gray-900 dark:text-white">{document.documentName}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{document.description}</div>
                              <div className="flex items-center mt-1 space-x-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{document.fileName?.split('.').pop()?.toUpperCase() || 'FILE'}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{(document.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                {document.isActive ? <Unlock className="h-3 w-3 text-green-500" /> : <Lock className="h-3 w-3 text-gray-400" />}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{document.type?.typeName || 'Unknown'}</td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{document.category?.categoryName || 'Unknown'}</td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{(document.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-600 dark:text-gray-400">{new Date(document.updatedAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">by {document.uploader?.name || 'Unknown'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            document.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {document.isActive ? 'ACTIVE' : 'INACTIVE'}
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
                            {/* Edit and Delete buttons - Only visible to Admin */}
                            {user?.role === 'admin' && (
                              <>
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
                              </>
                            )}
                            {/* <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleShareDocument(document.id)}
                              title="Share"
                            >
                              <Share2 className="h-3 w-3" />
                            </Button> */}
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
          {/* <Card>
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
          </Card> */}

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

      {/* Config Tab */}
      {selectedTab === 'config' && (
        <div className="space-y-8">
          {/* Document Categories Section */}
          {/* <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Document Categories</h2>
                <p className="text-gray-600 dark:text-gray-400">Manage document categories for organization</p>
              </div>
              <Button 
                variant="default" 
                onClick={() => {
                  resetCategoryForm();
                  setShowCategoryModal(true);
                }}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Category</span>
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Category</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Description</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Icon</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Status</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configLoading ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-gray-500">
                            Loading categories...
                          </td>
                        </tr>
                      ) : categories.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-gray-500">
                            No categories found. Create your first category.
                          </td>
                        </tr>
                      ) : (
                        categories.map(category => (
                          <tr key={category.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="py-4 px-6">
                              <div className="font-medium text-gray-900 dark:text-white">{category.categoryName}</div>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                              {category.description || 'No description'}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                {iconOptions.find(opt => opt.value === category.icon)?.icon && 
                                  React.createElement(iconOptions.find(opt => opt.value === category.icon).icon, { className: "h-4 w-4" })
                                }
                                <span className="text-sm text-gray-600 dark:text-gray-400">{category.icon}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                category.isActive 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                              }`}>
                                {category.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditCategory(category)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDeleteCategory(category.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div> */}

          {/* Document Types Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Document Types</h2>
                <p className="text-gray-600 dark:text-gray-400">Manage document types for classification</p>
              </div>
              <Button 
                variant="default" 
                onClick={() => {
                  resetTypeForm();
                  setShowTypeModal(true);
                }}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Type</span>
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Type</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Description</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Icon</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Status</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configLoading ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-gray-500">
                            Loading types...
                          </td>
                        </tr>
                      ) : types.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-gray-500">
                            No types found. Create your first type.
                          </td>
                        </tr>
                      ) : (
                        types.map(type => (
                          <tr key={type.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="py-4 px-6">
                              <div className="font-medium text-gray-900 dark:text-white">{type.typeName}</div>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                              {type.description || 'No description'}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                {iconOptions.find(opt => opt.value === type.icon)?.icon && 
                                  React.createElement(iconOptions.find(opt => opt.value === type.icon).icon, { className: "h-4 w-4" })
                                }
                                <span className="text-sm text-gray-600 dark:text-gray-400">{type.icon}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                type.isActive 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                              }`}>
                                {type.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditType(type)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDeleteType(type.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category Name *
                </label>
                <Input
                  value={categoryForm.categoryName}
                  onChange={(e) => {
                    setCategoryForm(prev => ({ ...prev, categoryName: e.target.value }));
                    validateCategoryForm();
                  }}
                  placeholder="Enter category name"
                  className={formErrors.categoryName ? 'border-red-500' : ''}
                />
                {formErrors.categoryName && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.categoryName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => {
                    setCategoryForm(prev => ({ ...prev, description: e.target.value }));
                    validateCategoryForm();
                  }}
                  placeholder="Enter description (optional)"
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    formErrors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.description && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icon
                </label>
                <select
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {iconOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="categoryActive"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="categoryActive" className="text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCategoryModal(false);
                  resetCategoryForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCategorySubmit}>
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Type Form Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingType ? 'Edit Type' : 'Add Type'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type Name *
                </label>
                <Input
                  value={typeForm.typeName}
                  onChange={(e) => {
                    setTypeForm(prev => ({ ...prev, typeName: e.target.value }));
                    validateTypeForm();
                  }}
                  placeholder="Enter type name"
                  className={formErrors.typeName ? 'border-red-500' : ''}
                />
                {formErrors.typeName && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.typeName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={typeForm.description}
                  onChange={(e) => {
                    setTypeForm(prev => ({ ...prev, description: e.target.value }));
                    validateTypeForm();
                  }}
                  placeholder="Enter description (optional)"
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    formErrors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.description && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icon
                </label>
                <select
                  value={typeForm.icon}
                  onChange={(e) => setTypeForm(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {iconOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="typeActive"
                  checked={typeForm.isActive}
                  onChange={(e) => setTypeForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="typeActive" className="text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowTypeModal(false);
                  resetTypeForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleTypeSubmit}>
                {editingType ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
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
                  value={documentForm.documentName}
                  onChange={(e) => handleDocumentFormChange('documentName', e.target.value)}
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
                    value={documentForm.typeId}
                    onChange={(e) => handleDocumentFormChange('typeId', e.target.value)}
                  >
                    <option value="">Select Type</option>
                    {dropdownLoading ? (
                      <option disabled>Loading types...</option>
                    ) : (
                      activeTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.typeName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={documentForm.categoryId}
                    onChange={(e) => handleDocumentFormChange('categoryId', e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {dropdownLoading ? (
                      <option disabled>Loading categories...</option>
                    ) : (
                      activeCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.categoryName}
                        </option>
                      ))
                    )}
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
                  value={documentForm.documentName}
                  onChange={(e) => handleDocumentFormChange('documentName', e.target.value)}
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
                    value={documentForm.typeId}
                    onChange={(e) => handleDocumentFormChange('typeId', e.target.value)}
                  >
                    <option value="">Select Type</option>
                    {dropdownLoading ? (
                      <option disabled>Loading types...</option>
                    ) : (
                      activeTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.typeName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={documentForm.categoryId}
                    onChange={(e) => handleDocumentFormChange('categoryId', e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {dropdownLoading ? (
                      <option disabled>Loading categories...</option>
                    ) : (
                      activeCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.categoryName}
                        </option>
                      ))
                    )}
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
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedDocument.documentName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Document Details</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowViewModal(false)}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Document Name</label>
                      <p className="text-gray-900 dark:text-white font-medium">{selectedDocument.documentName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">File Name</label>
                      <p className="text-gray-900 dark:text-white">{selectedDocument.fileName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Document Type</label>
                      <p className="text-gray-900 dark:text-white font-medium">{selectedDocument.type?.typeName || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</label>
                      <p className="text-gray-900 dark:text-white">{selectedDocument.category?.categoryName || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">File Size</label>
                      <p className="text-gray-900 dark:text-white">{(selectedDocument.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedDocument.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {selectedDocument.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-900 dark:text-white">
                      {selectedDocument.description || 'No description provided.'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Upload Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upload Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Uploaded By</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-1">
                          <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {selectedDocument.uploader?.name || 'Unknown User'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Upload Date</label>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(selectedDocument.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Modified</label>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(selectedDocument.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      {/* <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Document ID</label> */}
                      {/* <p className="text-gray-900 dark:text-white font-mono text-sm">{selectedDocument.id}</p> */}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* File Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">File Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">File Type</label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {selectedDocument.fileName?.split('.').pop()?.toUpperCase() || 'UNKNOWN'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">MIME Type</label>
                      <p className="text-gray-900 dark:text-white text-sm">
                        {selectedDocument.mimeType || 'application/octet-stream'}
                      </p>
                    </div>
                    {/* <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">File Path</label>
                      <p className="text-gray-900 dark:text-white text-sm font-mono">
                        {selectedDocument.filePath ? selectedDocument.filePath.split('/').pop() : 'N/A'}
                      </p>
                    </div> */}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {/* <p>Document ID: {selectedDocument.id}</p> */}
                <p>Created: {new Date(selectedDocument.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleDownloadDocument(selectedDocument.id)}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
                {/* <Button 
                  variant="default"
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditDocument(selectedDocument);
                  }}
                  className="flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Document</span>
                </Button> */}
              </div>
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

      {/* New Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={(document) => {
          console.log('Document uploaded successfully:', document);
          toast.success('Document uploaded successfully!');
          // Refresh document list to show new document
          fetchRealDocuments();
        }}
      />
    </div>
  );
};

export default DocumentManagement;
