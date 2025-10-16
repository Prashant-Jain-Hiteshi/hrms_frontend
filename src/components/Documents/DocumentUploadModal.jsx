import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { DocumentAPI } from '../../lib/documentApi';
import { Upload, X } from 'lucide-react';

const DocumentUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    documentName: '',
    description: '',
    typeId: '',
    categoryId: '',
    file: null
  });
  
  // Dropdown data
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  
  // Form validation errors
  const [errors, setErrors] = useState({});

  // Fetch categories and types when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);

  const fetchDropdownData = async () => {
    try {
      setDropdownLoading(true);
      console.log('🔍 Fetching categories and types for upload form...');
      
      const [categoriesResponse, typesResponse] = await Promise.all([
        DocumentAPI.categories.getActive(),
        DocumentAPI.types.getActive()
      ]);
      
      setCategories(categoriesResponse.data.data || []);
      setTypes(typesResponse.data.data || []);
      
      console.log('✅ Dropdown data loaded:', {
        categories: categoriesResponse.data.data?.length || 0,
        types: typesResponse.data.data?.length || 0
      });
    } catch (error) {
      console.error('❌ Error fetching dropdown data:', error);
      toast.error('Failed to load categories and types');
    } finally {
      setDropdownLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'pptx', 'jpg', 'jpeg', 'png'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        toast.error('Invalid file type. Please select a valid document file.');
        return;
      }
      
      handleInputChange('file', file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.documentName.trim()) {
      newErrors.documentName = 'Document name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.typeId) {
      newErrors.typeId = 'Please select a document type';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }
    
    if (!formData.file) {
      newErrors.file = 'Please select a file to upload';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Uploading document:', formData);
      
      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append('documentName', formData.documentName);
      uploadData.append('description', formData.description);
      uploadData.append('typeId', formData.typeId);
      uploadData.append('categoryId', formData.categoryId);
      uploadData.append('files', formData.file);

      // Upload document
      const response = await DocumentAPI.documents.create(uploadData);
      
      toast.success('Document uploaded successfully!');
      console.log('✅ Document uploaded:', response.data);
      
      // Reset form and close modal
      resetForm();
      onClose();
      
      // Notify parent component
      if (onSuccess) {
        onSuccess(response.data.data);
      }
      
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      documentName: '',
      description: '',
      typeId: '',
      categoryId: '',
      file: null
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Upload New Document
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Document Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Document Name *
            </label>
            <Input
              value={formData.documentName}
              onChange={(e) => handleInputChange('documentName', e.target.value)}
              placeholder="Enter document name..."
              className={errors.documentName ? 'border-red-500' : ''}
            />
            {errors.documentName && (
              <p className="text-red-500 text-xs mt-1">{errors.documentName}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the document..."
              rows="3"
              className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          {/* Document Type and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Document Type *
              </label>
              <select
                value={formData.typeId}
                onChange={(e) => handleInputChange('typeId', e.target.value)}
                disabled={dropdownLoading}
                className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.typeId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {dropdownLoading ? 'Loading types...' : 'Select document type'}
                </option>
                {types.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.typeName}
                  </option>
                ))}
              </select>
              {errors.typeId && (
                <p className="text-red-500 text-xs mt-1">{errors.typeId}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                disabled={dropdownLoading}
                className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.categoryId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {dropdownLoading ? 'Loading categories...' : 'Select category'}
                </option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Upload File *
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.xlsx,.pptx,.jpg,.jpeg,.png"
              className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.file ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formData.file && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            {errors.file && (
              <p className="text-red-500 text-xs mt-1">{errors.file}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: PDF, DOC, DOCX, TXT, XLSX, PPTX, JPG, JPEG, PNG (Max: 10MB)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || dropdownLoading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
