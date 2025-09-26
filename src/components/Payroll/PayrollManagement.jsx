import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  DollarSign, Plus, Search, Filter, Calendar, 
  TrendingUp, Users, FileText, Download, Edit, 
  Trash2, Receipt, Eye, Activity, Clock, XCircle,
  Settings, Building2, CreditCard, Percent, CheckCircle, User
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import PayrollProgressChart from './PayrollProgressChart';
import { PayrollSetupAPI } from '../../lib/payrollSetupApi';
import { HRPayrollAPI } from '../../lib/hrPayrollApi';
import { toast } from 'react-toastify';
import CompanyPayrollInfo from './CompanyPayrollInfo';
import * as XLSX from 'xlsx';

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
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [loadingEligibleEmployees, setLoadingEligibleEmployees] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedPayrollRecord, setSelectedPayrollRecord] = useState(null);
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false);
  const [recordToApprove, setRecordToApprove] = useState(null);
  const [showBulkApprovalConfirm, setShowBulkApprovalConfirm] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustmentType: 'ALLOWANCE',
    adjustmentName: '',
    amount: '',
    reason: ''
  });

  // Dashboard data states
  const [dashboardData, setDashboardData] = useState({
    totalPayroll: 0,
    employeesPaid: 0,
    totalEmployees: 0,
    avgSalary: 0,
    pendingReimbursements: 1250, // Mock as requested
    pendingReimbursementCount: 5 // Mock as requested
  });
  const [departmentData, setDepartmentData] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Bank Transfer States
  const [bankTransferData, setBankTransferData] = useState([]);
  const [bankTransferSummary, setBankTransferSummary] = useState({
    totalEmployees: 0,
    totalAmount: 0,
    pending: { count: 0, amount: 0 },
    processing: { count: 0, amount: 0 },
    completed: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 }
  });
  const [bankTransferLoading, setBankTransferLoading] = useState(false);
  const [selectedTransferEmployees, setSelectedTransferEmployees] = useState([]);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [transferType, setTransferType] = useState('individual'); // 'individual' | 'bulk'
  const [selectedTransferRecord, setSelectedTransferRecord] = useState(null);
  const [showBankReceiptModal, setShowBankReceiptModal] = useState(false);
  const [bankReceiptData, setBankReceiptData] = useState(null);
  const [bankReceiptLoading, setBankReceiptLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMonth, setReportMonth] = useState(payrollMonth);
  const [reportStatus, setReportStatus] = useState('ALL');
  const [reportFormat, setReportFormat] = useState('excel');

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
        
        // Calculate totalAllowances from allowances JSON object
        const calculatedTotalAllowances = payroll.allowances && typeof payroll.allowances === 'object' 
          ? Object.values(payroll.allowances).reduce((sum, val) => sum + Number(val || 0), 0) 
          : 0;


        const mappedRecord = {
          id: payroll.id,
          name: employee.name || 'Unknown',
          position: employee.position || 'N/A',
          department: department.name || 'N/A',
          basicSalary: payroll.basicSalary || 0,
          allowances: payroll.allowances || {}, // JSON object with breakdown
          totalAllowances: payroll.totalAllowances || calculatedTotalAllowances, // Use backend value or calculate from JSON
          deductions: payroll.deductions || {}, // JSON object with breakdown
          totalDeductions: payroll.totalDeductions || 0, // Total amount for table display
          lwpDeduction: payroll.lwpDeduction || 0,
          netSalary: payroll.netSalary || 0,
          status: payroll.status?.toLowerCase() || 'pending',
          payPeriod: payroll.payPeriod,
          paymentDate: payroll.paymentDate,
          paymentMethod: payroll.paymentMethod || 'Bank Transfer',
          // Additional fields for detailed view
          grossSalary: payroll.grossSalary || 0,
          workingDays: payroll.workingDays || 0,
          paidDays: payroll.paidDays || 0,
          employeeId: payroll.employeeId,
          month: payroll.month,
          year: payroll.year
        };
        

        return mappedRecord;
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
          allowances: {
            'basic_allowance': Math.floor(allowances * 0.6),
            'transport_allowance': Math.floor(allowances * 0.4)
          },
          totalAllowances: allowances,
          deductions: {
            'pf': Math.floor(deductions * 0.5),
            'esi': Math.floor(deductions * 0.2),
            'professional_tax': Math.floor(deductions * 0.3)
          },
          totalDeductions: deductions,
          lwpDeduction: 0,
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
        allowances: {
          'basic_allowance': 800,
          'transport_allowance': 400
        },
        totalAllowances: 1200,
        deductions: {
          'pf': 900,
          'esi': 360,
          'professional_tax': 540
        },
        totalDeductions: 1800,
        lwpDeduction: 0,
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
        allowances: {
          'basic_allowance': 950,
          'transport_allowance': 550
        },
        totalAllowances: 1500,
        deductions: {
          'pf': 1050,
          'esi': 420,
          'professional_tax': 630
        },
        totalDeductions: 2100,
        lwpDeduction: 0,
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
        allowances: {
          'basic_allowance': 700,
          'transport_allowance': 300
        },
        totalAllowances: 1000,
        deductions: {
          'pf': 800,
          'esi': 320,
          'professional_tax': 480
        },
        totalDeductions: 1600,
        lwpDeduction: 0,
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
  }, [filters]); // Removed employeePayroll and searchTerm to prevent infinite loop

  // Filter HR-approved records for Finance approval
  const filteredFinanceRecords = useMemo(() => {
    return hrPayrollRecords.filter(record => record.status === 'HR_APPROVED');
  }, [hrPayrollRecords]); // Removed filters dependency as it's not used in the filter logic

  // Debug log for payroll data
  useEffect(() => {
    console.log('PayrollManagement: Employee payroll data updated:', {
      employeePayrollCount: employeePayroll?.length || 0,
      filteredPayrollsCount: filteredPayrolls?.length || 0,
      employeesCount: employees?.length || 0,
      filteredFinanceRecordsCount: filteredFinanceRecords?.length || 0,
      payrollsCount: payrolls?.length || 0
    });
  }, [employeePayroll, filteredPayrolls, employees, payrolls, filteredFinanceRecords]);

  // Load setup data when setup tab is selected
  useEffect(() => {
    if (selectedTab === 'setup') {
      loadSetupData();
    }
  }, [selectedTab]);

  // Load HR payroll data when component mounts or month changes
  useEffect(() => {
    if (user?.role === 'hr' || user?.role === 'admin' || user?.role === 'finance') {
      loadHRPayrollData();
    }
  }, [payrollMonth, user]);

  // Refetch eligible employees when payroll month changes and modal is open
  useEffect(() => {
    if (showCalculateModal && payrollMonth) {
      fetchEligibleEmployees(payrollMonth);
    }
  }, [payrollMonth, showCalculateModal]);

  // Load dashboard data when component mounts or month changes
  useEffect(() => {
    if (user?.role === 'hr' || user?.role === 'admin' || user?.role === 'finance') {
      loadDashboardData();
    }
  }, [payrollMonth, user]);

  // Load bank transfer data when component mounts, month changes, or banktransfers tab is selected
  useEffect(() => {
    if (user?.role === 'finance' && selectedTab === 'banktransfers') {
      loadBankTransferData();
    }
  }, [payrollMonth, user, selectedTab]);

