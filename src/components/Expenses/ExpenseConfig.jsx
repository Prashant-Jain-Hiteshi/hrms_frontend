import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Save, 
  X, 
  Loader2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { ExpenseAPI } from '../../lib/api';

const ExpenseConfig = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Form state
  const [categoryForm, setCategoryForm] = useState({
    categoryName: '',
    description: '',
    isActive: true,
    autoApprovalPercent: 0
  });
  
  // Form errors
  const [formErrors, setFormErrors] = useState({});

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await ExpenseAPI.categories.list();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(error.response?.data?.message || 'Failed to load expense categories');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCategoryForm({
      categoryName: '',
      description: '',
      isActive: true,
      autoApprovalPercent: 0
    });
    setFormErrors({});
    setEditingCategory(null);
  };

  const handleFormChange = (field, value) => {
    setCategoryForm(prev => ({
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

  const validateForm = () => {
    const errors = {};
    
    if (!categoryForm.categoryName.trim()) {
      errors.categoryName = 'Category name is required';
    }
    
    if (categoryForm.autoApprovalPercent < 0 || categoryForm.autoApprovalPercent > 100) {
      errors.autoApprovalPercent = 'Auto approval percent must be between 0 and 100';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      if (editingCategory) {
        // Update existing category
        await ExpenseAPI.categories.update(editingCategory.id, categoryForm);
        toast.success('Category updated successfully');
      } else {
        // Create new category
        await ExpenseAPI.categories.create(categoryForm);
        toast.success('Category created successfully');
      }
      
      // Reset form and reload data
      resetForm();
      setShowForm(false);
      loadCategories();
      
    } catch (error) {
      console.error('Error saving category:', error);
      
      // Handle validation errors
      if (error.response?.status === 400) {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes('Category name already exists')) {
          setFormErrors({ categoryName: 'Category name already exists' });
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error(error.response?.data?.message || 'Failed to save category');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      categoryName: category.categoryName,
      description: category.description || '',
      isActive: category.isActive,
      autoApprovalPercent: category.autoApprovalPercent || 0
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      setLoading(true);
      await ExpenseAPI.categories.delete(categoryId);
      toast.success('Category deleted successfully');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      setLoading(true);
      await ExpenseAPI.categories.update(category.id, {
        ...category,
        isActive: !category.isActive
      });
      toast.success(`Category ${!category.isActive ? 'activated' : 'deactivated'} successfully`);
      loadCategories();
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast.error(error.response?.data?.message || 'Failed to update category status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Expense Configuration
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage expense categories and approval settings
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && categories.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading categories...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No expense categories found. Create your first category to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Category Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Code
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Auto Approval %
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {category.categoryName}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                          {category.categoryCode}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {category.description || '-'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          {category.autoApprovalPercent}%
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleActive(category)}
                          className="flex items-center gap-1"
                          disabled={loading}
                        >
                          {category.isActive ? (
                            <>
                              <ToggleRight className="h-5 w-5 text-green-500" />
                              <span className="text-green-600 dark:text-green-400">Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-5 w-5 text-gray-400" />
                              <span className="text-gray-500">Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(category)}
                            disabled={loading}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(category.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Category Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category Name *
                </label>
                <Input
                  placeholder="Enter category name"
                  value={categoryForm.categoryName}
                  onChange={(e) => handleFormChange('categoryName', e.target.value)}
                  className={formErrors.categoryName ? 'border-red-500' : ''}
                />
                {formErrors.categoryName && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.categoryName}</p>
                )}
              </div>

              {/* Status Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Status
                </label>
                <select
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  value={categoryForm.isActive ? 'active' : 'inactive'}
                  onChange={(e) => handleFormChange('isActive', e.target.value === 'active')}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 resize-none"
                  rows="3"
                  placeholder="Enter category description"
                  value={categoryForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                />
              </div>

              {/* Auto Approval Percent */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Auto Approval Percent (0-100%) *
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={categoryForm.autoApprovalPercent}
                  onChange={(e) => handleFormChange('autoApprovalPercent', parseInt(e.target.value) || 0)}
                  className={formErrors.autoApprovalPercent ? 'border-red-500' : ''}
                />
                {formErrors.autoApprovalPercent && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.autoApprovalPercent}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseConfig;
