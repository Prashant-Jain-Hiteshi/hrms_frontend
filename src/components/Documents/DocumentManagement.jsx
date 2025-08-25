import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Edit,
  Trash2,
  Share2,
  Lock,
  Unlock,
  AlertTriangle,
  Eye,
  Calendar,
  User,
  XCircle,
  Plus,
  CheckCircle,
  Clock,
  Building
} from 'lucide-react';
import { Input } from '../ui/Input';

const DocumentManagement = () => {
  const { user } = useAuth();
  const { 
    documents, 
    addDocument, 
    updateDocument, 
    deleteDocument, 
    getFilteredData,
    canUserPerformAction
  } = useData();
  const [selectedTab, setSelectedTab] = useState('documents');
  const [activeTab, setActiveTab] = useState('documents');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    name: '',
    type: 'Policy',
    category: 'HR',
    description: '',
    file: null
  });
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Get filtered documents based on user role
  const userDocuments = getFilteredData('documents', user?.role, user?.id) || documents;

  const handleDocumentFormChange = (field, value) => {
    setDocumentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentSubmit = () => {
    if (!documentForm.name || !documentForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    const newDocument = {
      ...documentForm,
      size: documentForm.file ? `${(documentForm.file.size / 1024 / 1024).toFixed(1)} MB` : '0 MB',
      uploadedBy: user?.name || 'Current User',
      access: 'public'
    };

    addDocument(newDocument);
    setDocumentForm({
      name: '',
      type: 'Policy',
      category: 'HR',
      description: '',
      file: null
    });
    setShowDocumentForm(false);
  };

  const handleEditDocument = (document) => {
    setSelectedDocument(document);
    setDocumentForm({
      name: document.name,
      type: document.type,
      category: document.category,
      description: document.description,
      file: null
    });
    setShowEditModal(true);
  };

  const handleUpdateDocument = () => {
    if (!documentForm.name || !documentForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    updateDocument(selectedDocument.id, {
      name: documentForm.name,
      type: documentForm.type,
      category: documentForm.category,
      description: documentForm.description
    });
    
    setShowEditModal(false);
    setSelectedDocument(null);
    setDocumentForm({
      name: '',
      type: 'Policy',
      category: 'HR',
      description: '',
      file: null
    });
  };

  const handleDeleteDocument = (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteDocument(documentId);
    }
  };

  const handleDownloadDocument = (documentId) => {
    // Simulate download - increment download count
    const document = userDocuments.find(doc => doc.id === documentId);
    if (document) {
      updateDocument(documentId, { downloads: (document.downloads || 0) + 1 });
      
      // Create a downloadable file (simulate document content)
      const content = `Document: ${document.name}\nType: ${document.type}\nSize: ${document.size}\nUploaded: ${document.uploadDate}\nDescription: ${document.description || 'No description available'}\n\nThis is a simulated document download.`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${document.name}.txt`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert(`Document "${document.name}" downloaded successfully!`);
    }
  };

  const handleStatusUpdate = (documentId, newStatus) => {
    updateDocument(documentId, { status: newStatus });
  };

  const handleShareDocument = (documentId) => {
    // Simulate sharing functionality
    alert('Share link copied to clipboard!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'draft':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'archived':
        return 'bg-gray-100 dark:bg-gray-900/30';
      default:
        return 'bg-red-100 dark:bg-red-900/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Document Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Organize and manage company documents and files</p>
        </div>
        {canUserPerformAction('upload_document', user?.role) && (
          <Button 
            variant="default" 
            className="flex items-center space-x-2"
            onClick={() => setShowDocumentForm(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">186</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Documents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">162</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-3">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">18</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Draft</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-3">
                <Download className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">1,247</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Downloads</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'categories', label: 'Categories', icon: Building },
            { id: 'activity', label: 'Recent Activity', icon: Clock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
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

      {/* Documents Tab */}
      {selectedTab === 'documents' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  <option value="">All Categories</option>
                  <option value="hr-policies">HR Policies</option>
                  <option value="employee-docs">Employee Documents</option>
                  <option value="performance">Performance</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  <option value="">All Types</option>
                  <option value="policy">Policy</option>
                  <option value="template">Template</option>
                  <option value="certificate">Certificate</option>
                  <option value="personal">Personal</option>
                </select>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>More Filters</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Document</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Type</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Category</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Size</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Modified</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userDocuments.map(document => (
                      <tr key={document.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{document.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{document.description}</div>
                              <div className="flex items-center mt-1 space-x-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{document.format || 'PDF'}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">v{document.version}</span>
                                {document.access === 'private' && <Lock className="h-3 w-3 text-gray-400" />}
                                {document.access === 'restricted' && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                                {document.access === 'public' && <Unlock className="h-3 w-3 text-green-500" />}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{document.type}</td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{document.category}</td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{document.size}</td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-600 dark:text-gray-400">{document.lastModified}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">by {document.uploadedBy}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            document.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {document.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedDocument(document);
                                setShowViewModal(true);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadDocument(document.id)}
                              title="Download"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditDocument(document)}
                              title="Edit"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteDocument(document.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleShareDocument(document.id)}
                              title="Share"
                            >
                              <Share2 className="h-3 w-3" />
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

      {/* Categories Tab */}
      {selectedTab === 'categories' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: 1, name: 'HR Policies', count: 45, description: 'Company policies and procedures' },
              { id: 2, name: 'Employee Documents', count: 78, description: 'Personal employee files and records' },
              { id: 3, name: 'Performance', count: 32, description: 'Performance reviews and evaluations' },
              { id: 4, name: 'Training Materials', count: 24, description: 'Training documents and resources' },
              { id: 5, name: 'Compliance', count: 18, description: 'Legal and compliance documents' },
              { id: 6, name: 'Templates', count: 15, description: 'Document templates and forms' }
            ].map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                      <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{category.count}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Tab */}
      {selectedTab === 'activity' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Document Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 1, user: 'Admin User', action: 'uploaded', document: 'Employee Handbook 2024', timestamp: '2 hours ago' },
                  { id: 2, user: 'HR Manager', action: 'updated', document: 'Leave Policy', timestamp: '4 hours ago' },
                  { id: 3, user: 'John Doe', action: 'downloaded', document: 'Performance Review Template', timestamp: '6 hours ago' },
                  { id: 4, user: 'Sarah Wilson', action: 'shared', document: 'Training Manual', timestamp: '1 day ago' },
                  { id: 5, user: 'Mike Johnson', action: 'deleted', document: 'Old Policy Document', timestamp: '2 days ago' }
                ].map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{activity.user}</span>
                        <span className="mx-2">{activity.action}</span>
                        <span className="font-medium">{activity.document}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{activity.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Document Modal */}
      {showDocumentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Upload New Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Document Name</label>
                <Input 
                  placeholder="Enter document name..." 
                  value={documentForm.name}
                  onChange={(e) => handleDocumentFormChange('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows="3"
                  placeholder="Describe the document..."
                  value={documentForm.description}
                  onChange={(e) => handleDocumentFormChange('description', e.target.value)}
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Document Type</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={documentForm.type}
                    onChange={(e) => handleDocumentFormChange('type', e.target.value)}
                  >
                    <option value="Policy">Policy</option>
                    <option value="Template">Template</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Personal">Personal</option>
                    <option value="Training">Training</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={documentForm.category}
                    onChange={(e) => handleDocumentFormChange('category', e.target.value)}
                  >
                    <option value="HR">HR Policies</option>
                    <option value="Employee">Employee Documents</option>
                    <option value="Performance">Performance</option>
                    <option value="Training">Training Materials</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Templates">Templates</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Upload File</label>
                <input
                  type="file"
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  onChange={(e) => handleDocumentFormChange('file', e.target.files[0])}
                  accept=".pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx"
                />
                <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, DOC, DOCX, TXT, XLSX, PPT, PPTX</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowDocumentForm(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleDocumentSubmit}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {showEditModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Edit Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Document Name</label>
                <Input 
                  placeholder="Enter document name..." 
                  value={documentForm.name}
                  onChange={(e) => handleDocumentFormChange('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows="3"
                  placeholder="Describe the document..."
                  value={documentForm.description}
                  onChange={(e) => handleDocumentFormChange('description', e.target.value)}
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Document Type</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={documentForm.type}
                    onChange={(e) => handleDocumentFormChange('type', e.target.value)}
                  >
                    <option value="Policy">Policy</option>
                    <option value="Template">Template</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Personal">Personal</option>
                    <option value="Training">Training</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={documentForm.category}
                    onChange={(e) => handleDocumentFormChange('category', e.target.value)}
                  >
                    <option value="HR">HR Policies</option>
                    <option value="Employee">Employee Documents</option>
                    <option value="Performance">Performance</option>
                    <option value="Training">Training Materials</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Templates">Templates</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleUpdateDocument}>
                <Edit className="h-4 w-4 mr-2" />
                Update Document
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {showViewModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedDocument.name}</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowViewModal(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Document Type</label>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedDocument.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</label>
                  <p className="text-gray-900 dark:text-white">{selectedDocument.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Size</label>
                  <p className="text-gray-900 dark:text-white">{selectedDocument.size}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Version</label>
                  <p className="text-gray-900 dark:text-white">v{selectedDocument.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Uploaded By</label>
                  <p className="text-gray-900 dark:text-white">{selectedDocument.uploadedBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedDocument.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {selectedDocument.status?.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-900 dark:text-white">{selectedDocument.description || 'No description provided.'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Modified</label>
                  <p className="text-gray-900 dark:text-white">{selectedDocument.lastModified}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Access Level</label>
                  <div className="flex items-center space-x-2">
                    {selectedDocument.access === 'private' && <Lock className="h-4 w-4 text-gray-400" />}
                    {selectedDocument.access === 'restricted' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    {selectedDocument.access === 'public' && <Unlock className="h-4 w-4 text-green-500" />}
                    <span className="text-gray-900 dark:text-white capitalize">{selectedDocument.access}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button 
                variant="default"
                onClick={() => {
                  setShowViewModal(false);
                  handleEditDocument(selectedDocument);
                }}
              >
                Edit Document
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagement;