// Dashboard Functions
const loadDashboardData = async () => {
  setDashboardLoading(true);
  try {
    console.log('🔍 Loading dashboard data for month:', payrollMonth);
    
    const [summaryRes, deptRes] = await Promise.all([
      HRPayrollAPI.getDashboardSummary(payrollMonth),
      HRPayrollAPI.getDepartmentBreakdown(payrollMonth)
    ]);

    console.log('✅ Dashboard data loaded:', {
      summary: summaryRes.data,
      departments: deptRes.data
    });

    setDashboardData({
      ...summaryRes.data,
      pendingReimbursements: 1250, // Keep mock as requested
      pendingReimbursementCount: 5 // Keep mock as requested
    });
    setDepartmentData(deptRes.data.departments || []);
  } catch (error) {
    console.error('❌ Error loading dashboard data:', error);
    toast.error('Failed to load dashboard data');
  } finally {
    setDashboardLoading(false);
  }
};

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
        loadDashboardData(); // Refresh dashboard data
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

  const handleBulkApprove = () => {
    // Filter only calculated records from selected employees
    const selectedCalculatedRecords = hrPayrollRecords.filter(record => 
      selectedEmployees.includes(record.id) && record.status === 'CALCULATED'
    );
    
    if (selectedCalculatedRecords.length === 0) {
      toast.error('No calculated records selected for approval');
      return;
    }

    // Show confirmation dialog
    setShowBulkApprovalConfirm(true);
  };

  // Confirm and execute bulk approval
  const confirmBulkApproval = async () => {
    setHrPayrollLoading(true);
    
    // Filter only calculated records from selected employees
    const selectedCalculatedRecords = hrPayrollRecords.filter(record => 
      selectedEmployees.includes(record.id) && record.status === 'CALCULATED'
    );

    try {
      const response = await HRPayrollAPI.bulkApprovePayroll({
        payrollRecordIds: selectedCalculatedRecords.map(record => record.id),
        approvalNotes: `Bulk approved ${selectedCalculatedRecords.length} records by HR`
      });

      console.log('✅ Bulk approval response:', response.data);
      
      if (response.data.summary.successful > 0) {
        toast.success(`Approved ${response.data.summary.successful} payroll records`);
        loadHRPayrollData(); // Reload data
        loadDashboardData(); // Refresh dashboard data
        setSelectedEmployees([]); // Clear selections
      } else {
        toast.error('Failed to approve payroll records');
      }
    } catch (error) {
      console.error('Error approving payroll:', error);
      toast.error('Failed to approve payroll records');
    } finally {
      setHrPayrollLoading(false);
      setShowBulkApprovalConfirm(false);
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
      setSelectedEmployees(eligibleEmployees.map(emp => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  // Finance Approval Functions
  const handleFinanceApprove = async (record) => {
    try {
      console.log('🔍 Finance approving payroll for:', record.employee?.name);
      
      const response = await HRPayrollAPI.financeApprovePayroll(
        record.id, 
        `Finance approved payroll for ${record.employee?.name || 'employee'}`
      );

      console.log('✅ Finance approval response:', response.data);
      
      if (response.data.success) {
        toast.success(`Finance approved payroll for ${record.employee?.name || 'employee'}`);
        loadHRPayrollData(); // Reload data to show updated status
        loadDashboardData(); // Refresh dashboard data
      } else {
        toast.error('Failed to approve payroll record');
      }
    } catch (error) {
      console.error('❌ Error in Finance approval:', error);
      toast.error('Failed to approve payroll record');
    }
  };

  const handleFinanceBulkApprove = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select employees to approve');
      return;
    }

    try {
      console.log('🔍 Finance bulk approving payroll for:', selectedEmployees);
      
      const response = await HRPayrollAPI.financeBulkApprovePayroll(
        selectedEmployees,
        `Finance bulk approved ${selectedEmployees.length} payroll records`
      );

      console.log('✅ Finance bulk approval response:', response.data);
      
      if (response.data.success) {
        toast.success(`Finance approved ${response.data.summary.successful} payroll records`);
        loadHRPayrollData(); // Reload data
        loadDashboardData(); // Refresh dashboard data
        setSelectedEmployees([]); // Clear selections
      } else {
        toast.error('Failed to approve payroll records');
      }
    } catch (error) {
      console.error('❌ Error in Finance bulk approval:', error);
      toast.error('Failed to approve payroll records');
    }
  };

  // Bank Transfer Functions
  const loadBankTransferData = async () => {
    if (!payrollMonth) return;
    
    setBankTransferLoading(true);
    try {
      console.log('🔍 Loading bank transfer data for month:', payrollMonth);
      
      const [transferResponse, summaryResponse] = await Promise.all([
        HRPayrollAPI.getBankTransferData(payrollMonth),
        HRPayrollAPI.getBankTransferSummary(payrollMonth)
      ]);

      console.log('✅ Bank transfer data loaded:', transferResponse.data);
      console.log('✅ Bank transfer summary loaded:', summaryResponse.data);
      
      setBankTransferData(transferResponse.data || []);
      setBankTransferSummary(summaryResponse.data || {
        totalEmployees: 0,
        totalAmount: 0,
        pending: { count: 0, amount: 0 },
        processing: { count: 0, amount: 0 },
        completed: { count: 0, amount: 0 },
        failed: { count: 0, amount: 0 }
      });
      
    } catch (error) {
      console.error('❌ Error loading bank transfer data:', error);
      toast.error('Failed to load bank transfer data');
    } finally {
      setBankTransferLoading(false);
    }
  };

  const handleIndividualTransfer = (record) => {
    setSelectedTransferRecord(record);
    setTransferType('individual');
    setShowTransferConfirm(true);
  };

  const handleBulkTransfer = () => {
    if (selectedTransferEmployees.length === 0) {
      toast.error('Please select employees for transfer');
      return;
    }
    setTransferType('bulk');
    setShowTransferConfirm(true);
  };

  const confirmTransfer = async () => {
    try {
      let bankDetailIds = [];
      
      if (transferType === 'individual') {
        bankDetailIds = [selectedTransferRecord.id];
      } else {
        bankDetailIds = selectedTransferEmployees;
      }

      console.log('🔍 Initiating bank transfer for:', bankDetailIds);
      
      const response = await HRPayrollAPI.initiateBankTransfer(bankDetailIds);
      
      console.log('✅ Bank transfer response:', response.data);
      
      if (response.data.success) {
        toast.success(response.data.message);
        loadBankTransferData(); // Reload data
        setSelectedTransferEmployees([]); // Clear selections
        setShowTransferConfirm(false);
        setSelectedTransferRecord(null);
      } else {
        toast.error('Failed to initiate bank transfer');
      }
      
    } catch (error) {
      console.error('❌ Error initiating bank transfer:', error);
      toast.error('Failed to initiate bank transfer');
    }
  };

  // Bank Transfer Receipt Functions
  const loadBankTransferReceipt = async (bankDetailId) => {
    setBankReceiptLoading(true);
    try {
      console.log('🔍 Loading bank transfer receipt for:', bankDetailId);
      
      const response = await HRPayrollAPI.getBankTransferReceipt(bankDetailId);
      
      console.log('✅ Bank transfer receipt loaded:', response.data);
      setBankReceiptData(response.data);
      setShowBankReceiptModal(true);
      
    } catch (error) {
      console.error('❌ Error loading bank transfer receipt:', error);
      toast.error('Failed to load bank transfer receipt');
    } finally {
      setBankReceiptLoading(false);
    }
  };

  const handleViewBankReceipt = (record) => {
    loadBankTransferReceipt(record.id);
  };

  // Report Generation Functions
  const generateReport = async () => {
    setReportLoading(true);
    try {
      console.log('🔍 Generating report for tab:', selectedTab, { reportMonth, reportStatus, reportFormat });
      
      // Generate Bank Transfer Report for all tabs
      const response = await HRPayrollAPI.generateBankTransferReport(reportMonth, reportStatus);
      const reportData = response.data;
      
      if (reportFormat === 'excel') {
        downloadBankTransferExcelReport(reportData);
      } else {
        downloadBankTransferPDFReport(reportData);
      }
      
      setShowReportModal(false);
      toast.success('Report generated successfully');
      
    } catch (error) {
      console.error('❌ Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };

  const downloadBankTransferExcelReport = (reportData) => {
    // Prepare data for CSV
    const csvData = reportData.data.map(record => ({
      'Employee ID': record.employeeId,
      'Employee Name': record.employeeName,
      'Department': record.department,
      'Designation': record.designation,
      'Net Salary': record.netSalary,
      'Bank Name': record.bankName,
      'Account Number': record.accountNumber,
      'IFSC Code': record.ifscCode,
      'Account Holder': record.accountHolderName,
      'Transfer Status': record.transferStatus,
      'Transfer Date': record.transferDate,
      'Transaction ID': record.transactionId,
      'Processed Date': record.processedDate,
      'Transfer Amount': record.transferAmount
    }));
    
    // Convert to CSV format
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      // Add summary information as comments
      `# Bank Transfer Report Summary`,
      `# Month: ${reportData.summary.month}`,
      `# Status Filter: ${reportData.summary.statusFilter}`,
      `# Total Employees: ${reportData.summary.totalEmployees}`,
      `# Total Amount: ₹${reportData.summary.totalAmount.toLocaleString()}`,
      `# Generated At: ${new Date(reportData.summary.generatedAt).toLocaleString()}`,
      `# Status Breakdown - PENDING: ${reportData.summary.statusBreakdown.PENDING}, PROCESSING: ${reportData.summary.statusBreakdown.PROCESSING}, COMPLETED: ${reportData.summary.statusBreakdown.COMPLETED}, FAILED: ${reportData.summary.statusBreakdown.FAILED}`,
      ``,
      // Add headers
      headers.join(','),
      // Add data rows
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    const fileName = `Bank_Transfer_Report_${reportData.summary.month}_${reportData.summary.statusFilter}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadBankTransferPDFReport = (reportData) => {
    // Create PDF content
    let pdfContent = `
      <html>
        <head>
          <title>Bank Transfer Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin-bottom: 30px; }
            .summary table { width: 100%; border-collapse: collapse; }
            .summary th, .summary td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .data table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .data th, .data td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            .data th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Bank Transfer Report</h1>
            <p>Month: ${reportData.summary.month} | Status: ${reportData.summary.statusFilter}</p>
            <p>Generated on: ${new Date(reportData.summary.generatedAt).toLocaleString()}</p>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <table>
              <tr><td><strong>Total Employees</strong></td><td>${reportData.summary.totalEmployees}</td></tr>
              <tr><td><strong>Total Amount</strong></td><td>₹${reportData.summary.totalAmount.toLocaleString()}</td></tr>
              <tr><td><strong>PENDING</strong></td><td>${reportData.summary.statusBreakdown.PENDING}</td></tr>
              <tr><td><strong>PROCESSING</strong></td><td>${reportData.summary.statusBreakdown.PROCESSING}</td></tr>
              <tr><td><strong>COMPLETED</strong></td><td>${reportData.summary.statusBreakdown.COMPLETED}</td></tr>
              <tr><td><strong>FAILED</strong></td><td>${reportData.summary.statusBreakdown.FAILED}</td></tr>
            </table>
          </div>
          
          <div class="data">
            <h3>Bank Transfer Details</h3>
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Net Salary</th>
                  <th>Bank</th>
                  <th>Account</th>
                  <th>Status</th>
                  <th>Transfer Date</th>
                  <th>Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.data.map(record => `
                  <tr>
                    <td>${record.employeeId}</td>
                    <td>${record.employeeName}</td>
                    <td>₹${record.netSalary.toLocaleString()}</td>
                    <td>${record.bankName}</td>
                    <td>${record.accountNumber}</td>
                    <td>${record.transferStatus}</td>
                    <td>${record.transferDate}</td>
                    <td>${record.transactionId}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;
    
    // Create and download PDF
    const fileName = `Bank_Transfer_Report_${reportData.summary.month}_${reportData.summary.statusFilter}_${new Date().toISOString().slice(0, 10)}.pdf`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    printWindow.print();
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

  const triggerMonthlyCredits = async () => {
    console.log('Processing monthly leave credits for all employees...');

    setSetupLoading(true);
    try {
      const formData = {
        ...componentForm,
        calculationMethod: 'FIXED',
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
    console.log(`Delete component requested: ${component.name}`);

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
    console.log(`Delete bank account requested: ${bankAccount.bankName}`);

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

  // Fetch eligible employees for payroll calculation
  const fetchEligibleEmployees = async (month) => {
    setLoadingEligibleEmployees(true);
    try {
      console.log('🔍 Fetching eligible employees for month:', month);
      const response = await HRPayrollAPI.getEligibleEmployees(month);
      
      console.log('✅ Eligible employees response:', response.data);
      setEligibleEmployees(response.data || []);
      
      // Clear previous selections
      setSelectedEmployees([]);
      
    } catch (error) {
      console.error('❌ Error fetching eligible employees:', error);
      toast.error('Failed to load eligible employees');
      setEligibleEmployees([]);
    } finally {
      setLoadingEligibleEmployees(false);
    }
  };

  // Handle opening calculate modal
  const handleOpenCalculateModal = () => {
    setShowCalculateModal(true);
    fetchEligibleEmployees(payrollMonth);
  };

  // Handle individual payroll approval confirmation
  const handleIndividualApprove = (record) => {
    if (!record || record.status !== 'CALCULATED') {
      toast.error('Only calculated records can be approved');
      return;
    }
    setRecordToApprove(record);
    setShowApprovalConfirm(true);
  };

  // Confirm and execute individual approval
  const confirmIndividualApproval = async () => {
    if (!recordToApprove) return;

    try {
      console.log('🔍 Approving individual record:', recordToApprove);
      
      const response = await HRPayrollAPI.approvePayroll(
        recordToApprove.id, 
        `Individual approval for ${recordToApprove.employee?.name || 'employee'}`
      );

      console.log('✅ Individual approval response:', response.data);
      
      if (response.data.summary.successful > 0) {
        toast.success(`Approved payroll for ${recordToApprove.employee?.name || 'employee'}`);
        loadHRPayrollData(); // Reload data to show updated status
        loadDashboardData(); // Refresh dashboard data
      } else {
        toast.error('Failed to approve payroll record');
      }
    } catch (error) {
      console.error('❌ Error approving individual payroll:', error);
      toast.error('Failed to approve payroll record');
    } finally {
      setShowApprovalConfirm(false);
      setRecordToApprove(null);
    }
  };

  // Handle adjustment submission
  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!adjustmentForm.adjustmentName.trim()) {
      toast.error('Please enter adjustment name');
      return;
    }
    
    if (!adjustmentForm.amount || parseFloat(adjustmentForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      console.log('🔧 Submitting adjustment:', {
        recordId: selectedPayrollRecord?.id,
        adjustmentData: adjustmentForm
      });

      const response = await HRPayrollAPI.adjustPayroll(selectedPayrollRecord.id, {
        adjustmentType: adjustmentForm.adjustmentType,
        adjustmentName: adjustmentForm.adjustmentName,
        amount: parseFloat(adjustmentForm.amount),
        reason: adjustmentForm.reason || undefined
      });

      console.log('✅ Adjustment response:', response);
      
      toast.success(`Adjustment applied successfully! Net salary updated from ₹${response.data.oldNetSalary} to ₹${response.data.newNetSalary}`);
      
      // Reset form and close modal
      setAdjustmentForm({
        adjustmentType: 'ALLOWANCE',
        adjustmentName: '',
        amount: '',
        reason: ''
      });
      setSelectedPayrollRecord(null);
      setShowAdjustModal(false);
      
      // Refresh payroll data if available
      // You might want to call a refresh function here
      
    } catch (error) {
      console.error('❌ Adjustment failed:', error);
      toast.error(error.response?.data?.message || 'Failed to apply adjustment');
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
    console.log(`Payslip generated for ${employee.name}`);
  };

  const handleBulkExport = () => {
    // Generate bulk payroll report
    const csvContent = generateBulkPayrollCSV();
    const filename = `bulk_payroll_report_${new Date().toISOString().split('T')[0]}.csv`;
    
    downloadCSV(csvContent, filename);
    toast.success('Bulk payroll report exported successfully!');
  };
  
  const generateBulkPayrollCSV = () => {
    const headers = ['Employee ID', 'Employee Name', 'Month', 'Basic Salary', 'Allowances', 'Overtime', 'Gross Salary', 'Tax Deduction', 'Other Deductions', 'Net Salary', 'Status'];
    const data = employeePayroll.map(payslip => [
      payslip.id,
      payslip.name,
      selectedMonth,
      payslip.basicSalary,
      payslip.totalAllowances,
      0, // overtime
      payslip.basicSalary + payslip.totalAllowances,
      0, // tax deduction
      payslip.totalDeductions,
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
    console.log(`Payslip for ${payslip.name} downloaded successfully!`);
  };
  
  const generatePayslipCSV = (payslip) => {
    const headers = ['Field', 'Amount'];
    const data = [
      ['Employee Name', payslip.name],
      ['Employee ID', payslip.id],
      ['Month', selectedMonth],
      ['Basic Salary', payslip.basicSalary],
      ['Allowances', payslip.totalAllowances],
      ['Overtime', 0],
      ['Gross Salary', payslip.basicSalary + payslip.totalAllowances],
      ['Tax Deduction', 0],
      ['Other Deductions', payslip.totalDeductions],
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
          <Button 
            onClick={() => setShowReportModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Generate Report</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {(user?.role === 'hr' 
            ? ['overview', 'payroll'] 
            : user?.role === 'finance'
            ? ['overview', 'finance', 'banktransfers']
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
              {tab === 'taxcompliance' ? 'Tax & Compliance' : 
               tab === 'banktransfers' ? 'Bank Transfers' : tab}
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
                <div className="text-2xl font-bold text-green-600">
                  {dashboardLoading ? '...' : `₹${dashboardData.totalPayroll.toLocaleString()}`}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employees Paid</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardLoading ? '...' : dashboardData.employeesPaid}
                </div>
                <p className="text-xs text-muted-foreground">
                  Out of {dashboardLoading ? '...' : dashboardData.totalEmployees} employees
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reimbursements</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  ₹{dashboardData.pendingReimbursements.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.pendingReimbursementCount} requests pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Salary</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {dashboardLoading ? '...' : `₹${dashboardData.avgSalary.toLocaleString()}`}
                </div>
                <p className="text-xs text-muted-foreground">Average per employee</p>
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
                  {dashboardLoading ? (
                    <div className="text-center py-4">Loading department data...</div>
                  ) : departmentData.length > 0 ? (
                    departmentData.map((item) => (
                      <div key={item.department} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                          <span className="font-medium">{item.department}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{item.amount.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">{item.percentage}%</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">No department data available</div>
                  )}
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
                    onClick={handleOpenCalculateModal}
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
                    <span>Approve bulk ({selectedEmployees.length})</span>
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
                            <td className="py-3 px-4">₹{record.totalAllowances?.toLocaleString() || '0'}</td>
                            <td className="py-3 px-4">₹{record.totalDeductions?.toLocaleString()}</td>
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
                                  <>
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
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleIndividualApprove(record)}
                                      className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-1"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                      <span>Approve</span>
                                    </Button>
                                  </>
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

      {/* Finance Tab */}
      {selectedTab === 'finance' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Finance Payroll Management</CardTitle>
              <CardDescription>Approve HR-approved payroll and manage payments</CardDescription>
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
                    onClick={handleFinanceBulkApprove}
                    variant="outline"
                    disabled={selectedEmployees.length === 0 || hrPayrollLoading}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve for Payment ({selectedEmployees.length})</span>
                  </Button>
                  <Button 
                    onClick={() => {/* TODO: Implement payment file generation */}}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Generate Payment File</span>
                  </Button>
                </div>
              </div>

              {hrPayrollLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading payroll data...</span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="w-12 py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.length === filteredFinanceRecords.length && filteredFinanceRecords.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployees(filteredFinanceRecords.map(record => record.id));
                            } else {
                              setSelectedEmployees([]);
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Employee</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Department</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Basic Salary</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Allowances</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Deductions</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Net Salary</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFinanceRecords.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-8 text-gray-500">
                          No HR-approved payroll records found for finance approval
                        </td>
                      </tr>
                    ) : (
                      filteredFinanceRecords
                        .filter(record => record.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
                        .map((record) => (
                          <tr key={record.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={selectedEmployees.includes(record.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedEmployees([...selectedEmployees, record.id]);
                                  } else {
                                    setSelectedEmployees(selectedEmployees.filter(id => id !== record.id));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {record.employee?.name || 'Unknown'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {record.employee?.employeeId || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-900 dark:text-white">
                              {record.employee?.department || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                              ₹{Number(record.baseSalary || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                              ₹{Number(record.totalAllowances || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                              ₹{Number(record.totalDeductions || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                              ₹{Number(record.netSalary || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                record.status === 'HR_APPROVED' 
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                  : record.status === 'FINANCE_APPROVED'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                              }`}>
                                {record.status === 'HR_APPROVED' ? 'Pending Finance' : 
                                 record.status === 'FINANCE_APPROVED' ? 'Finance Approved' : 
                                 record.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                {record.status === 'HR_APPROVED' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleFinanceApprove(record)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPayrollRecord(record);
                                    setShowViewModal(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
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

      {/* Bank Transfers Tab */}
      {selectedTab === 'banktransfers' && (
        <div className="space-y-6">
          {/* Header with Month Filter */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Bank Transfers</CardTitle>
                  <CardDescription>Manage bank transfers for Finance-approved payroll</CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="month"
                    value={payrollMonth}
                    onChange={(e) => setPayrollMonth(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Transfer Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{bankTransferSummary.totalEmployees}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{bankTransferSummary.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900/20">
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{bankTransferSummary.pending.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{bankTransferSummary.completed.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bank Transfer Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Bank Transfer Management</CardTitle>
                  <CardDescription>Finance-approved employees ready for bank transfer</CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline"
                    disabled={selectedTransferEmployees.length === 0 || bankTransferLoading}
                    onClick={handleBulkTransfer}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Transfer Selected ({selectedTransferEmployees.length})</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="w-12 py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedTransferEmployees.length === bankTransferData.length && bankTransferData.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTransferEmployees(bankTransferData.map(record => record.id));
                            } else {
                              setSelectedTransferEmployees([]);
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Employee</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Bank Details</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">IFSC Code</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Transfer Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankTransferLoading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-gray-500">
                          Loading bank transfer data...
                        </td>
                      </tr>
                    ) : bankTransferData.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-gray-500">
                          No Finance-approved employees found for bank transfer
                        </td>
                      </tr>
                    ) : (
                      bankTransferData.map((record) => (
                        <tr key={record.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={selectedTransferEmployees.includes(record.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTransferEmployees([...selectedTransferEmployees, record.id]);
                                } else {
                                  setSelectedTransferEmployees(selectedTransferEmployees.filter(id => id !== record.id));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{record.employee?.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{record.employee?.id}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{record.bankDetails?.bankName}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{record.bankDetails?.accountNumber}</div>
                              <div className="text-xs text-gray-400">{record.bankDetails?.accountHolderName}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm font-mono text-gray-900 dark:text-white">{record.bankDetails?.ifscCode}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900 dark:text-white">₹{Number(record.transferAmount).toLocaleString()}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              record.transferStatus === 'PENDING' 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : record.transferStatus === 'PROCESSING'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                : record.transferStatus === 'COMPLETED'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {record.transferStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {record.transferStatus === 'PENDING' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleIndividualTransfer(record)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Transfer
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewBankReceipt(record)}
                                disabled={bankReceiptLoading}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                {bankReceiptLoading ? 'Loading...' : 'View'}
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
                  <p className="text-gray-900 dark:text-white">${selectedPayroll.totalAllowances?.toLocaleString()}</p>
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
                    <p className="text-gray-900 dark:text-white font-medium text-green-600">${selectedEmployee.totalAllowances?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Deductions</label>
                    <p className="text-gray-900 dark:text-white font-medium text-red-600">-${selectedEmployee.totalDeductions?.toLocaleString()}</p>
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
                    checked={selectedEmployees.length === eligibleEmployees.length && eligibleEmployees.length > 0}
                    onChange={(e) => handleSelectAllEmployees(e.target.checked)}
                    className="rounded border-gray-300"
                    disabled={loadingEligibleEmployees || eligibleEmployees.length === 0}
                  />
                  <span className="font-medium">Select All Employees</span>
                </div>
                <span className="text-sm text-gray-500">
                  {selectedEmployees.length} of {eligibleEmployees.length} selected
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {loadingEligibleEmployees ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Loading eligible employees...</div>
                  </div>
                ) : eligibleEmployees.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">No eligible employees found for {payrollMonth}</div>
                  </div>
                ) : (
                  eligibleEmployees.map(employee => (
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
                  ))
                )}
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
                    {Object.entries(selectedPayrollRecord.allowances || {}).length > 0 ? (
                      <>
                        {Object.entries(selectedPayrollRecord.allowances || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400 capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="text-green-600 font-medium">₹{Number(value).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-medium border-t pt-2">
                          <span>Total Allowances:</span>
                          <span className="text-green-600">₹{Object.values(selectedPayrollRecord.allowances || {}).reduce((sum, val) => sum + Number(val), 0).toLocaleString()}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-500 italic text-center py-2">
                        No allowances configured
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Deductions</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedPayrollRecord.deductions || {}).length > 0 || selectedPayrollRecord.lwpDeduction > 0 ? (
                      <>
                        {Object.entries(selectedPayrollRecord.deductions || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400 capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="text-red-600 font-medium">₹{Number(value).toLocaleString()}</span>
                          </div>
                        ))}
                        {selectedPayrollRecord.lwpDeduction > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">LWP Deduction:</span>
                            <span className="text-red-600 font-medium">₹{Number(selectedPayrollRecord.lwpDeduction).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium border-t pt-2">
                          <span>Total Deductions:</span>
                          <span className="text-red-600">₹{Number(selectedPayrollRecord.totalDeductions || 0).toLocaleString()}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-500 italic text-center py-2">
                        No deductions applied
                      </div>
                    )}
                  </div>
                </div>

                {/* Salary Calculation Summary */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Salary Calculation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Basic Salary:</span>
                      <span>₹{Number(selectedPayrollRecord.baseSalary || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>+ Total Allowances:</span>
                      <span>₹{Object.values(selectedPayrollRecord.allowances || {}).reduce((sum, val) => sum + Number(val), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>= Gross Salary:</span>
                      <span>₹{(Number(selectedPayrollRecord.baseSalary || 0) + Object.values(selectedPayrollRecord.allowances || {}).reduce((sum, val) => sum + Number(val), 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>- Total Deductions:</span>
                      <span>₹{Number(selectedPayrollRecord.totalDeductions || 0).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-medium text-lg">
                      <span>= Net Salary:</span>
                      <span className="text-green-600">₹{Number(selectedPayrollRecord.netSalary || 0).toLocaleString()}</span>
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

            <form className="space-y-4" onSubmit={handleAdjustmentSubmit}>
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

      {/* Individual Approval Confirmation Modal */}
      {showApprovalConfirm && recordToApprove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Confirm Payroll Approval</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowApprovalConfirm(false);
                  setRecordToApprove(null);
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100">
                      Approve Payroll Record
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      This action will approve the payroll for this employee
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Employee Details:</div>
                <div className="font-medium">{recordToApprove.employee?.name || 'Unknown'}</div>
                <div className="text-sm text-gray-500">{recordToApprove.employee?.department || 'N/A'}</div>
                <div className="text-sm text-gray-500 mt-1">
                  Net Salary: ₹{Number(recordToApprove.netSalary || 0).toLocaleString()}
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> Once approved, this payroll record will move to HR_APPROVED status and cannot be modified without admin intervention.
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowApprovalConfirm(false);
                  setRecordToApprove(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmIndividualApproval}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Payroll
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Approval Confirmation Modal */}
      {showBulkApprovalConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Confirm Bulk Payroll Approval</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowBulkApprovalConfirm(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100">
                      Approve Multiple Payroll Records
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      This action will approve payroll for selected employees
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Selected Employees for Approval:</div>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {hrPayrollRecords
                    .filter(record => selectedEmployees.includes(record.id) && record.status === 'CALCULATED')
                    .map((record, index) => (
                      <div key={record.id} className="flex justify-between items-center py-1">
                        <div>
                          <div className="font-medium text-sm">{record.employee?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{record.employee?.department || 'N/A'}</div>
                        </div>
                        <div className="text-sm font-medium">
                          ₹{Number(record.netSalary || 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center font-medium">
                    <span>Total Records:</span>
                    <span>{hrPayrollRecords.filter(record => selectedEmployees.includes(record.id) && record.status === 'CALCULATED').length}</span>
                  </div>
                  <div className="flex justify-between items-center font-medium text-green-600">
                    <span>Total Amount:</span>
                    <span>₹{hrPayrollRecords
                      .filter(record => selectedEmployees.includes(record.id) && record.status === 'CALCULATED')
                      .reduce((sum, record) => sum + Number(record.netSalary || 0), 0)
                      .toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> Once approved, these payroll records will move to HR_APPROVED status and cannot be modified without admin intervention.
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowBulkApprovalConfirm(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmBulkApproval}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={hrPayrollLoading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {hrPayrollLoading ? 'Approving...' : 'Approve All Selected'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Transfer Confirmation Modal */}
      {showTransferConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Bank Transfer
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowTransferConfirm(false);
                  setSelectedTransferRecord(null);
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {transferType === 'individual' && selectedTransferRecord ? (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    You are about to initiate a bank transfer for:
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Employee:</span>
                      <span>{selectedTransferRecord.employee?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Bank:</span>
                      <span>{selectedTransferRecord.bankDetails?.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Account:</span>
                      <span>{selectedTransferRecord.bankDetails?.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Amount:</span>
                      <span className="font-bold text-green-600">₹{Number(selectedTransferRecord.transferAmount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    You are about to initiate bulk bank transfers for:
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Selected Employees:</span>
                      <span>{selectedTransferEmployees.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Amount:</span>
                      <span className="font-bold text-green-600">
                        ₹{bankTransferData
                          .filter(record => selectedTransferEmployees.includes(record.id))
                          .reduce((sum, record) => sum + Number(record.transferAmount), 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Employees:</p>
                    {bankTransferData
                      .filter(record => selectedTransferEmployees.includes(record.id))
                      .map(record => (
                        <div key={record.id} className="text-sm text-gray-600 dark:text-gray-400">
                          • {record.employee?.name} - ₹{Number(record.transferAmount).toLocaleString()}
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ This action cannot be undone. The bank transfer will be initiated immediately.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowTransferConfirm(false);
                  setSelectedTransferRecord(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmTransfer}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Confirm Transfer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Transfer Receipt Modal */}
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
                    onClick={() => window.print()}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Print
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

      {/* Report Generation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Generate Report
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowReportModal(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Type
                </label>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-900 text-white"
                  >
                    Monthly
                  </Button>
                </div>
              </div>

              {/* Month Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Month
                </label>
                <input
                  type="month"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transfer Status
                </label>
                <select
                  value={reportStatus}
                  onChange={(e) => setReportStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Export Format
                </label>
                <div className="flex space-x-2">
                  <Button
                    variant={reportFormat === 'excel' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReportFormat('excel')}
                    className={reportFormat === 'excel' ? 'bg-blue-600 text-white' : ''}
                  >
                    Excel
                  </Button>
                  <Button
                    variant={reportFormat === 'pdf' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReportFormat('pdf')}
                    className={reportFormat === 'pdf' ? 'bg-blue-600 text-white' : ''}
                  >
                    PDF
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowReportModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={generateReport}
                disabled={reportLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {reportLoading ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagement;
