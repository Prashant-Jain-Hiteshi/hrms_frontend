import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Building2, Save, Edit } from 'lucide-react';
import { PayrollSetupAPI } from '../../lib/payrollSetupApi';
import { toast } from 'react-toastify';

const CompanyPayrollInfo = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    panNumber: '',
    payrollCycle: 'MONTHLY',
    payrollProcessingDate: 1,
    salaryDisbursementDate: 5
  });
  const [formErrors, setFormErrors] = useState({});

  // Load company info on component mount
  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    setLoading(true);
    try {
      console.log('Loading company payroll info...');
      const response = await PayrollSetupAPI.getCompanyPayrollInfo();
      console.log('✅ Company payroll info loaded:', response.data);
      
      if (response.data) {
        // Map backend response to frontend state
        setCompanyInfo({
          name: response.data.companyName || '',
          address: response.data.address || '',
          city: response.data.city || '',
          state: response.data.state || '',
          pincode: response.data.pincode || '',
          gstin: response.data.gstin || '',
          panNumber: response.data.panNumber || '',
          payrollCycle: response.data.payrollCycle || 'MONTHLY',
          payrollProcessingDate: response.data.payrollProcessingDate || 1,
          salaryDisbursementDate: response.data.salaryDisbursementDate || 5
        });
      }
    } catch (error) {
      console.error('Error loading company info:', error);
      // Don't show error toast for first-time setup - backend creates default record
      if (error.response?.status !== 404) {
        toast.error('Failed to load company information');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!companyInfo.name.trim()) {
      errors.name = 'Company name is required';
    }
    
    if (!companyInfo.address.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!companyInfo.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!companyInfo.state.trim()) {
      errors.state = 'State is required';
    }
    
    if (!companyInfo.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(companyInfo.pincode)) {
      errors.pincode = 'Pincode must be 6 digits';
    }
    
    if (companyInfo.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(companyInfo.gstin)) {
      errors.gstin = 'Invalid GSTIN format';
    }
    
    if (companyInfo.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(companyInfo.panNumber)) {
      errors.panNumber = 'Invalid PAN format';
    }
    
    if (companyInfo.payrollProcessingDate < 1 || companyInfo.payrollProcessingDate > 31) {
      errors.payrollProcessingDate = 'Processing date must be between 1-31';
    }
    
    if (companyInfo.salaryDisbursementDate < 1 || companyInfo.salaryDisbursementDate > 31) {
      errors.salaryDisbursementDate = 'Disbursement date must be between 1-31';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Map frontend state to backend DTO format
      const payload = {
        companyName: companyInfo.name,
        address: companyInfo.address,
        city: companyInfo.city,
        state: companyInfo.state,
        pincode: companyInfo.pincode,
        gstin: companyInfo.gstin,
        panNumber: companyInfo.panNumber,
        payrollCycle: companyInfo.payrollCycle,
        payrollProcessingDate: companyInfo.payrollProcessingDate,
        salaryDisbursementDate: companyInfo.salaryDisbursementDate
      };
      
      console.log('💾 Saving company payroll info:', payload);
      const response = await PayrollSetupAPI.updateCompanyPayrollInfo(payload);
      console.log('✅ Company payroll info saved:', response.data);
      
      toast.success('Company payroll information updated successfully');
      setIsEditing(false);
      
      // Reload data to show updated values
      await loadCompanyInfo();
    } catch (error) {
      console.error('Error saving company info:', error);
      
      // Handle specific backend DTO validation error
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message;
        if (errorMessage?.includes('should not exist')) {
          toast.error('Backend API not configured yet. Please implement the Company Payroll Info endpoint with proper DTO validation.');
        } else if (Array.isArray(errorMessage)) {
          toast.error(`Validation error: ${errorMessage.join(', ')}`);
        } else {
          toast.error(errorMessage || 'Invalid data provided');
        }
      } else {
        toast.error(error.response?.data?.message || 'Failed to save company information');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormErrors({});
    loadCompanyInfo(); // Reload original data
  };

  const handleInputChange = (field, value) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading && !isEditing) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <div>
              <CardTitle>Company Payroll Information</CardTitle>
              <CardDescription>
                Configure your company details for payroll processing
              </CardDescription>
            </div>
          </div>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <Save className="h-4 w-4" />
                <span>Save</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Basic Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Basic Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name *
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={companyInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., ABC Technologies Pvt Ltd"
                  className={formErrors.name ? 'border-red-500' : ''}
                />
              ) : (
                <p className="text-gray-900 dark:text-white py-2">
                  {companyInfo.name || 'Not configured'}
                </p>
              )}
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address *
              </label>
              {isEditing ? (
                <textarea
                  value={companyInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Complete office address"
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    formErrors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              ) : (
                <p className="text-gray-900 dark:text-white py-2">
                  {companyInfo.address || 'Not configured'}
                </p>
              )}
              {formErrors.address && (
                <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City *
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={companyInfo.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="e.g., Mumbai"
                    className={formErrors.city ? 'border-red-500' : ''}
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white py-2">
                    {companyInfo.city || 'Not configured'}
                  </p>
                )}
                {formErrors.city && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State *
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={companyInfo.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="e.g., Maharashtra"
                    className={formErrors.state ? 'border-red-500' : ''}
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white py-2">
                    {companyInfo.state || 'Not configured'}
                  </p>
                )}
                {formErrors.state && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pincode *
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={companyInfo.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  placeholder="e.g., 400001"
                  maxLength={6}
                  className={formErrors.pincode ? 'border-red-500' : ''}
                />
              ) : (
                <p className="text-gray-900 dark:text-white py-2">
                  {companyInfo.pincode || 'Not configured'}
                </p>
              )}
              {formErrors.pincode && (
                <p className="text-red-500 text-xs mt-1">{formErrors.pincode}</p>
              )}
            </div>
          </div>

          {/* Tax & Payroll Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Tax & Payroll Settings</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                GSTIN
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={companyInfo.gstin}
                  onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                  placeholder="e.g., 27ABCDE1234F1Z5"
                  maxLength={15}
                  className={formErrors.gstin ? 'border-red-500' : ''}
                />
              ) : (
                <p className="text-gray-900 dark:text-white py-2">
                  {companyInfo.gstin || 'Not configured'}
                </p>
              )}
              {formErrors.gstin && (
                <p className="text-red-500 text-xs mt-1">{formErrors.gstin}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                PAN Number
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={companyInfo.panNumber}
                  onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                  placeholder="e.g., AAAPA1234A"
                  maxLength={10}
                  className={formErrors.panNumber ? 'border-red-500' : ''}
                />
              ) : (
                <p className="text-gray-900 dark:text-white py-2">
                  {companyInfo.panNumber || 'Not configured'}
                </p>
              )}
              {formErrors.panNumber && (
                <p className="text-red-500 text-xs mt-1">{formErrors.panNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pay Cycle
              </label>
              {isEditing ? (
                <select
                  value={companyInfo.payrollCycle}
                  onChange={(e) => handleInputChange('payrollCycle', e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="BI_WEEKLY">Bi-Weekly</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              ) : (
                <p className="text-gray-900 dark:text-white py-2">
                  {companyInfo.payrollCycle?.replace('_', '-') || 'Monthly'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payroll Processing Date
              </label>
              {isEditing ? (
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={companyInfo.payrollProcessingDate}
                  onChange={(e) => handleInputChange('payrollProcessingDate', parseInt(e.target.value))}
                  placeholder="e.g., 25"
                  className={formErrors.payrollProcessingDate ? 'border-red-500' : ''}
                />
              ) : (
                <p className="text-gray-900 dark:text-white py-2">
                  {companyInfo.payrollProcessingDate ? `${companyInfo.payrollProcessingDate} of every month` : 'Not configured'}
                </p>
              )}
              {formErrors.payrollProcessingDate && (
                <p className="text-red-500 text-xs mt-1">{formErrors.payrollProcessingDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Salary Disbursement Date
              </label>
              {isEditing ? (
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={companyInfo.salaryDisbursementDate}
                  onChange={(e) => handleInputChange('salaryDisbursementDate', parseInt(e.target.value))}
                  placeholder="e.g., 5"
                  className={formErrors.salaryDisbursementDate ? 'border-red-500' : ''}
                />
              ) : (
                <p className="text-gray-900 dark:text-white py-2">
                  {companyInfo.salaryDisbursementDate ? `${companyInfo.salaryDisbursementDate} of every month` : 'Not configured'}
                </p>
              )}
              {formErrors.salaryDisbursementDate && (
                <p className="text-red-500 text-xs mt-1">{formErrors.salaryDisbursementDate}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyPayrollInfo;
