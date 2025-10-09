import { api } from './api';

// Performance Goals API
export const PerformanceAPI = {
  goals: {
    // Create a new performance goal
    create: async (goalData) => {
      try {
        console.log('🎯 Creating performance goal:', goalData);
        const response = await api.post('/performance/goals', goalData);
        console.log('✅ Performance goal created:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error creating performance goal:', error);
        throw error;
      }
    },

    // Get all performance goals (Admin/HR only)
    getAll: async (includeInactive = false) => {
      try {
        console.log('🔍 Fetching all performance goals...');
        const response = await api.get(`/performance/goals?includeInactive=${includeInactive}`);
        console.log('✅ Performance goals fetched:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching performance goals:', error);
        throw error;
      }
    },

    // Get specific performance goal by ID
    getById: async (goalId) => {
      try {
        console.log('🔍 Fetching performance goal by ID:', goalId);
        const response = await api.get(`/performance/goals/${goalId}`);
        console.log('✅ Performance goal fetched:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching performance goal:', error);
        throw error;
      }
    },

    // Update performance goal
    update: async (goalId, updateData) => {
      try {
        console.log('📝 Updating performance goal:', goalId, updateData);
        const response = await api.put(`/performance/goals/${goalId}`, updateData);
        console.log('✅ Performance goal updated:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error updating performance goal:', error);
        throw error;
      }
    },

    // Delete performance goal (soft delete)
    delete: async (goalId) => {
      try {
        console.log('🗑️ Deleting performance goal:', goalId);
        const response = await api.delete(`/performance/goals/${goalId}`);
        console.log('✅ Performance goal deleted:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error deleting performance goal:', error);
        throw error;
      }
    },

    // Get performance goal statistics
    getStatistics: async () => {
      try {
        console.log('📊 Fetching performance goal statistics...');
        const response = await api.get('/performance/goals/statistics');
        console.log('✅ Performance goal statistics fetched:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching performance goal statistics:', error);
        throw error;
      }
    },

    // Assign goal to employees with reviewers
    assign: async (goalId, assignmentData) => {
      try {
        console.log('🎯 Assigning goal to employees:', { goalId, assignmentData });
        const response = await api.post(`/performance/goals/${goalId}/assign`, assignmentData);
        console.log('✅ Goal assigned successfully:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error assigning goal:', error);
        throw error;
      }
    },

    // Update goal assignment (add/remove employees, change reviewers)
    updateAssignment: async (goalId, assignmentData) => {
      try {
        console.log('🔄 Updating goal assignment:', { goalId, assignmentData });
        const response = await api.put(`/performance/goals/${goalId}/assign`, assignmentData);
        console.log('✅ Goal assignment updated successfully:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error updating goal assignment:', error);
        throw error;
      }
    },

    // Get assignments for a goal
    getAssignments: async (goalId) => {
      try {
        console.log('📋 Fetching goal assignments:', { goalId });
        const response = await api.get(`/performance/goals/${goalId}/assignments`);
        console.log('✅ Goal assignments fetched:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching goal assignments:', error);
        throw error;
      }
    },

    // Get eligible employees for assignment
    getEligibleEmployees: async () => {
      try {
        console.log('👥 Fetching eligible employees...');
        const response = await api.get('/performance/goals/eligible-employees');
        console.log('✅ Eligible employees fetched:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching eligible employees:', error);
        throw error;
      }
    },
  },

  // Employee Feedback APIs
  feedback: {
    // Get assigned goals for feedback
    getGoals: async () => {
      try {
        console.log('🎯 Fetching feedback goals for employee');
        const response = await api.get('/performance/employee/feedback/goals');
        console.log('✅ Feedback goals fetched:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching feedback goals:', error);
        throw error;
      }
    },

    // Get existing feedback submission
    getSubmission: async (goalAssignmentId) => {
      try {
        console.log('📋 Fetching feedback submission:', { goalAssignmentId });
        const response = await api.get(`/performance/employee/feedback/${goalAssignmentId}`);
        console.log('✅ Feedback submission fetched:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching feedback submission:', error);
        throw error;
      }
    },

    // Save feedback draft
    saveDraft: async (goalAssignmentId, feedbackData) => {
      try {
        console.log('💾 Saving feedback draft:', { goalAssignmentId, feedbackData });
        const response = await api.post(`/performance/employee/feedback/${goalAssignmentId}/draft`, feedbackData);
        console.log('✅ Feedback draft saved:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error saving feedback draft:', error);
        throw error;
      }
    },

    // Submit feedback for review
    submit: async (goalAssignmentId, feedbackData) => {
      try {
        console.log('📤 Submitting feedback:', { goalAssignmentId, feedbackData });
        const response = await api.post(`/performance/employee/feedback/${goalAssignmentId}/submit`, feedbackData);
        console.log('✅ Feedback submitted:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error submitting feedback:', error);
        throw error;
      }
    }
  },

  // Reviewer APIs
  reviewer: {
    // Get pending reviews for the current reviewer
    getPendingReviews: async () => {
      try {
        console.log('📋 Fetching pending reviews...');
        const response = await api.get('/performance/employee/feedback/reviewer/pending-reviews');
        console.log('✅ Pending reviews fetched:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching pending reviews:', error);
        throw error;
      }
    },

    // Get submission details for review
    getSubmissionForReview: async (submissionId) => {
      try {
        console.log('📄 Fetching submission for review:', submissionId);
        const response = await api.get(`/performance/employee/feedback/reviewer/submission/${submissionId}`);
        console.log('✅ Submission details fetched:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching submission for review:', error);
        throw error;
      }
    },

    // Get submission details for review using frontend data (avoids database issues)
    getSubmissionForReviewWithData: async (submissionData) => {
      try {
        console.log('📄 Fetching submission for review with data:', submissionData.submissionId);
        const response = await api.post('/performance/employee/feedback/reviewer/submission/review-with-data', submissionData);
        console.log('✅ Submission details fetched with data:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching submission for review with data:', error);
        throw error;
      }
    },

    // Submit review
    submitReview: async (submissionId, reviewData) => {
      try {
        console.log('📝 Submitting review:', { submissionId, reviewData });
        const response = await api.post(`/performance/employee/feedback/reviewer/submission/${submissionId}/review`, reviewData);
        console.log('✅ Review submitted:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error submitting review:', error);
        throw error;
      }
    }
  },

  // Admin APIs
  admin: {
    // Get all feedback submissions (for admin/HR view)
    getAllFeedbackSubmissions: async () => {
      try {
        console.log('🔍 Getting all feedback submissions for admin...');
        const response = await api.get('/performance/employee/feedback/admin/all-submissions');
        console.log('✅ All feedback submissions retrieved:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error getting all feedback submissions:', error);
        throw error;
      }
    }
  }
};

export default PerformanceAPI;
