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
  
  // Approve individual payroll record
  approvePayroll: (recordId, approvalNotes) => 
    api.put(`/payroll/hr/approve/${recordId}`, { approvalNotes }),

  // Bulk approve payroll records
  bulkApprovePayroll: (data) => 
    api.post('/payroll/hr/approve-bulk', data),
  
  // Get all employees for selection
  getEmployeesForPayroll: () => 
    api.get('/employees'),
  
  // Get employees eligible for specific payroll month
  getEligibleEmployees: (month) => 
    api.get(`/payroll/hr/eligible-employees/${month}`),
  
  // Get dashboard summary for HR overview
  getDashboardSummary: (month) => 
    api.get(`/payroll/hr/dashboard-summary/${month}`),
  
  // Get department breakdown for salary distribution
  getDepartmentBreakdown: (month) => 
    api.get(`/payroll/hr/department-breakdown/${month}`),

  // Finance Approval APIs
  getPendingFinanceApprovals: (month) => 
    api.get(`/payroll/finance/pending-approvals/${month}`),
  
  financeApprovePayroll: (recordId, approvalNotes) => 
    api.put(`/payroll/finance/approve/${recordId}`, { approvalNotes }),
  
  financeBulkApprovePayroll: (recordIds, approvalNotes) => 
    api.post('/payroll/finance/approve-bulk', { recordIds, approvalNotes }),

  // Bank Transfer APIs
  getBankTransferData: (month) => 
    api.get(`/payroll/finance/bank-transfers/${month}`),
  
  initiateBankTransfer: (bankDetailIds) => 
    api.post('/payroll/finance/initiate-bank-transfer', { bankDetailIds }),
  
  getBankTransferSummary: (month) => 
    api.get(`/payroll/finance/bank-transfer-summary/${month}`),
  
  getBankTransferReceipt: (bankDetailId) => 
    api.get(`/payroll/finance/bank-transfer-receipt/${bankDetailId}`),
  
  generateBankTransferReport: (month, status = 'ALL') => 
    api.get(`/payroll/finance/bank-transfer-report?month=${month}&status=${status}`),
};
