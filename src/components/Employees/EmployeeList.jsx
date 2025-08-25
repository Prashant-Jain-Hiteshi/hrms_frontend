import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Users, Search, Filter, Plus, Edit, Trash2, 
  Mail, Phone, MapPin, Calendar
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { MOCK_DEPARTMENTS } from '../../data/mockData';
import EmployeeModal from './EmployeeModal';
import { useAuth } from '../../contexts/AuthContext';

const EmployeeList = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useData();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage_employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || employee.status === selectedStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleAddEmployee = async (employeeData) => {
    if (!canManage) return;
    const created = await addEmployee(employeeData);
    setShowAddModal(false);
    // If backend provided a temporary password, surface it to the admin
    if (created && created.temporaryPassword) {
      const email = employeeData.email || created.email;
      alert(`User created. Temporary credentials:\nEmail: ${email}\nPassword: ${created.temporaryPassword}`);
    }
  };

  const handleEditEmployee = (employeeData) => {
    if (!canManage) return;
    updateEmployee(selectedEmployee.id, employeeData);
    setShowEditModal(false);
    setSelectedEmployee(null);
  };

  const handleDeleteEmployee = (employeeId) => {
    if (!canManage) return;
    if (window.confirm('Are you sure you want to delete this employee?')) {
      deleteEmployee(employeeId);
    }
  };

  const openEditModal = (employee) => {
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
              <option value="all">All Departments</option>
              {MOCK_DEPARTMENTS.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-background text-foreground"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button variant="outline" className="flex items-center space-x-2" onClick={() => alert('Filter functionality coming soon!')}>
              <Filter className="h-4 w-4" />
              <span>More Filters</span>
            </Button>
          </div>
        </CardContent>
      </Card>

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
                              className="flex items-center space-x-1"
                            >
                              <Edit className="h-3 w-3" />
                              <span>Edit</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="flex items-center justify-center"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
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

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{employees.length}</div>
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{MOCK_DEPARTMENTS.length}</div>
              <div className="text-sm text-muted-foreground">Departments</div>
            </div>
          </CardContent>
        </Card>
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

      {/* Add Employee Modal */}
      <EmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddEmployee}
        title="Add New Employee"
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
      />
    </div>
  );
};

export default EmployeeList;
