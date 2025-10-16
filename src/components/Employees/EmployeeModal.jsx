import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, User, Mail, Phone, MapPin, Calendar, Building, Briefcase, Loader2 } from 'lucide-react';
import { MOCK_DEPARTMENTS } from '../../data/mockData';

const EmployeeModal = ({ isOpen, onClose, onSubmit, title, employee = null, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    joiningDate: '',
    address: '',
    salary: '',
    status: 'active'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || '',
        designation: employee.designation || '',
        joiningDate: employee.joiningDate || '',
        address: employee.address || '',
        salary: employee.salary || '',
        status: employee.status || 'active'
      });
    } else {
      setFormData(prev => ({
        ...prev,
        joiningDate: new Date().toISOString().split('T')[0]
      }));
    }
  }, [employee]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone number
    if (name === 'phone') {
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      // Limit to 10 digits
      const limitedDigits = digitsOnly.slice(0, 10);
      
      setFormData(prev => ({
        ...prev,
        [name]: limitedDigits
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
    if (!formData.joiningDate) newErrors.joiningDate = 'Joining date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const employeeData = {
      ...formData,
      id: employee?.id || Date.now(),
      salary: formData.salary ? parseFloat(formData.salary) : 0
    };

    onSubmit(employeeData);
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      joiningDate: '',
      address: '',
      salary: '',
      status: 'active'
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Prevent closing modal when loading or when clicking on modal content
        if (isLoading || e.target !== e.currentTarget) return;
        onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 dark:bg-gray-800 dark:bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
            <div className="flex flex-col items-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {employee ? 'Updating employee...' : 'Adding employee...'}
              </p>
            </div>
          </div>
        )}
        
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name *</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter full name"
                      disabled={isLoading}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  {employee && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Employee ID</label>
                      <Input
                        name="employeeId"
                        value={employee.employeeId || ''}
                        disabled
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address *</label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john.doe@company.com"
                      disabled={isLoading}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number * (10 digits)</label>
                    <Input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="8107399783"
                      maxLength="10"
                      pattern="[0-9]{10}"
                      disabled={isLoading}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    <p className="text-xs text-gray-500 mt-1"></p>
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter full address"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Work Information */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Work Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Department *</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className={`w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-background text-foreground ${errors.department ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select Department</option>
                      {MOCK_DEPARTMENTS.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                    {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Designation *</label>
                    <Input
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      placeholder="Software Developer"
                      disabled={isLoading}
                      className={errors.designation ? 'border-red-500' : ''}
                    />
                    {errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Joining Date *</label>
                    <Input
                      name="joiningDate"
                      type="date"
                      value={formData.joiningDate}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className={errors.joiningDate ? 'border-red-500' : ''}
                    />
                    {errors.joiningDate && <p className="text-red-500 text-xs mt-1">{errors.joiningDate}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Salary</label>
                    <Input
                      name="salary"
                      type="number"
                      value={formData.salary}
                      onChange={handleInputChange}
                      placeholder="50000"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-background text-foreground"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {employee ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    employee ? 'Update Employee' : 'Add Employee'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeModal;
