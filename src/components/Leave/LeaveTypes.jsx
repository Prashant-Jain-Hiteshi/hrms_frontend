import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Plus, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight,
  Home, ChevronRight as BreadcrumbArrow
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const LeaveTypes = () => {
  const { leaveTypes, addLeaveType, updateLeaveType, deleteLeaveType, searchLeaveTypes } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    numberOfLeaves: '',
    description: '',
    requiresApproval: true,
    carryForward: false,
    encashment: false,
    eligibility: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter and paginate data
  const filteredLeaveTypes = leaveTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLeaveTypes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeaveTypes = filteredLeaveTypes.slice(startIndex, startIndex + itemsPerPage);

  const handleAdd = () => {
    setFormData({
      name: '',
      numberOfLeaves: '',
      description: '',
      requiresApproval: true,
      carryForward: false,
      encashment: false,
      eligibility: 'all'
    });
    setShowAddModal(true);
  };

  const handleEdit = (leaveType) => {
    setSelectedLeaveType(leaveType);
    setFormData({
      name: leaveType.name,
      numberOfLeaves: leaveType.numberOfLeaves.toString(),
      description: leaveType.description || '',
      requiresApproval: leaveType.requiresApproval !== false,
      carryForward: leaveType.carryForward || false,
      encashment: leaveType.encashment || false,
      eligibility: leaveType.eligibility || 'all'
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this leave type?')) {
      setLoading(true);
      try {
        await deleteLeaveType(id);
      } catch (error) {
        setError(error.response?.data?.message || error.message || 'Failed to delete leave type');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const leaveTypeData = {
        name: formData.name,
        numberOfLeaves: parseInt(formData.numberOfLeaves) || 0,
        description: formData.description,
        requiresApproval: formData.requiresApproval,
        carryForward: formData.carryForward,
        encashment: formData.encashment,
        eligibility: formData.eligibility
      };

      if (showEditModal && selectedLeaveType) {
        // Update existing leave type
        await updateLeaveType(selectedLeaveType.id, leaveTypeData);
        setShowEditModal(false);
      } else {
        // Add new leave type
        await addLeaveType(leaveTypeData);
        setShowAddModal(false);
      }
      
      setSelectedLeaveType(null);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedLeaveType(null);
    setError('');
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">LeaveType</h1>
        </div>
        <Button 
          onClick={handleAdd}
          className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Leave Type</span>
        </Button>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="bg-blue-500 text-white">
          <CardTitle className="flex items-center space-x-2">
            <span>📋 LeaveTypes List</span>
          </CardTitle>
          <CardDescription className="text-blue-100">
            Number of leaves of Half day are not added to total leaves on Employee Dashboard Page
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center space-x-2 relative">
              <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Show</label>
              <div className="relative">
                <select 
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 pr-8 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none cursor-pointer min-w-[70px]"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">records</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Search:</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search leave types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="w-full">
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">#</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Leave</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Number of Leaves</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900">
                  {paginatedLeaveTypes.map((leaveType, index) => (
                    <tr key={leaveType.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {startIndex + index + 1}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {leaveType.name}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {leaveType.numberOfLeaves}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(leaveType)}
                            className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600 flex items-center space-x-1"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View/Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(leaveType.id)}
                            className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLeaveTypes.length)} of {filteredLeaveTypes.length} entries
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-blue-600 text-white" : ""}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">Last</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              {showEditModal ? 'Edit Leave Type' : 'Add New Leave Type'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Leave Type Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Casual Leave"
                    required
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Number of Leaves per Year *
                  </label>
                  <Input
                    type="number"
                    value={formData.numberOfLeaves}
                    onChange={(e) => setFormData({...formData, numberOfLeaves: e.target.value})}
                    placeholder="e.g., 12"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of this leave type"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Eligibility
                  </label>
                  <select
                    value={formData.eligibility}
                    onChange={(e) => setFormData({...formData, eligibility: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Employees</option>
                    <option value="permanent">Permanent Only</option>
                    <option value="contract">Contract Only</option>
                    <option value="senior">Senior Level</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresApproval"
                    checked={formData.requiresApproval}
                    onChange={(e) => setFormData({...formData, requiresApproval: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="requiresApproval" className="text-sm text-gray-700 dark:text-gray-300">
                    Requires Approval
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="carryForward"
                    checked={formData.carryForward}
                    onChange={(e) => setFormData({...formData, carryForward: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="carryForward" className="text-sm text-gray-700 dark:text-gray-300">
                    Carry Forward Allowed
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="encashment"
                    checked={formData.encashment}
                    onChange={(e) => setFormData({...formData, encashment: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="encashment" className="text-sm text-gray-700 dark:text-gray-300">
                    Encashment Allowed
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                  {loading ? 'Processing...' : (showEditModal ? 'Update' : 'Create')} Leave Type
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveTypes;
