import { api } from './api';

// Document Categories API - Simplified for Config UI
export const DocumentCategoriesAPI = {
  // Get all categories
  getAll: () => api.get('/document/categories'),
  
  // Get active categories only
  getActive: () => api.get('/document/categories/active'),
  
  // Create new category
  create: (categoryData) => api.post('/document/categories', categoryData),
  
  // Update category
  update: (id, categoryData) => api.put(`/document/categories/${id}`, categoryData),
  
  // Delete category (soft delete)
  delete: (id) => api.delete(`/document/categories/${id}`),
};

// Document Types API - Simplified for Config UI
export const DocumentTypesAPI = {
  // Get all types
  getAll: () => api.get('/document/types'),
  
  // Get active types only
  getActive: () => api.get('/document/types/active'),
  
  // Create new type
  create: (typeData) => api.post('/document/types', typeData),
  
  // Update type
  update: (id, typeData) => api.put(`/document/types/${id}`, typeData),
  
  // Delete type (soft delete)
  delete: (id) => api.delete(`/document/types/${id}`),
};

// Documents API - Main document management
export const DocumentsAPI = {
  // Create new document with file upload
  create: (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Get all documents
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/documents${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get my documents
  getMyDocuments: () => api.get('/documents/my-documents'),
  
  // Get single document
  getById: (id) => api.get(`/documents/${id}`),
  
  // Update document
  update: (id, documentData) => api.put(`/documents/${id}`, documentData),
  
  // Delete document
  delete: (id) => api.delete(`/documents/${id}`),
  
  // Download document
  download: (id) => api.get(`/documents/${id}/download`, {
    responseType: 'blob'
  }),
  
  // Get statistics
  getStatistics: () => api.get('/documents/statistics'),
};

// Combined API
export const DocumentAPI = {
  categories: DocumentCategoriesAPI,
  types: DocumentTypesAPI,
  documents: DocumentsAPI,
};

export default DocumentAPI;
