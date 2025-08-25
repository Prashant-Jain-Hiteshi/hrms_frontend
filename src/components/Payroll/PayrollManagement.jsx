import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  DollarSign, Plus, Search, Filter, Calendar, 
  TrendingUp, Users, FileText, Download, Edit, 
  Trash2, Receipt, Eye, Activity, Clock, XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const PayrollManagement = () => {
  const { user } = useAuth();
  const { employees, payrollRecords } = useData();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  const payrollData = [
    { month: 'Aug', gross: 450000, net: 380000, deductions: 70000 },
    { month: 'Sep', gross: 465000, net: 395000, deductions: 70000 },
    { month: 'Oct', gross: 470000, net: 398000, deductions: 72000 },
    { month: 'Nov', gross: 485000, net: 410000, deductions: 75000 },
    { month: 'Dec', gross: 520000, net: 440000, deductions: 80000 },
    { month: 'Jan', gross: 495000, net: 420000, deductions: 75000 }
  ];

  const employeePayroll = [
    {
      id: 1,
      name: 'John Doe',
      position: 'Software Engineer',
      department: 'Engineering',
      basicSalary: 8000,
      allowances: 1200,
      deductions: 1800,
      netSalary: 7400,
      status: 'processed'
    },
    {
      id: 2,
      name: 'Jane Smith',
      position: 'Product Manager',
      department: 'Product',
      basicSalary: 9500,
      allowances: 1500,
      deductions: 2100,
      netSalary: 8900,
      status: 'processed'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      position: 'Designer',
      department: 'Design',
      basicSalary: 7000,
      allowances: 1000,
      deductions: 1600,
      netSalary: 6400,
      status: 'pending'
    }
  ];

  const reimbursements = [
    {
      id: 1,
      employee: 'Sarah Wilson',
      type: 'Travel',
      amount: 450,
      date: '2024-02-10',
      status: 'pending',
      description: 'Client meeting travel expenses'
    },
    {
      id: 2,
      employee: 'David Brown',
      type: 'Medical',
      amount: 280,
      date: '2024-02-08',
      status: 'approved',
      description: 'Health checkup reimbursement'
    },
    {
      id: 3,
      employee: 'Lisa Garcia',
      type: 'Equipment',
      amount: 120,
      date: '2024-02-05',
      status: 'rejected',
      description: 'Office supplies'
    }
  ];

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
          {['overview', 'payroll', 'reimbursements'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                selectedTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
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
            <Card>
              <CardHeader>
                <CardTitle>Payroll Trends</CardTitle>
                <CardDescription>Monthly payroll breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={payrollData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                    <Bar dataKey="gross" fill="#3b82f6" name="Gross Pay" />
                    <Bar dataKey="net" fill="#10b981" name="Net Pay" />
                    <Bar dataKey="deductions" fill="#ef4444" name="Deductions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

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
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="2024-02">February 2024</option>
                  <option value="2024-01">January 2024</option>
                  <option value="2023-12">December 2023</option>
                </select>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
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
                    {filteredPayroll.map((employee) => (
                      <tr key={employee.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-primary/10 rounded-full p-2">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{employee.name}</div>
                              <div className="text-sm text-gray-500">{employee.position}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{employee.department}</td>
                        <td className="py-3 px-4 text-sm">${employee.basicSalary.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm">${employee.allowances.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm">${employee.deductions.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm font-medium">${employee.netSalary.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                            {employee.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => generatePayslip(employee)}
                              className="flex items-center space-x-1"
                            >
                              <FileText className="h-3 w-3" />
                              <span>Payslip</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowViewModal(true);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              <span>View</span>
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
                                setSelectedPayroll(record);
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
    </div>
  );
};

export default PayrollManagement;
