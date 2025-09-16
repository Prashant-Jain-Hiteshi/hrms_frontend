import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Calculator, Users, Calendar, DollarSign, 
  Clock, AlertCircle, CheckCircle, Eye, Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = 'http://localhost:3001/api';

const DynamicPayrollManagement = () => {
  const { user, token } = useAuth();
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [payrollPreview, setPayrollPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [activeTab, setActiveTab] = useState('calculate');

  useEffect(() => {
    fetchEmployees();
    // Set default period to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setPeriodStart(firstDay.toISOString().split('T')[0]);
    setPeriodEnd(lastDay.toISOString().split('T')[0]);
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setEmployees(data.data || data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const calculatePayrollPreview = async () => {
    if (!selectedEmployees.length || !periodStart || !periodEnd) {
      alert('Please select employees and date range');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/payroll/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeIds: selectedEmployees,
          periodStart,
          periodEnd
        })
      });
      const data = await response.json();
      setPayrollPreview(data);
      setActiveTab('preview');
    } catch (error) {
      console.error('Error calculating payroll:', error);
      alert('Error calculating payroll');
    } finally {
      setLoading(false);
    }
  };

  const processPayroll = async () => {
    if (!payrollPreview.length) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/payroll/process-dynamic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeIds: selectedEmployees,
          periodStart,
          periodEnd,
          notes: 'Dynamic payroll processed with attendance and leave integration'
        })
      });
      const data = await response.json();
      alert('Payroll processed successfully!');
      setPayrollPreview([]);
      setSelectedEmployees([]);
      setActiveTab('calculate');
    } catch (error) {
      console.error('Error processing payroll:', error);
      alert('Error processing payroll');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployeeSelection = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAllEmployees = () => {
    setSelectedEmployees(employees.map(emp => emp.id));
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dynamic Payroll Management</h1>
        <div className="flex space-x-2">
          <Button 
            variant={activeTab === 'calculate' ? 'default' : 'outline'}
            onClick={() => setActiveTab('calculate')}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculate
          </Button>
          <Button 
            variant={activeTab === 'preview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('preview')}
            disabled={!payrollPreview.length}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      {activeTab === 'calculate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Period Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Pay Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Employee Selection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Select Employees ({selectedEmployees.length} selected)
                </div>
                <div className="space-x-2">
                  <Button size="sm" variant="outline" onClick={selectAllEmployees}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {employees.map(employee => (
                  <div 
                    key={employee.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedEmployees.includes(employee.id)
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => toggleEmployeeSelection(employee.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{employee.name}</h4>
                        <p className="text-sm text-gray-600">{employee.department} • {employee.designation}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${employee.salary?.toLocaleString() || 'N/A'}</p>
                        <p className="text-sm text-gray-600">Base Salary</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Calculate Button */}
          <div className="lg:col-span-3">
            <Button 
              onClick={calculatePayrollPreview}
              disabled={loading || !selectedEmployees.length}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Dynamic Payroll
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'preview' && payrollPreview.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Payroll Preview</h2>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setActiveTab('calculate')}>
                Back to Calculate
              </Button>
              <Button onClick={processPayroll} disabled={loading}>
                {loading ? 'Processing...' : 'Process Payroll'}
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {payrollPreview.map((calc, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <div>
                      <h3>{calc.employee.name}</h3>
                      <p className="text-sm text-gray-600">{calc.employee.department} • {calc.employee.designation}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ${calc.calculations.netSalary.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Net Salary</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Attendance Summary */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Attendance
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Working Days:</span>
                          <span>{calc.attendanceSummary.totalWorkingDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Present:</span>
                          <span className="text-green-600">{calc.attendanceSummary.presentDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Absent:</span>
                          <span className="text-red-600">{calc.attendanceSummary.absentDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Late:</span>
                          <span className="text-yellow-600">{calc.attendanceSummary.lateDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Half Days:</span>
                          <span className="text-orange-600">{calc.attendanceSummary.halfDays}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-2">
                          <span>Actual Working:</span>
                          <span>{calc.attendanceSummary.actualWorkingDays}</span>
                        </div>
                      </div>
                    </div>

                    {/* Leave Summary */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Leave Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Allowed:</span>
                          <span>{calc.leaveSummary.totalLeavesAllowed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taken:</span>
                          <span>{calc.leaveSummary.leavesTaken}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Excess:</span>
                          <span className="text-red-600">{calc.leaveSummary.excessLeaves}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-2">
                          <span>Unpaid Leaves:</span>
                          <span className="text-red-600">{calc.leaveSummary.unpaidLeaves}</span>
                        </div>
                        {calc.calculations.leaveDeductions > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Deduction:</span>
                            <span>-${calc.calculations.leaveDeductions.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Salary Breakdown */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Salary Breakdown
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Basic:</span>
                          <span>${calc.salaryStructure.basicSalary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Allowances:</span>
                          <span className="text-green-600">+${calc.calculations.totalAllowances.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Deductions:</span>
                          <span className="text-red-600">-${calc.calculations.totalDeductions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Leave Deductions:</span>
                          <span className="text-red-600">-${calc.calculations.leaveDeductions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2 text-lg">
                          <span>Net Salary:</span>
                          <span className="text-green-600">${calc.calculations.netSalary.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicPayrollManagement;
