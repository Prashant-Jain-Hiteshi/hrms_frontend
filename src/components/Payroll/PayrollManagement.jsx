import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  DollarSign, Plus, Search, Filter, Calendar, 
  TrendingUp, Users, FileText, Download, Edit, 
  Trash2, Receipt, Eye, Activity, Clock, XCircle,
  Settings, Building2, CreditCard, Percent
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import PayrollProgressChart from './PayrollProgressChart';
import { PayrollSetupAPI } from '../../lib/payrollSetupApi';
import { HRPayrollAPI } from '../../lib/hrPayrollApi';
import { toast } from 'react-toastify';
import CompanyPayrollInfo from './CompanyPayrollInfo';

const PayrollManagement = () => {
  const { user } = useAuth();
  const { 
    employees, 
    payrolls, 
    departments,
    fetchPayrolls,
    payrollLoading,
    payrollStats,
    employeesLoading,
    departmentsLoading
  } = useData();
  
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  // Setup Tab States
  const [payComponents, setPayComponents] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  
  // Tax & Compliance Tab States
  const [taxConfigData, setTaxConfigData] = useState({
    pfMinimumSalary: '',
    pfEmployeeRate: '',
    pfEmployerRate: '',
    esiMinimumSalary: '',
    esiEmployeeRate: '',
    esiEmployerRate: '',
    professionalTaxAmount: '',
    professionalTaxMinimumSalary: '',
    tdsExemptionLimit: '',
    notes: ''
  });
  const [taxConfigErrors, setTaxConfigErrors] = useState({});
  const [taxConfigLoading, setTaxConfigLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);
  const [componentForm, setComponentForm] = useState({
    name: '',
    type: 'EARNING',
    calculationMethod: 'FIXED',
    value: '',
    taxable: true,
    description: ''
  });
  const [bankForm, setBankForm] = useState({
    bankName: '',
    branchName: '',
    accountNumber: '',
    ifscCode: '',
    isDefault: false,
    accountHolderName: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // HR Payroll States
  const [hrPayrollRecords, setHrPayrollRecords] = useState([]);
  const [hrPayrollSummary, setHrPayrollSummary] = useState(null);
  const [hrPayrollLoading, setHrPayrollLoading] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedPayrollRecord, setSelectedPayrollRecord] = useState(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustmentType: 'ALLOWANCE',
    adjustmentName: '',
    amount: '',
    reason: ''
  });

  // Format payroll data for charts
  const payrollData = useMemo(() => {
    if (!payrolls?.length) return [];
    
    // Group by month
    const monthlyData = payrolls.reduce((acc, payroll) => {
      const date = new Date(payroll.payPeriodStart);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const key = `${month} ${year}`;
      
      if (!acc[key]) {
        acc[key] = {
          month: month,
          year: year,
          gross: 0,
          net: 0,
          deductions: 0
        };
      }
      
      acc[key].gross += payroll.grossSalary || 0;
      acc[key].net += payroll.netSalary || 0;
      acc[key].deductions += (payroll.totalDeductions || 0);
      
      return acc;
    }, {});
    
    return Object.values(monthlyData);
  }, [payrolls]);
  
  // Filtered employee payroll data
  const employeePayroll = useMemo(() => {
    // If we have real payroll data from backend, use it
    if (payrolls?.length > 0) {
      return payrolls.map(payroll => {
        const employee = employees.find(e => e.id === payroll.employeeId) || {};
        const department = departments.find(d => d.id === employee.departmentId) || {};
        
        return {
          id: payroll.id,
          name: employee.name || 'Unknown',
          position: employee.position || 'N/A',
          department: department.name || 'N/A',
          basicSalary: payroll.basicSalary || 0,
          allowances: payroll.totalAllowances || 0,
          deductions: payroll.totalDeductions || 0,
          netSalary: payroll.netSalary || 0,
          status: payroll.status?.toLowerCase() || 'pending',
          payPeriod: payroll.payPeriod,
          paymentDate: payroll.paymentDate,
          paymentMethod: payroll.paymentMethod || 'Bank Transfer'
        };
      });
    }
    
    // If no payroll data but we have employees, create mock payroll data
    if (employees?.length > 0) {
      return employees.slice(0, 10).map((employee, index) => {
        const department = departments.find(d => d.id === employee.departmentId) || 
                          departments.find(d => d.name === employee.department) || 
                          { name: employee.department || 'Unknown' };
        
        // Generate realistic payroll data based on employee info
        const basicSalary = employee.salary || (Math.floor(Math.random() * 50000) + 30000);
        const allowances = Math.floor(basicSalary * 0.15);
        const deductions = Math.floor(basicSalary * 0.18);
        const netSalary = basicSalary + allowances - deductions;
        
        return {
          id: `mock-${employee.id || index}`,
          name: employee.name || `Employee ${index + 1}`,
          position: employee.position || employee.designation || 'Staff',
          department: department.name || 'General',
          basicSalary,
          allowances,
          deductions,
          netSalary,
          status: index % 3 === 0 ? 'pending' : 'processed',
          payPeriod: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'Bank Transfer'
        };
      });
    }
    
    // Fallback: create basic mock data
    return [
      {
        id: 'mock-1',
        name: 'John Doe',
        position: 'Software Engineer',
        department: 'Engineering',
        basicSalary: 8000,
        allowances: 1200,
        deductions: 1800,
        netSalary: 7400,
        status: 'processed',
        payPeriod: '2024-02',
        paymentDate: '2024-02-28',
        paymentMethod: 'Bank Transfer'
      },
      {
        id: 'mock-2',
        name: 'Jane Smith',
        position: 'Product Manager',
        department: 'Product',
        basicSalary: 9500,
        allowances: 1500,
        deductions: 2100,
        netSalary: 8900,
        status: 'processed',
        payPeriod: '2024-02',
        paymentDate: '2024-02-28',
        paymentMethod: 'Bank Transfer'
      },
      {
        id: 'mock-3',
        name: 'Mike Johnson',
        position: 'Designer',
        department: 'Design',
        basicSalary: 7000,
        allowances: 1000,
        deductions: 1600,
        netSalary: 6400,
        status: 'pending',
        payPeriod: '2024-02',
        paymentDate: null,
        paymentMethod: 'Bank Transfer'
      }
    ];
  }, [payrolls, employees, departments]);
  
  // Filtered reimbursements - will be populated from API when available
  const reimbursements = useMemo(() => {
    return [
      {
        id: 1,
        employee: 'John Doe',
        type: 'Travel',
        amount: 250,
        date: '2024-02-15',
        description: 'Client meeting travel expenses',
        status: 'pending'
      },
      {
        id: 2,
        employee: 'Jane Smith',
        type: 'Medical',
        amount: 150,
        date: '2024-02-14',
        description: 'Health checkup reimbursement',
        status: 'approved'
      },
      {
        id: 3,
        employee: 'Mike Johnson',
        type: 'Office Supplies',
        amount: 75,
        date: '2024-02-13',
        description: 'Laptop accessories purchase',
        status: 'rejected'
      }
    ];
  }, []);
  
  // Apply filters to payroll data
  const filteredPayrolls = useMemo(() => {
    return employeePayroll.filter(payroll => {
      const matchesSearch = !searchTerm || 
        payroll.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payroll.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !filters.status || payroll.status === filters.status.toLowerCase();
      const matchesDept = !filters.department || payroll.department === filters.department;
      
      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [employeePayroll, searchTerm, filters]);
  
  // Fetch data on component mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('PayrollManagement: Loading payroll data with filters:', filters);
        console.log('PayrollManagement: Current employees count:', employees?.length || 0);
        console.log('PayrollManagement: Current departments count:', departments?.length || 0);
        console.log('PayrollManagement: Current payrolls count:', payrolls?.length || 0);
        
        await fetchPayrolls({
          month: filters.month,
          year: filters.year,
          status: filters.status || undefined,
          department: filters.department || undefined
        });
      } catch (error) {
        console.error('Error loading payroll data:', error);
      }
    };
    
    loadData();
  }, [filters, fetchPayrolls]);
  
  // Debug logging for data changes
  useEffect(() => {
    console.log('PayrollManagement: Employee payroll data updated:', {
      employeePayrollCount: employeePayroll?.length || 0,
      filteredPayrollsCount: filteredPayrolls?.length || 0,
      employeesCount: employees?.length || 0,
      payrollsCount: payrolls?.length || 0
    });
  }, [employeePayroll, filteredPayrolls, employees, payrolls]);

  // Load setup data when setup tab is selected
  useEffect(() => {
    if (selectedTab === 'setup') {
      loadSetupData();
    }
  }, [selectedTab]);

  // Load tax config data when tax compliance tab is selected
  useEffect(() => {
    if (selectedTab === 'taxcompliance') {
      loadTaxConfigData();
    }
  }, [selectedTab]);

  // Load HR payroll data when payroll tab is selected
  useEffect(() => {
    if (selectedTab === 'payroll') {
      loadHRPayrollData();
    }
  }, [selectedTab, payrollMonth]);

  // HR Payroll Functions
  const loadHRPayrollData = async () => {
    setHrPayrollLoading(true);
    try {
      const [recordsRes, summaryRes] = await Promise.all([
        HRPayrollAPI.getPayrollRecords(payrollMonth),
        HRPayrollAPI.getPayrollSummary(payrollMonth)
      ]);
      
      setHrPayrollRecords(recordsRes.data || []);
      setHrPayrollSummary(summaryRes.data || null);
    } catch (error) {
      console.error('Error loading HR payroll data:', error);
      toast.error('Failed to load payroll data');
    } finally {
      setHrPayrollLoading(false);
    }
  };

  const handleCalculatePayroll = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select employees to calculate payroll');
      return;
    }

    setHrPayrollLoading(true);
    try {
      const response = await HRPayrollAPI.calculatePayrollBatch({
        employeeIds: selectedEmployees,
        month: payrollMonth
      });

      if (response.data.success) {
        toast.success(`Payroll calculated for ${response.data.processed} employees`);
        if (response.data.failed > 0) {
          toast.warning(`${response.data.failed} employees failed to process`);
        }
        loadHRPayrollData(); // Reload data
        setSelectedEmployees([]);
        setShowCalculateModal(false);
      } else {
        toast.error('Failed to calculate payroll');
      }
    } catch (error) {
      console.error('Error calculating payroll:', error);
      toast.error('Failed to calculate payroll');
    } finally {
      setHrPayrollLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    const calculatedRecords = hrPayrollRecords.filter(record => record.status === 'CALCULATED');
    
    if (calculatedRecords.length === 0) {
      toast.error('No calculated records to approve');
      return;
    }

    setHrPayrollLoading(true);
    try {
      const response = await HRPayrollAPI.bulkApprovePayroll({
        payrollRecordIds: calculatedRecords.map(record => record.id),
        approvalNotes: 'Bulk approved by HR'
      });

      toast.success(`Approved ${calculatedRecords.length} payroll records`);
      loadHRPayrollData(); // Reload data
    } catch (error) {
      console.error('Error approving payroll:', error);
      toast.error('Failed to approve payroll records');
    } finally {
      setHrPayrollLoading(false);
    }
  };

  const handleEmployeeSelection = (employeeId, isSelected) => {
    if (isSelected) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    }
  };

  const handleSelectAllEmployees = (isSelected) => {
    if (isSelected) {
      setSelectedEmployees(hrPayrollRecords.map(record => record.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  // HR Payroll Status Colors
  const getHRPayrollStatusColor = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'CALCULATED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'HR_APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'PROCESSED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Setup Tab Functions
  // Tax & Compliance Functions
  const loadTaxConfigData = async () => {
    setTaxConfigLoading(true);
    try {
      const response = await PayrollSetupAPI.getStatutorySettings();
      if (response.data) {
        setTaxConfigData({
          pfMinimumSalary: response.data.pfMinimumSalary || '',
          pfEmployeeRate: response.data.pfEmployeeRate || '',
          pfEmployerRate: response.data.pfEmployerRate || '',
          esiMinimumSalary: response.data.esiMinimumSalary || '',
          esiEmployeeRate: response.data.esiEmployeeRate || '',
          esiEmployerRate: response.data.esiEmployerRate || '',
          professionalTaxAmount: response.data.professionalTaxAmount || '',
          professionalTaxMinimumSalary: response.data.professionalTaxMinimumSalary || '',
          tdsExemptionLimit: response.data.tdsExemptionLimit || '',
          notes: response.data.notes || ''
        });
      }
    } catch (error) {
      console.error('Error loading tax config:', error);
      toast.error('Failed to load tax configuration');
    } finally {
      setTaxConfigLoading(false);
    }
  };

  const validateTaxConfigForm = () => {
    const errors = {};
    
    // Basic validation - all fields are optional, but if provided must be valid numbers
    const numericFields = [
      'pfMinimumSalary', 'pfEmployeeRate', 'pfEmployerRate',
      'esiMinimumSalary', 'esiEmployeeRate', 'esiEmployerRate',
      'professionalTaxAmount', 'professionalTaxMinimumSalary', 'tdsExemptionLimit'
    ];
    
    numericFields.forEach(field => {
      const value = taxConfigData[field];
      if (value !== '' && (isNaN(value) || Number(value) < 0)) {
        errors[field] = 'Must be a valid positive number';
      }
    });
    
    // Percentage fields should not exceed 100
    const percentageFields = ['pfEmployeeRate', 'pfEmployerRate', 'esiEmployeeRate', 'esiEmployerRate'];
    percentageFields.forEach(field => {
      const value = taxConfigData[field];
      if (value !== '' && Number(value) > 100) {
        errors[field] = 'Percentage cannot exceed 100%';
      }
    });
    
    setTaxConfigErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTaxConfigSubmit = async (e) => {
    e.preventDefault();
    if (!validateTaxConfigForm()) return;
    
    setTaxConfigLoading(true);
    try {
      // Convert empty strings to null for API
      const formData = {};
      Object.keys(taxConfigData).forEach(key => {
        if (key === 'notes') {
          formData[key] = taxConfigData[key];
        } else {
          formData[key] = taxConfigData[key] === '' ? null : Number(taxConfigData[key]);
        }
      });

      await PayrollSetupAPI.updateStatutorySettings(formData);
      toast.success('Tax configuration updated successfully');
      loadTaxConfigData(); // Reload to get updated data
    } catch (error) {
      console.error('Error saving tax config:', error);
      toast.error(error.response?.data?.message || 'Failed to save tax configuration');
    } finally {
      setTaxConfigLoading(false);
    }
  };

  const loadSetupData = async () => {
    setSetupLoading(true);
    try {
      const [componentsRes, bankAccountsRes] = await Promise.all([
        PayrollSetupAPI.getPayComponents(),
        PayrollSetupAPI.getBankAccounts()
      ]);
      
      setPayComponents(componentsRes.data || []);
      setBankAccounts(bankAccountsRes.data || []);
    } catch (error) {
      console.error('Error loading setup data:', error);
      toast.error('Failed to load setup data');
    } finally {
      setSetupLoading(false);
    }
  };

  // Component Form Functions
  const resetComponentForm = () => {
    setComponentForm({
      name: '',
      type: 'EARNING',
      calculationMethod: 'FIXED',
      value: '',
      taxable: true,
      description: ''
    });
    setFormErrors({});
    setSelectedComponent(null);
  };

  const validateComponentForm = () => {
    const errors = {};
    
    if (!componentForm.name.trim()) {
      errors.name = 'Component name is required';
    }
    
    if (!componentForm.value || componentForm.value <= 0) {
      errors.value = 'Value must be greater than 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleComponentSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateComponentForm()) {
      return;
    }

    setSetupLoading(true);
    try {
      const formData = {
        ...componentForm,
        value: parseFloat(componentForm.value)
      };

      if (selectedComponent) {
        await PayrollSetupAPI.updatePayComponent(selectedComponent.id, formData);
        toast.success('Component updated successfully');
      } else {
        await PayrollSetupAPI.createPayComponent(formData);
        toast.success('Component created successfully');
      }

      setShowComponentModal(false);
      resetComponentForm();
      loadSetupData();
    } catch (error) {
      console.error('Error saving component:', error);
      toast.error(error.response?.data?.message || 'Failed to save component');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleEditComponent = (component) => {
    setSelectedComponent(component);
    setComponentForm({
      name: component.name,
      type: component.type,
      calculationMethod: component.calculationMethod,
      value: component.value.toString(),
      taxable: component.taxable,
      description: component.description || ''
    });
    setShowComponentModal(true);
  };

  const handleDeleteComponent = async (component) => {
    if (!confirm(`Are you sure you want to delete "${component.name}"?`)) {
      return;
    }

    setSetupLoading(true);
    try {
      await PayrollSetupAPI.deletePayComponent(component.id);
      toast.success('Component deleted successfully');
      loadSetupData();
    } catch (error) {
      console.error('Error deleting component:', error);
      toast.error(error.response?.data?.message || 'Failed to delete component');
    } finally {
      setSetupLoading(false);
    }
  };

  // Bank Account Form Functions
  const resetBankForm = () => {
    setBankForm({
      bankName: '',
      branchName: '',
      accountNumber: '',
      ifscCode: '',
      isDefault: false,
      accountHolderName: '',
      notes: ''
    });
    setFormErrors({});
    setSelectedBankAccount(null);
  };

  const validateBankForm = () => {
    const errors = {};
    
    if (!bankForm.bankName.trim()) {
      errors.bankName = 'Bank name is required';
    }
    
    if (!bankForm.branchName.trim()) {
      errors.branchName = 'Branch name is required';
    }
    
    if (!bankForm.accountNumber.trim()) {
      errors.accountNumber = 'Account number is required';
    }
    
    if (!bankForm.ifscCode.trim()) {
      errors.ifscCode = 'IFSC code is required';
    } else if (bankForm.ifscCode.length !== 11) {
      errors.ifscCode = 'IFSC code must be 11 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateBankForm()) {
      return;
    }

    setSetupLoading(true);
    try {
      if (selectedBankAccount) {
        await PayrollSetupAPI.updateBankAccount(selectedBankAccount.id, bankForm);
        toast.success('Bank account updated successfully');
      } else {
        await PayrollSetupAPI.createBankAccount(bankForm);
        toast.success('Bank account created successfully');
      }

      setShowBankModal(false);
      resetBankForm();
      loadSetupData();
    } catch (error) {
      console.error('Error saving bank account:', error);
      toast.error(error.response?.data?.message || 'Failed to save bank account');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleEditBankAccount = (bankAccount) => {
    setSelectedBankAccount(bankAccount);
    setBankForm({
      bankName: bankAccount.bankName,
      branchName: bankAccount.branchName,
      accountNumber: bankAccount.accountNumber,
      ifscCode: bankAccount.ifscCode,
      isDefault: bankAccount.isDefault,
      accountHolderName: bankAccount.accountHolderName || '',
      notes: bankAccount.notes || ''
    });
    setShowBankModal(true);
  };

  const handleDeleteBankAccount = async (bankAccount) => {
    if (!confirm(`Are you sure you want to delete "${bankAccount.bankName}" account?`)) {
      return;
    }

    setSetupLoading(true);
    try {
      await PayrollSetupAPI.deleteBankAccount(bankAccount.id);
      toast.success('Bank account deleted successfully');
      loadSetupData();
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast.error(error.response?.data?.message || 'Failed to delete bank account');
    } finally {
      setSetupLoading(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle view payroll details
  const handleViewPayroll = (payroll) => {
    setSelectedPayroll(payroll);
    setShowViewModal(true);
  };
  
  // Handle process payroll
  const handleProcessPayroll = async () => {
    try {
      // This would be implemented when the process payroll functionality is ready
      console.log('Processing payroll with filters:', filters);
      // await processPayroll({
      //   month: filters.month,
      //   year: filters.year,
      //   department: filters.department || undefined
      // });
    } catch (error) {
      console.error('Error processing payroll:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed':
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const filteredPayroll = employeePayroll.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generatePayslip = (employee) => {
    // In a real app, this would generate a PDF
    alert(`Payslip generated for ${employee.name}`);
  };

  const handleBulkExport = () => {
    // Generate bulk payroll report
    const csvContent = generateBulkPayrollCSV();
    const filename = `bulk_payroll_report_${new Date().toISOString().split('T')[0]}.csv`;
    
    downloadCSV(csvContent, filename);
    alert('Bulk payroll report exported successfully!');
  };
  
  const generateBulkPayrollCSV = () => {
    const headers = ['Employee ID', 'Employee Name', 'Month', 'Basic Salary', 'Allowances', 'Overtime', 'Gross Salary', 'Tax Deduction', 'Other Deductions', 'Net Salary', 'Status'];
    const data = employeePayroll.map(payslip => [
      payslip.id,
      payslip.name,
      selectedMonth,
      payslip.basicSalary,
      payslip.allowances,
      0,
      payslip.basicSalary + payslip.allowances,
      0,
      payslip.deductions,
      payslip.netSalary,
      payslip.status
    ]);
    return convertToCSV([headers, ...data]);
  };

  const handleDownloadPayslip = (payslipId) => {
    const payslip = employeePayroll.find(p => p.id === payslipId);
    if (!payslip) return;
    
    // Generate CSV content for payslip
    const csvContent = generatePayslipCSV(payslip);
    const filename = `payslip_${payslip.name.replace(/\s+/g, '_')}_${selectedMonth.replace(/\s+/g, '_')}.csv`;
    
    downloadCSV(csvContent, filename);
    alert(`Payslip for ${payslip.name} downloaded successfully!`);
  };
  
  const generatePayslipCSV = (payslip) => {
    const headers = ['Field', 'Amount'];
    const data = [
      ['Employee Name', payslip.name],
      ['Employee ID', payslip.id],
      ['Month', selectedMonth],
      ['Basic Salary', payslip.basicSalary],
      ['Allowances', payslip.allowances],
      ['Overtime', 0],
      ['Gross Salary', payslip.basicSalary + payslip.allowances],
      ['Tax Deduction', 0],
      ['Other Deductions', payslip.deductions],
      ['Net Salary', payslip.netSalary],
      ['Status', payslip.status]
    ];
    return convertToCSV([headers, ...data]);
  };
  
  const convertToCSV = (data) => {
    return data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };
  
  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payroll Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage payroll, salaries, and reimbursements</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2" onClick={handleBulkExport}>
            <Download className="h-4 w-4" />
            <span>Export Payroll</span>
          </Button>
          <Button variant="default" className="flex items-center space-x-2" onClick={() => alert('Payroll processing functionality coming soon!')}>
            <FileText className="h-4 w-4" />
            <span>Process Payroll</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {(user?.role === 'hr' 
            ? ['overview', 'payroll'] 
            : ['overview', 'payroll', 'setup', 'templates', 'settings', 'taxcompliance', 'reimbursements']
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                selectedTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'taxcompliance' ? 'Tax & Compliance' : tab}
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
                <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">$420,000</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employees Paid</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">48</div>
                <p className="text-xs text-muted-foreground">Out of 50 employees</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reimbursements</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">$1,250</div>
                <p className="text-xs text-muted-foreground">5 requests pending</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Salary</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">$8,750</div>
                <p className="text-xs text-muted-foreground">+5% from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PayrollProgressChart 
              payrollData={employeePayroll} 
              title="Payroll Processing Progress"
            />

            <Card>
              <CardHeader>
                <CardTitle>Salary Distribution</CardTitle>
                <CardDescription>Department-wise salary breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { dept: 'Engineering', amount: 180000, percentage: 43 },
                    { dept: 'Sales', amount: 120000, percentage: 29 },
                    { dept: 'Marketing', amount: 80000, percentage: 19 },
                    { dept: 'HR', amount: 40000, percentage: 9 }
                  ].map((item) => (
                    <div key={item.dept} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <span className="font-medium">{item.dept}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${item.amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employee Salary Summary */}
          {user?.role === 'employee' && (
            <Card>
              <CardHeader>
                <CardTitle>Your Salary Summary</CardTitle>
                <CardDescription>Current month breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">$8,000</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Basic Salary</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">$1,200</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Allowances</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">$1,800</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Deductions</div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-primary/10 rounded-lg text-center">
                  <div className="text-3xl font-bold text-primary">$7,400</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Net Salary</div>
                  <Button variant="outline" className="mt-3" onClick={() => generatePayslip({ name: user.name })}>
                    <FileText className="h-4 w-4 mr-2" />
                    Download Payslip
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Payroll Tab */}
      {selectedTab === 'payroll' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Payroll</CardTitle>
              <CardDescription>Manage employee salaries and payslips</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <input
                    type="month"
                    value={payrollMonth}
                    onChange={(e) => setPayrollMonth(e.target.value)}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  />
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </Button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Button 
                    onClick={() => setShowCalculateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
                    disabled={hrPayrollLoading}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Calculate Payroll</span>
                  </Button>
                  <Button 
                    onClick={handleBulkApprove}
                    variant="outline"
                    disabled={selectedEmployees.length === 0 || hrPayrollLoading}
                    className="flex items-center space-x-2"
                  >
                    <span>Approve Selected ({selectedEmployees.length})</span>
                  </Button>
                </div>
              </div>

              {/* Summary Cards */}
              {hrPayrollSummary && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{hrPayrollSummary.totalEmployees}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Employees</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">₹{hrPayrollSummary.totalNetSalary?.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Net Salary</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{hrPayrollSummary.statusBreakdown?.calculated || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{hrPayrollSummary.statusBreakdown?.approved || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Approved</div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="w-12 py-3 px-4">
                        <input 
                          type="checkbox" 
                          onChange={(e) => handleSelectAllEmployees(e.target.checked)}
                          checked={selectedEmployees.length > 0 && selectedEmployees.length === hrPayrollRecords.length}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Employee</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Department</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Basic Salary</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Allowances</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Deductions</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Net Salary</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hrPayrollLoading ? (
                      <tr>
                        <td colSpan="9" className="py-8 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>Loading payroll data...</span>
                          </div>
                        </td>
                      </tr>
                    ) : hrPayrollRecords.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-8 text-center text-gray-500">
                          No payroll records found for {payrollMonth}. Click "Calculate Payroll" to generate records.
                        </td>
                      </tr>
                    ) : (
                      hrPayrollRecords
                        .filter(record => 
                          !searchTerm || 
                          record.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.employee?.department?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((record) => (
                          <tr key={record.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-3 px-4">
                              <input 
                                type="checkbox" 
                                checked={selectedEmployees.includes(record.id)}
                                onChange={(e) => handleEmployeeSelection(record.id, e.target.checked)}
                                className="rounded border-gray-300"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="bg-primary/10 rounded-full p-2">
                                  <Users className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium">{record.employee?.name || 'Unknown'}</div>
                                  <div className="text-sm text-gray-500">{record.employee?.designation || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm">{record.employee?.department || 'N/A'}</td>
                            <td className="py-3 px-4 text-sm">₹{Number(record.baseSalary || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-sm">
                              ₹{Object.values(record.allowances || {}).reduce((sum, val) => sum + Number(val), 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              ₹{Number(record.totalDeductions || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium">₹{Number(record.netSalary || 0).toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getHRPayrollStatusColor(record.status)}`}>
                                {record.status?.replace('_', ' ') || 'DRAFT'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPayrollRecord(record);
                                    setShowViewModal(true);
                                  }}
                                  className="flex items-center space-x-1"
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>View</span>
                                </Button>
                                {record.status === 'CALCULATED' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedPayrollRecord(record);
                                      setShowAdjustModal(true);
                                    }}
                                    className="flex items-center space-x-1"
                                  >
                                    <Edit className="h-3 w-3" />
                                    <span>Adjust</span>
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => generatePayslip(record)}
                                  className="flex items-center space-x-1"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span>Payslip</span>
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
      )}

      {/* Setup Tab */}
      {selectedTab === 'setup' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Payroll Setup</span>
              </CardTitle>
              <CardDescription>
                Configure pay components and bank accounts for payroll processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => {
                    resetComponentForm();
                    setShowComponentModal(true);
                  }}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Component</span>
                </Button>
                <Button 
                  onClick={() => {
                    resetBankForm();
                    setShowBankModal(true);
                  }}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Building2 className="h-4 w-4" />
                  <span>Add Bank Account</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pay Components Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Pay Components</span>
              </CardTitle>
              <CardDescription>
                Manage salary components like basic salary, allowances, and deductions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {setupLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : payComponents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No pay components configured yet. Add your first component to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {payComponents.map((component) => (
                    <div
                      key={component.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {component.type === 'EARNING' ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                          )}
                          <h3 className="font-medium text-sm">{component.name}</h3>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditComponent(component)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteComponent(component)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            component.type === 'EARNING' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {component.type}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Method:</span>
                          <span>{component.calculationMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Value:</span>
                          <span className="font-medium">
                            {component.calculationMethod === 'FIXED' ? '$' : ''}{component.value}
                            {component.calculationMethod !== 'FIXED' ? '%' : ''}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxable:</span>
                          <span>{component.taxable ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                      {component.description && (
                        <p className="text-xs text-gray-500 mt-2">{component.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank Accounts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Company Bank Accounts</span>
              </CardTitle>
              <CardDescription>
                Manage bank accounts for salary payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {setupLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : bankAccounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No bank accounts configured yet. Add your first bank account to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-blue-500" />
                          <h3 className="font-medium text-sm">{account.bankName}</h3>
                          {account.isDefault && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditBankAccount(account)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteBankAccount(account)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Branch:</span>
                          <span>{account.branchName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Account:</span>
                          <span className="font-mono">****{account.accountNumber.slice(-4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IFSC:</span>
                          <span className="font-mono">{account.ifscCode}</span>
                        </div>
                        {account.accountHolderName && (
                          <div className="flex justify-between">
                            <span>Holder:</span>
                            <span>{account.accountHolderName}</span>
                          </div>
                        )}
                      </div>
                      {account.notes && (
                        <p className="text-xs text-gray-500 mt-2">{account.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Templates Tab - Placeholder */}
      {selectedTab === 'templates' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Salary Templates</span>
              </CardTitle>
              <CardDescription>
                Create and manage salary templates for different employee categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Templates Coming Soon</p>
                <p className="text-sm">This feature will be available in the next update.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {selectedTab === 'settings' && (
        <div className="space-y-6">
          <CompanyPayrollInfo />
          
          {/* Future sections placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Additional Settings</span>
              </CardTitle>
              <CardDescription>
                Statutory settings and other configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">More Settings Coming Soon</p>
                <p className="text-sm">Statutory settings, tax configurations, and compliance features will be available in the next update.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tax & Compliance Tab */}
      {selectedTab === 'taxcompliance' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Percent className="h-5 w-5" />
                <span>Tax & Compliance Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure PF, ESI, Professional Tax, and TDS settings for payroll calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {taxConfigLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading tax configuration...</span>
                </div>
              ) : (
                <form onSubmit={handleTaxConfigSubmit} className="space-y-8">
                  {/* PF Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                      Provident Fund (PF)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div key="pf-minimum-salary">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          PF Applicable Above (₹)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={taxConfigData.pfMinimumSalary}
                          onChange={(e) => setTaxConfigData({...taxConfigData, pfMinimumSalary: e.target.value})}
                          placeholder="e.g., 10000"
                          className={taxConfigErrors.pfMinimumSalary ? 'border-red-500' : ''}
                        />
                        {taxConfigErrors.pfMinimumSalary && (
                          <p className="text-red-500 text-xs mt-1">{taxConfigErrors.pfMinimumSalary}</p>
                        )}
                      </div>
                      <div key="pf-employee-rate">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Employee PF Rate (%)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={taxConfigData.pfEmployeeRate}
                          onChange={(e) => setTaxConfigData({...taxConfigData, pfEmployeeRate: e.target.value})}
                          placeholder="e.g., 12"
                          className={taxConfigErrors.pfEmployeeRate ? 'border-red-500' : ''}
                        />
                        {taxConfigErrors.pfEmployeeRate && (
                          <p className="text-red-500 text-xs mt-1">{taxConfigErrors.pfEmployeeRate}</p>
                        )}
                      </div>
                     
                    </div>
                  </div>

                  {/* ESI Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                      Employee State Insurance (ESI)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div key="esi-minimum-salary">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          ESI Applicable Up To (₹)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={taxConfigData.esiMinimumSalary}
                          onChange={(e) => setTaxConfigData({...taxConfigData, esiMinimumSalary: e.target.value})}
                          placeholder="e.g., 21000"
                          className={taxConfigErrors.esiMinimumSalary ? 'border-red-500' : ''}
                        />
                        {taxConfigErrors.esiMinimumSalary && (
                          <p className="text-red-500 text-xs mt-1">{taxConfigErrors.esiMinimumSalary}</p>
                        )}
                      </div>
                      <div key="esi-employee-rate">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Employee ESI Rate (%)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={taxConfigData.esiEmployeeRate}
                          onChange={(e) => setTaxConfigData({...taxConfigData, esiEmployeeRate: e.target.value})}
                          placeholder="e.g., 0.75"
                          className={taxConfigErrors.esiEmployeeRate ? 'border-red-500' : ''}
                        />
                        {taxConfigErrors.esiEmployeeRate && (
                          <p className="text-red-500 text-xs mt-1">{taxConfigErrors.esiEmployeeRate}</p>
                        )}
                      </div>
                     
                    </div>
                  </div>

                  {/* Professional Tax Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                      Professional Tax
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Professional Tax Amount (₹)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={taxConfigData.professionalTaxAmount}
                          onChange={(e) => setTaxConfigData({...taxConfigData, professionalTaxAmount: e.target.value})}
                          placeholder="e.g., 200"
                          className={taxConfigErrors.professionalTaxAmount ? 'border-red-500' : ''}
                        />
                        {taxConfigErrors.professionalTaxAmount && (
                          <p className="text-red-500 text-xs mt-1">{taxConfigErrors.professionalTaxAmount}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Applicable Above Salary (₹)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={taxConfigData.professionalTaxMinimumSalary}
                          onChange={(e) => setTaxConfigData({...taxConfigData, professionalTaxMinimumSalary: e.target.value})}
                          placeholder="e.g., 10000"
                          className={taxConfigErrors.professionalTaxMinimumSalary ? 'border-red-500' : ''}
                        />
                        {taxConfigErrors.professionalTaxMinimumSalary && (
                          <p className="text-red-500 text-xs mt-1">{taxConfigErrors.professionalTaxMinimumSalary}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TDS Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                      Tax Deducted at Source (TDS)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Annual TDS Exemption Limit (₹)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={taxConfigData.tdsExemptionLimit}
                          onChange={(e) => setTaxConfigData({...taxConfigData, tdsExemptionLimit: e.target.value})}
                          placeholder="e.g., 250000"
                          className={taxConfigErrors.tdsExemptionLimit ? 'border-red-500' : ''}
                        />
                        {taxConfigErrors.tdsExemptionLimit && (
                          <p className="text-red-500 text-xs mt-1">{taxConfigErrors.tdsExemptionLimit}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                      Additional Notes
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Configuration Notes
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows="3"
                        value={taxConfigData.notes}
                        onChange={(e) => setTaxConfigData({...taxConfigData, notes: e.target.value})}
                        placeholder="Optional notes about tax configuration, compliance requirements, or special considerations..."
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="submit"
                      disabled={taxConfigLoading}
                      className="flex items-center space-x-2"
                    >
                      {taxConfigLoading && (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      )}
                      <span>Save Configuration</span>
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reimbursements Tab */}
      {selectedTab === 'reimbursements' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reimbursement Requests</CardTitle>
              <CardDescription>Manage employee reimbursement requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search requests..."
                    className="pl-10"
                  />
                </div>
                {user?.role === 'employee' && (
                  <Button variant="default" className="flex items-center space-x-2">
                    <Receipt className="h-4 w-4" />
                    <span>Submit Request</span>
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Employee</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reimbursements.map((request) => (
                      <tr key={request.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-primary/10 rounded-full p-2">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{request.employee}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{request.type}</td>
                        <td className="py-3 px-4 text-sm font-medium">${request.amount}</td>
                        <td className="py-3 px-4 text-sm">{request.date}</td>
                        <td className="py-3 px-4 text-sm max-w-xs truncate">{request.description}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            {request.status === 'pending' && (user?.role === 'hr' || user?.role === 'admin' || user?.role === 'finance') && (
                              <>
                                <Button size="sm" variant="success">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button size="sm" variant="destructive">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedPayroll(request);
                                setShowDetailsModal(true);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
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

      {/* Payroll Details Modal */}
      {showDetailsModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Payroll Details</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPayroll(null);
                }}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee</label>
                <p className="text-gray-900 dark:text-white">{selectedPayroll.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee ID</label>
                  <p className="text-gray-900 dark:text-white">{selectedPayroll.employeeId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Period</label>
                  <p className="text-gray-900 dark:text-white">{selectedPayroll.period}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Basic Salary</label>
                  <p className="text-gray-900 dark:text-white">${selectedPayroll.basicSalary?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Allowances</label>
                  <p className="text-gray-900 dark:text-white">${selectedPayroll.allowances?.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Gross Salary</label>
                  <p className="text-gray-900 dark:text-white font-semibold">${selectedPayroll.grossSalary?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Deductions</label>
                  <p className="text-gray-900 dark:text-white text-red-600">${selectedPayroll.deductions?.toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Salary</label>
                <p className="text-gray-900 dark:text-white text-lg font-bold text-green-600">
                  ${selectedPayroll.netSalary?.toLocaleString()}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedPayroll.status === 'paid' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : selectedPayroll.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {selectedPayroll.status?.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Payslip
              </Button>
              <Button 
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPayroll(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* View Employee Payroll Modal */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedEmployee.name} - Payroll Details</h3>
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
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee Name</label>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedEmployee.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Position</label>
                  <p className="text-gray-900 dark:text-white">{selectedEmployee.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Department</label>
                  <p className="text-gray-900 dark:text-white">{selectedEmployee.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee ID</label>
                  <p className="text-gray-900 dark:text-white">{selectedEmployee.id}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Salary Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Basic Salary</label>
                    <p className="text-gray-900 dark:text-white font-bold text-lg">${selectedEmployee.basicSalary?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Allowances</label>
                    <p className="text-gray-900 dark:text-white font-medium text-green-600">${selectedEmployee.allowances?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Deductions</label>
                    <p className="text-gray-900 dark:text-white font-medium text-red-600">-${selectedEmployee.deductions?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Salary</label>
                    <p className="text-gray-900 dark:text-white font-bold text-xl text-blue-600">${selectedEmployee.netSalary?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Status</label>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedEmployee.status === 'paid' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : selectedEmployee.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {selectedEmployee.status?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Pay Period</label>
                    <p className="text-gray-900 dark:text-white">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
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
                  generatePayslip(selectedEmployee);
                }}
              >
                Generate Payslip
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Component Modal */}
      {showComponentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedComponent ? 'Edit Component' : 'Add Component'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComponentModal(false)}
                className="h-8 w-8 p-0"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleComponentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Component Name *
                </label>
                <Input
                  type="text"
                  value={componentForm.name}
                  onChange={(e) => setComponentForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Basic Salary, HRA, PF"
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type *
                  </label>
                  <select
                    value={componentForm.type}
                    onChange={(e) => setComponentForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="EARNING">Earning</option>
                    <option value="DEDUCTION">Deduction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Method *
                  </label>
                  <select
                    value={componentForm.calculationMethod}
                    onChange={(e) => setComponentForm(prev => ({ ...prev, calculationMethod: e.target.value }))}
                    className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="FIXED">Fixed Amount</option>
                    <option value="PERCENTAGE_OF_BASIC">Percentage of Basic</option>
                    <option value="PERCENTAGE_OF_CTC">Percentage of CTC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Value * {componentForm.calculationMethod === 'FIXED' ? '(₹)' : '(%)'}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={componentForm.value}
                  onChange={(e) => setComponentForm(prev => ({ ...prev, value: e.target.value }))}
                  placeholder={componentForm.calculationMethod === 'FIXED' ? '50000' : '10'}
                  className={formErrors.value ? 'border-red-500' : ''}
                />
                {formErrors.value && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.value}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="taxable"
                  checked={componentForm.taxable}
                  onChange={(e) => setComponentForm(prev => ({ ...prev, taxable: e.target.checked }))}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="taxable" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Taxable Component
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={componentForm.description}
                  onChange={(e) => setComponentForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description for this component"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowComponentModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={setupLoading}
                  className="flex items-center space-x-2"
                >
                  {setupLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  <span>{selectedComponent ? 'Update' : 'Create'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank Account Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedBankAccount ? 'Edit Bank Account' : 'Add Bank Account'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBankModal(false)}
                className="h-8 w-8 p-0"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleBankSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bank Name *
                </label>
                <Input
                  type="text"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="e.g., State Bank of India"
                  className={formErrors.bankName ? 'border-red-500' : ''}
                />
                {formErrors.bankName && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.bankName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Branch Name *
                </label>
                <Input
                  type="text"
                  value={bankForm.branchName}
                  onChange={(e) => setBankForm(prev => ({ ...prev, branchName: e.target.value }))}
                  placeholder="e.g., Mumbai Main Branch"
                  className={formErrors.branchName ? 'border-red-500' : ''}
                />
                {formErrors.branchName && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.branchName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Number *
                </label>
                <Input
                  type="text"
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="e.g., 1234567890123456"
                  className={formErrors.accountNumber ? 'border-red-500' : ''}
                />
                {formErrors.accountNumber && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.accountNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  IFSC Code *
                </label>
                <Input
                  type="text"
                  value={bankForm.ifscCode}
                  onChange={(e) => setBankForm(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g., SBIN0000123"
                  maxLength={11}
                  className={formErrors.ifscCode ? 'border-red-500' : ''}
                />
                {formErrors.ifscCode && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.ifscCode}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Holder Name
                </label>
                <Input
                  type="text"
                  value={bankForm.accountHolderName}
                  onChange={(e) => setBankForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  placeholder="e.g., ABC Company Pvt Ltd"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={bankForm.isDefault}
                  onChange={(e) => setBankForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Set as default account
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={bankForm.notes}
                  onChange={(e) => setBankForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes about this account"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBankModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={setupLoading}
                  className="flex items-center space-x-2"
                >
                  {setupLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  <span>{selectedBankAccount ? 'Update' : 'Create'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calculate Payroll Modal */}
      {showCalculateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Calculate Payroll - {payrollMonth}</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCalculateModal(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    checked={selectedEmployees.length === employees.length}
                    onChange={(e) => handleSelectAllEmployees(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="font-medium">Select All Employees</span>
                </div>
                <span className="text-sm text-gray-500">
                  {selectedEmployees.length} of {employees.length} selected
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {employees.map(employee => (
                  <div key={employee.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input 
                      type="checkbox" 
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={(e) => handleEmployeeSelection(employee.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.department} • ₹{employee.salary?.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCalculateModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCalculatePayroll}
                  disabled={selectedEmployees.length === 0 || hrPayrollLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {hrPayrollLoading ? 'Calculating...' : `Calculate Selected (${selectedEmployees.length})`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Details Modal */}
      {showViewModal && selectedPayrollRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                Payroll Details - {selectedPayrollRecord.employee?.name}
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedPayrollRecord(null);
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Basic Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Employee ID:</span>
                      <span>{selectedPayrollRecord.employee?.employeeId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Department:</span>
                      <span>{selectedPayrollRecord.employee?.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Basic Salary:</span>
                      <span>₹{Number(selectedPayrollRecord.baseSalary || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Working Days:</span>
                      <span>{selectedPayrollRecord.workingDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Paid Days:</span>
                      <span>{selectedPayrollRecord.paidDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">LWP Days:</span>
                      <span>{selectedPayrollRecord.unpaidDays}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Allowances</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedPayrollRecord.allowances || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span>₹{Number(value).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Total Allowances:</span>
                      <span>₹{Object.values(selectedPayrollRecord.allowances || {}).reduce((sum, val) => sum + Number(val), 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Deductions</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedPayrollRecord.deductions || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span>₹{Number(value).toLocaleString()}</span>
                      </div>
                    ))}
                    {selectedPayrollRecord.lwpDeduction > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">LWP Deduction:</span>
                        <span>₹{Number(selectedPayrollRecord.lwpDeduction).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Total Deductions:</span>
                      <span>₹{Number(selectedPayrollRecord.totalDeductions || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Net Salary:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₹{Number(selectedPayrollRecord.netSalary || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Status Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHRPayrollStatusColor(selectedPayrollRecord.status)}`}>
                        {selectedPayrollRecord.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Calculated At:</span>
                      <span>{new Date(selectedPayrollRecord.calculatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjustModal && selectedPayrollRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Adjust Payroll - {selectedPayrollRecord.employee?.name}
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowAdjustModal(false);
                  setSelectedPayrollRecord(null);
                  setAdjustmentForm({
                    adjustmentType: 'ALLOWANCE',
                    adjustmentName: '',
                    amount: '',
                    reason: ''
                  });
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              // Handle adjustment submission
              console.log('Adjustment form:', adjustmentForm);
              toast.success('Adjustment functionality coming soon!');
            }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adjustment Type
                </label>
                <select 
                  value={adjustmentForm.adjustmentType}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, adjustmentType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="ALLOWANCE">Additional Allowance</option>
                  <option value="DEDUCTION">Additional Deduction</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adjustment Name
                </label>
                <input 
                  type="text"
                  value={adjustmentForm.adjustmentName}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, adjustmentName: e.target.value }))}
                  placeholder="e.g., Special Bonus, Late Fine"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount (₹)
                </label>
                <input 
                  type="number"
                  value={adjustmentForm.amount}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="5000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason
                </label>
                <textarea 
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Reason for this adjustment"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setShowAdjustModal(false);
                    setSelectedPayrollRecord(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Apply Adjustment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagement;
