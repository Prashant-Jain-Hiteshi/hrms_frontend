import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Plus, Save, Edit, Trash2, Settings, Calendar,
  AlertCircle, CheckCircle
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { LeaveAPI } from '../../lib/api';

const LeaveCreditConfig = () => {
  const { leaveTypes, fetchLeaveTypes } = useData();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    leaveType: '',
    monthlyCredit: 1.67
  });
  const [notifications, setNotifications] = useState([]);

  // Dynamic leave type options from admin-created leave types
  const leaveTypeOptions = leaveTypes.map(type => ({
    value: type.name, // Use original name as backend expects exact match
    label: type.name
  }));

  const notify = (type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  useEffect(() => {
    fetchConfigs();
    fetchLeaveTypes(); // Fetch admin-created leave types
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await LeaveAPI.getConfigs();
      setConfigs(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      notify('error', 'Failed to fetch leave credit configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingConfig) {
        // Update existing config via API
        await LeaveAPI.updateConfig(editingConfig.leaveType, {
          monthlyCredit: formData.monthlyCredit,
          isActive: true,
        });
        await fetchConfigs();
        notify('success', 'Leave credit configuration updated successfully');
      } else {
        // Create new config via API
        await LeaveAPI.createConfig({
          leaveType: formData.leaveType,
          monthlyCredit: formData.monthlyCredit,
          isActive: true,
        });
        await fetchConfigs();
        notify('success', 'Leave credit configuration created successfully');
      }

      resetForm();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to save configuration';
      notify('error', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setFormData({
      leaveType: config.leaveType,
      monthlyCredit: config.monthlyCredit
    });
    setShowAddForm(true);
  };

  const handleDelete = async (leaveType) => {
    if (!confirm(`Are you sure you want to delete the credit configuration for "${leaveType}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await LeaveAPI.deleteCreditConfig(leaveType);
      notify('success', res?.data?.message || 'Credit configuration deleted successfully');
      fetchConfigs(); // Refresh the list
    } catch (error) {
      notify('error', error.response?.data?.message || 'Failed to delete credit configuration');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ leaveType: '', monthlyCredit: 1.67 });
    setEditingConfig(null);
    setShowAddForm(false);
  };

  const triggerMonthlyCredits = async () => {
    if (!confirm('This will process monthly leave credits for all employees. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      await LeaveAPI.triggerMonthlyCredits();
      notify('success', 'Monthly credit processing triggered successfully');
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to trigger monthly credits';
      notify('error', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{notification.message}</span>
          </div>
        </div>
      ))}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Leave Credit Configuration</h2>
          <p className="text-gray-600 dark:text-gray-400">Configure monthly leave credits for employees</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={triggerMonthlyCredits}
            variant="outline"
            disabled={loading}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Trigger Monthly Credits
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Configuration
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingConfig ? 'Edit' : 'Add'} Leave Credit Configuration</CardTitle>
            <CardDescription>
              Configure how many leaves are credited monthly for each leave type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Leave Type
                  </label>
                  <select
                    value={formData.leaveType}
                    onChange={(e) => setFormData(prev => ({ ...prev, leaveType: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={editingConfig}
                    required
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypeOptions.length === 0 ? (
                      <option value="" disabled>No leave types available - Create leave types first</option>
                    ) : (
                      leaveTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))
                    )}
                  </select>
                  {leaveTypeOptions.length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      No leave types found. Please create leave types first in the "Leave Types" tab.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Credit (Days)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formData.monthlyCredit}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyCredit: parseFloat(e.target.value) }))}
                    placeholder="e.g., 1.67"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: 1.67 days/month = 20 days/year
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingConfig ? 'Update' : 'Create'} Configuration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Configurations List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configurations</CardTitle>
          <CardDescription>
            Monthly leave credit settings for all employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No leave credit configurations found. Add one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Leave Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Monthly Credit</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Annual Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((config) => (
                    <tr key={config.leaveType} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {leaveTypeOptions.find(opt => opt.value === config.leaveType)?.label || config.leaveType}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {config.monthlyCredit} days
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {(config.monthlyCredit * 12).toFixed(1)} days
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          config.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {config.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(config)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(config.leaveType)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>• <strong>Monthly Credits:</strong> Leaves are automatically credited to all employees on the 1st of every month</p>
            <p>• <strong>Joining Date:</strong> Credits start from the month after employee joining date</p>
            <p>• <strong>No Limits:</strong> Employees can accumulate unlimited earned leaves</p>
            <p>• <strong>Same for All:</strong> All employees receive the same monthly credit amount</p>
            <p>• <strong>Example:</strong> 1.67 days/month = 20 days/year for Annual Leave</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveCreditConfig;
