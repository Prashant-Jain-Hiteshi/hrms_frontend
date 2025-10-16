import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { 
  Users, Search, Filter, Plus, Edit, Trash2, 
  Mail, Phone, MapPin, Calendar, AlertTriangle, Loader2, User
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { MOCK_DEPARTMENTS } from '../../data/mockData';
import EmployeeModal from './EmployeeModal';
import { useAuth } from '../../contexts/AuthContext';
import { EmployeesAPI } from '../../lib/api';

const EmployeeList = () => {
  const { addEmployee, updateEmployee, deleteEmployee } = useData();
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  
  // Enhanced role-based access control - only HR and Admin can manage employees
  const canManage = user?.role === 'admin' || user?.role === 'hr' || hasPermission('manage_employees');
  
  // Pagination and filtering state
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalRecords: 0,
    limit: 10,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState({
    departments: [],
    statuses: [],
  });
  const [loading, setLoading] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('joiningDate');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Fetch employees with pagination and filters
  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        department: selectedDepartment,
        status: selectedStatus,
        sortBy,
        sortOrder,
      };

      const response = await EmployeesAPI.listPaginated(params);
      const data = response.data;

      if (data.employees) {
        setEmployees(data.employees);
        setPagination(data.pagination);
        setFilters(data.filters);
      } else {
        // Fallback for old API response format
        setEmployees(Array.isArray(data) ? data : data.rows || []);
        setPagination({
          currentPage: page,
          totalPages: 1,
          totalRecords: Array.isArray(data) ? data.length : data.count || 0,
          limit: 10,
          hasNext: false,
          hasPrev: false,
        });
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees. Please refresh the page.",
        variant: "destructive"
      });
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Load employees when component mounts or filters change
  useEffect(() => {
    fetchEmployees(1);
  }, [searchTerm, selectedDepartment, selectedStatus, sortBy, sortOrder]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.currentPage !== 1) {
        fetchEmployees(1); // Reset to first page when searching
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // No need for frontend filtering - handled by backend
  const filteredEmployees = employees;

  const handleAddEmployee = async (employeeData) => {
    if (!canManage) {
      toast.error('Permission denied: Only HR and Admin can add employees.');
      return;
    }
    
    setIsAdding(true);
    try {
      const created = await addEmployee(employeeData);
      setShowAddModal(false);
      
      // Refresh employee list to ensure consistency
      await fetchEmployees(pagination.currentPage);
      
      // Show success toast
      toast.success(`Employee "${employeeData.name}" has been added successfully!`, 5000);
      
      // If backend provided a temporary password, show it in a special toast
      if (created && created.temporaryPassword) {
        const email = employeeData.email || created.email;
        // toast.info(`Temporary login credentials created:\nEmail: ${email}\nPassword: ${created.temporaryPassword}\n\nPlease share these credentials securely with the employee.`, 10000);
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add employee. Please try again.';
      toast.error(`Failed to add employee: ${errorMessage}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditEmployee = async (employeeData) => {
    if (!canManage) {
      toast.error('Permission denied: Only HR and Admin can edit employees.');
      return;
    }
    
    setIsUpdating(true);
    try {
      await EmployeesAPI.update(selectedEmployee.id, employeeData);
      
      // Update local state through context
      await updateEmployee(selectedEmployee.id, employeeData);
      
      setShowEditModal(false);
      setSelectedEmployee(null);
      
      // Refresh employee list to ensure consistency
      await fetchEmployees(pagination.currentPage);
      
      // Show success toast
      toast.success(`Employee "${employeeData.name}" has been updated successfully!`, 5000);
    } catch (error) {
      console.error('Error updating employee:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update employee. Please try again.';
      toast.error(`Failed to update employee: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const openDeleteModal = (employee) => {
    if (!canManage) {
      toast.error('Permission denied: Only HR and Admin can delete employees.');
      return;
    }
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
    setDeleteError('');
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete || !canManage) return;
    
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      // Update local state through context
      await deleteEmployee(employeeToDelete.id);
      
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      
      // Refresh employee list to ensure consistency
      await fetchEmployees(pagination.currentPage);
      
      console.log('Employee deleted successfully!');
      toast.success(`Employee "${employeeToDelete.name}" has been deleted successfully!`, 5000);
    } catch (error) {
      console.error('Error deleting employee:', error);
      setDeleteError('Failed to delete employee. This employee may have associated records that prevent deletion.');
    } finally {
      setIsDeleting(false);
    }
  };
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setEmployeeToDelete(null);
    setDeleteError('');
  };

  const openEditModal = (employee) => {
    if (!canManage) {
      console.warn('Permission denied: Only HR and Admin can edit employees.');
      return;
    }
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employee Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your workforce</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Employee</span>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-background text-foreground"
            >
              <option value="">All Departments</option>
              {filters.departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-background text-foreground"
            >
              <option value="">All Status</option>
              {filters.statuses.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
            {/* <Button variant="outline" className="flex items-center space-x-2" onClick={() => console.log('Filter functionality coming soon!')}>
              <Filter className="h-4 w-4" />
              <span>More Filters</span>
            </Button> */}
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{pagination.totalRecords}</div>
              <div className="text-sm text-muted-foreground">Total Employees</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {employees.filter(e => e.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
          </CardContent>
        </Card>
        {/* <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{MOCK_DEPARTMENTS.length}</div>
              <div className="text-sm text-muted-foreground">Departments</div>
            </div>
          </CardContent>
        </Card> */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {employees.filter(e => {
                  const joinDate = new Date(e.joiningDate);
                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();
                  return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">New This Month</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Employee</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">ID</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Department</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Contact</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Join Date</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{employee.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{employee.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400 font-mono">{employee.employeeId}</td>
                    <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{employee.department}</td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center mb-1">
                          <Mail className="h-3 w-3 mr-2 text-gray-400" />
                          {employee.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-2 text-gray-400" />
                          {employee.phone}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{employee.joiningDate}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        employee.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {employee.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        {canManage && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => openEditModal(employee)}
                              disabled={isUpdating}
                              className="flex items-center space-x-1"
                            >
                              {isUpdating && selectedEmployee?.id === employee.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Edit className="h-3 w-3" />
                              )}
                              <span>Edit</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => openDeleteModal(employee)}
                              disabled={isDeleting}
                              className="flex items-center justify-center"
                              title="Delete Employee"
                            >
                              {isDeleting && employeeToDelete?.id === employee.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </>
                        )}
                        {!canManage && (
                          <span className="text-sm text-gray-500 italic">
                            View Only
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} of{' '}
                {pagination.totalRecords} employees
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchEmployees(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev || loading}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => fetchEmployees(pageNum)}
                        disabled={loading}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchEmployees(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading employees...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Employee Modal */}
      <EmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddEmployee}
        title="Add New Employee"
        isLoading={isAdding}
      />

      {/* Edit Employee Modal */}
      <EmployeeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEmployee(null);
        }}
        onSubmit={handleEditEmployee}
        title="Edit Employee"
        employee={selectedEmployee}
        isLoading={isUpdating}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold flex items-center text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Confirm Delete Employee
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete the following employee? This action cannot be undone.
                  </p>
                  
                  {employeeToDelete && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {employeeToDelete.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {employeeToDelete.email}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {employeeToDelete.department} • {employeeToDelete.designation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {deleteError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                        <p className="text-sm text-red-700 dark:text-red-300">{deleteError}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5" />
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        <p className="font-medium">Warning:</p>
                        <p>Deleting this employee will also remove:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>All attendance records</li>
                          <li>Leave requests and history</li>
                          <li>Performance evaluations</li>
                          <li>Associated user account</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelDelete}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteEmployee}
                    disabled={isDeleting}
                    className="flex items-center space-x-2"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Employee</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
