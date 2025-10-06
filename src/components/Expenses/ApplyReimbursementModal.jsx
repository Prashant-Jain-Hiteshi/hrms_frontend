import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Calendar, 
  DollarSign, 
  Building2, 
  AlertCircle,
  Calculator,
  Trash2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import expenseReimbursementAPI from '../../lib/expenseReimbursementApi';

const ApplyReimbursementModal = ({ isOpen, onClose, categories, onSubmit }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    expenseDate: '',
    description: '',
    vendor: '',
    businessPurpose: '',
    receipts: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewCalculation, setPreviewCalculation] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        categoryId: '',
        amount: '',
        expenseDate: '',
        description: '',
        vendor: '',
        businessPurpose: '',
        receipts: []
      });
      setFormErrors({});
      setPreviewCalculation(null);
    }
  }, [isOpen]);

  useEffect(() => {
    // Calculate preview when category and amount change
    if (formData.categoryId && formData.amount) {
      calculatePreview();
    } else {
      setPreviewCalculation(null);
    }
  }, [formData.categoryId, formData.amount]);

  const calculatePreview = () => {
    const amount = parseFloat(formData.amount);
    
    if (formData.categoryId && amount > 0) {
      const category = categories.find(c => c.id === formData.categoryId);
      if (category) {
        const approvedAmount = (amount * category.autoApprovalPercent) / 100;
        setPreviewCalculation({
          requestedAmount: amount,
          approvedAmount: approvedAmount,
          approvalPercentage: category.autoApprovalPercent,
          categoryName: category.categoryName
        });
      }
    } else {
      setPreviewCalculation(null);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFileUpload = (files) => {
    const validFiles = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 5MB.`);
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} is not supported. Only JPG, PNG, GIF, and PDF files are allowed.`);
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        receipts: [...prev.receipts, ...validFiles].slice(0, 5) // Max 5 files
      }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      receipts: prev.receipts.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.categoryId) {
      errors.categoryId = 'Please select an expense category';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    }

    if (!formData.expenseDate) {
      errors.expenseDate = 'Please select the expense date';
    }

    if (!formData.description.trim()) {
      errors.description = 'Please provide a description';
    }

    // Check if expense date is not in the future
    if (formData.expenseDate && new Date(formData.expenseDate) > new Date()) {
      errors.expenseDate = 'Expense date cannot be in the future';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const submissionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        approvedAmount: previewCalculation?.approvedAmount || 0,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      onSubmit(submissionData);
      onClose();
    } catch (error) {
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Apply for Expense Reimbursement
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Expense Category *
              </label>
              <select
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.categoryName} ({category.autoApprovalPercent}% approval)
                  </option>
                ))}
              </select>
              {formErrors.categoryId && (
                <p className="text-red-500 text-xs mt-1">{formErrors.categoryId}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Amount (₹) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-10"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                />
              </div>
              {formErrors.amount && (
                <p className="text-red-500 text-xs mt-1">{formErrors.amount}</p>
              )}
            </div>

            {/* Expense Date */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Expense Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="date"
                  className="pl-10"
                  value={formData.expenseDate}
                  onChange={(e) => handleInputChange('expenseDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              {formErrors.expenseDate && (
                <p className="text-red-500 text-xs mt-1">{formErrors.expenseDate}</p>
              )}
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Vendor/Merchant
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="e.g., Restaurant ABC, Uber, etc."
                  className="pl-10"
                  value={formData.vendor}
                  onChange={(e) => handleInputChange('vendor', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description *
            </label>
            <textarea
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              rows="3"
              placeholder="Describe what this expense was for..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
            {formErrors.description && (
              <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
            )}
          </div>

          {/* Business Purpose */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Business Purpose
            </label>
            <textarea
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              rows="2"
              placeholder="Why was this expense necessary for business?"
              value={formData.businessPurpose}
              onChange={(e) => handleInputChange('businessPurpose', e.target.value)}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Upload Receipts (Optional)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Drag and drop files here, or{' '}
                <label className="text-blue-600 cursor-pointer hover:underline">
                  browse
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PDF, JPG, PNG, GIF (Max 5MB each, up to 5 files)
              </p>
            </div>

            {/* Uploaded Files */}
            {formData.receipts.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.receipts.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Calculation */}
          {previewCalculation && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Calculator className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Reimbursement Preview
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Requested Amount:</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(previewCalculation.requestedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">
                    You will receive ({previewCalculation.approvalPercentage}%):
                  </p>
                  <p className="font-semibold text-green-600 text-lg">
                    {formatCurrency(previewCalculation.approvedAmount)}
                  </p>
                </div>
              </div>
              <div className="flex items-center mt-2 text-xs text-blue-700 dark:text-blue-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                Based on {previewCalculation.categoryName} category policy
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyReimbursementModal;
