import { api } from './api';

// HR Payroll API endpoints
export const HRPayrollAPI = {
  // Calculate payroll for multiple employees
  calculatePayrollBatch: (data) => 
    api.post('/payroll/hr/calculate-batch', data),
  
  // Get payroll records for a specific month
  getPayrollRecords: (month) => 
    api.get(`/payroll/hr/records/${month}`),
  
  // Get payroll summary for a specific month
  getPayrollSummary: (month) => 
    api.get(`/payroll/hr/summary/${month}`),
  
  // Adjust individual payroll record
  adjustPayroll: (recordId, adjustmentData) => 
    api.put(`/payroll/hr/adjust/${recordId}`, adjustmentData),
  
  // Bulk approve payroll records
  bulkApprovePayroll: (data) => 
    api.post('/payroll/hr/approve-bulk', data),
  
  // Get all employees for selection
  getEmployeesForPayroll: () => 
    api.get('/employees'),
};
