import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Save,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Building,
  Clock,
  Users
} from 'lucide-react';

const SettingsManagement = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Mock data
  const companySettings = {
    companyName: 'Hiteshi Infotech',
    industry: 'Technology',
    address: '123 Business Street, Tech City, TC 12345',
    phone: '+1 (555) 123-4567',
    email: 'info@hiteshi.com',
    website: 'https://www.hiteshi.com',
    timezone: 'UTC-05:00'
  };

  const systemUsers = [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@hiteshi.com',
      role: 'Super Admin',
      status: 'active',
      lastLogin: '2024-01-22 10:30 AM'
    },
    {
      id: 2,
      name: 'HR Manager',
      email: 'hr@hiteshi.com',
      role: 'HR Admin',
      status: 'active',
      lastLogin: '2024-01-22 09:15 AM'
    },
    {
      id: 3,
      name: 'Finance Manager',
      email: 'finance@hiteshi.com',
      role: 'Finance Admin',
      status: 'active',
      lastLogin: '2024-01-21 04:45 PM'
    }
  ];

  const handleSaveSettings = (section) => {
    console.log('Saving settings for:', section);
  };

  const handleAddUser = (userData) => {
    console.log('Adding user:', userData);
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const handleEditUser = (userData) => {
    console.log('Editing user:', userData);
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = (userId) => {
    console.log('Deleting user:', userId);
  };

  const UserModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectedUser ? 'Edit User' : 'Add New User'}
          </h3>
          <Button variant="ghost" onClick={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}>×</Button>
        </div>
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          selectedUser ? handleEditUser({}) : handleAddUser({});
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Full Name</label>
              <Input 
                placeholder="Enter full name" 
                defaultValue={selectedUser?.name}
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
              <Input 
                type="email"
                placeholder="user@company.com" 
                defaultValue={selectedUser?.email}
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Role</label>
              <select className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white" required>
                <option value="">Select Role</option>
                <option value="super-admin">Super Admin</option>
                <option value="hr-admin">HR Admin</option>
                <option value="finance-admin">Finance Admin</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Status</label>
              <select className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white" required>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          {!selectedUser && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  required 
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setShowUserModal(false);
              setSelectedUser(null);
            }}>Cancel</Button>
            <Button type="submit">
              {selectedUser ? 'Update User' : 'Add User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure system preferences and manage users</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'backup', label: 'Backup & Data', icon: Database }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Company Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Company Name</label>
                  <Input defaultValue={companySettings.companyName} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Industry</label>
                  <Input defaultValue={companySettings.industry} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Address</label>
                  <Input defaultValue={companySettings.address} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Phone</label>
                  <Input defaultValue={companySettings.phone} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
                  <Input type="email" defaultValue={companySettings.email} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Website</label>
                  <Input defaultValue={companySettings.website} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Timezone</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <option value="UTC-05:00">UTC-05:00 (Eastern)</option>
                    <option value="UTC-06:00">UTC-06:00 (Central)</option>
                    <option value="UTC-07:00">UTC-07:00 (Mountain)</option>
                    <option value="UTC-08:00">UTC-08:00 (Pacific)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => handleSaveSettings('general')} className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Email Notifications', 'Push Notifications', 'SMS Notifications', 'Leave Requests', 'Attendance Alerts', 'Payroll Reminders'].map((setting) => (
                  <div key={setting} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{setting}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Configure {setting.toLowerCase()}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => handleSaveSettings('notifications')} className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Password Expiry (days)</label>
                  <Input type="number" defaultValue="90" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Session Timeout (minutes)</label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Max Login Attempts</label>
                  <Input type="number" defaultValue="5" />
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {['Two-Factor Authentication', 'IP Restriction', 'Audit Logs'].map((setting) => (
                  <div key={setting} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{setting}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Enable {setting.toLowerCase()}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => handleSaveSettings('security')} className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Users</h2>
            <Button onClick={() => setShowUserModal(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add User</span>
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">User</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Role</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Last Login</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{user.role}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {user.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{user.lastLogin}</td>
                        <td className="py-4 px-6">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>View</span>
                            </Button>
                            <Button size="sm" variant="secondary">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                            <Button size="sm" variant="outline" className="flex items-center space-x-1" onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}>
                              <Edit className="h-3 w-3" />
                              <span>Edit</span>
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backup & Data Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>System Backups</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Backup Management</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Configure automatic backups and manage data retention</p>
                <Button size="sm" variant="outline" className="flex items-center space-x-1">
                  <Bell className="h-3 w-3" />
                  <span>Configure</span>
                </Button>
                <Button size="sm" variant="secondary">
                  <Settings className="h-3 w-3 mr-1" />
                  Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      {showUserModal && <UserModal />}
    </div>
  );
};

export default SettingsManagement;
