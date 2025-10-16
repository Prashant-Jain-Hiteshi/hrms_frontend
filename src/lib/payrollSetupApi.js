import { api } from './api';

// PayrollSetup API endpoints
export const PayrollSetupAPI = {
  // Pay Components
  getPayComponents: (includeInactive = false) => 
    api.get(`/payroll-setup/components?includeInactive=${includeInactive}`),
  
  getPayComponent: (id) => 
    api.get(`/payroll-setup/components/${id}`),
  
  createPayComponent: (data) => 
    api.post('/payroll-setup/components', data),
  
  updatePayComponent: (id, data) => 
    api.put(`/payroll-setup/components/${id}`, data),
  
  deletePayComponent: (id) => 
    api.delete(`/payroll-setup/components/${id}`),

  // Company Bank Accounts
  getBankAccounts: (includeInactive = false) => 
    api.get(`/payroll-setup/bank-accounts?includeInactive=${includeInactive}`),
  
  getBankAccount: (id) => 
    api.get(`/payroll-setup/bank-accounts/${id}`),
  
  createBankAccount: (data) => 
    api.post('/payroll-setup/bank-accounts', data),
  
  updateBankAccount: (id, data) => 
    api.put(`/payroll-setup/bank-accounts/${id}`, data),
  
  deleteBankAccount: (id) => 
    api.delete(`/payroll-setup/bank-accounts/${id}`),

  // Salary Templates
  getSalaryTemplates: (includeInactive = false) => 
    api.get(`/payroll-setup/salary-templates?includeInactive=${includeInactive}`),
  
  getSalaryTemplate: (id) => 
    api.get(`/payroll-setup/salary-templates/${id}`),
  
  createSalaryTemplate: (data) => 
    api.post('/payroll-setup/salary-templates', data),
  
  updateSalaryTemplate: (id, data) => 
    api.put(`/payroll-setup/salary-templates/${id}`, data),
  
  deleteSalaryTemplate: (id) => 
    api.delete(`/payroll-setup/salary-templates/${id}`),

  // Statutory Settings
  getStatutorySettings: () => 
    api.get('/payroll-setup/statutory-settings'),
  
  updateStatutorySettings: (data) => 
    api.put('/payroll-setup/statutory-settings', data),

  // Company Payroll Info
  getCompanyPayrollInfo: () => 
    api.get('/payroll-setup/company-info'),
  
  updateCompanyPayrollInfo: (data) => 
    api.put('/payroll-setup/company-info', data),

  // Test Calculation
  testPayrollCalculation: (data) => 
    api.post('/payroll-setup/test-calculation', data),
};
