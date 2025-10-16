import React, { useState, useEffect } from 'react';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/Card';
import { 
  Briefcase, BookOpen, Star as StarIcon, 
  Save, Send, X, Plus, Minus
} from 'lucide-react';
import { RatingQuestion } from '../Components/StarRating';
import { useToast } from '../../../ui/Toast';

const CurrentProjectFeedbackForm = ({ 
  goalData, 
  existingData, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  isReadOnly = false 
}) => {
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    projectDetails: {
      projectName: '',
      clientName: '',
      projectPhase: 'development',
      yourRole: '',
      teamSize: 1,
      projectDuration: '',
      technologiesUsed: []
    },
    learningOutcomes: {
      whatYouLearned: '',
      skillsGained: '',
      challengesFaced: '',
      solutionsImplemented: '',
      knowledgeShared: ''
    }
  });

  const [ratings, setRatings] = useState({
    responsibility: 0,
    ownership: 0,
    clientEngagement: 0,
    teamCollaboration: 0,
    problemSolving: 0,
    communication: 0,
    initiative: 0,
    qualityOfWork: 0
  });

  const [newTechnology, setNewTechnology] = useState('');
  const [errors, setErrors] = useState({});

  // Project phase options
  const projectPhases = [
    'planning',
    'design',
    'development',
    'testing',
    'deployment',
    'maintenance',
    'completed'
  ];

  // Rating questions
  const ratingQuestions = [
    { key: 'responsibility', question: 'How well did you take responsibility for your tasks?' },
    { key: 'ownership', question: 'How much ownership did you show for the project?' },
    { key: 'clientEngagement', question: 'How effectively did you engage with client requirements?' },
    { key: 'teamCollaboration', question: 'How well did you collaborate with team members?' },
    { key: 'problemSolving', question: 'How effectively did you solve technical challenges?' },
    { key: 'communication', question: 'How clear was your communication throughout the project?' },
    { key: 'initiative', question: 'How much initiative did you take beyond assigned tasks?' },
    { key: 'qualityOfWork', question: 'How would you rate the quality of your deliverables?' }
  ];

  // Load existing data
  useEffect(() => {
    console.log('🔍 CurrentProjectFeedbackForm - existingData received:', existingData);
    console.log('🔍 CurrentProjectFeedbackForm - feedbackData:', existingData?.feedbackData);
    console.log('🔍 CurrentProjectFeedbackForm - ratings:', existingData?.ratings);
    
    if (existingData?.feedbackData) {
      console.log('✅ Setting form data:', existingData.feedbackData);
      setFormData(existingData.feedbackData);
    }
    if (existingData?.ratings) {
      console.log('✅ Setting ratings:', existingData.ratings);
      setRatings(existingData.ratings);
    }
  }, [existingData]);

  // Handle form field changes
  const handleFieldChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    // Clear error when user starts typing
    if (errors[`${section}.${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`${section}.${field}`]: undefined
      }));
    }
  };

  // Handle rating changes
  const handleRatingChange = (key, value) => {
    setRatings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear error when user provides rating
    if (errors[`rating.${key}`]) {
      setErrors(prev => ({
        ...prev,
        [`rating.${key}`]: undefined
      }));
    }
  };

  // Add technology
  const addTechnology = () => {
    if (newTechnology.trim() && !formData.projectDetails.technologiesUsed.includes(newTechnology.trim())) {
      handleFieldChange('projectDetails', 'technologiesUsed', [
        ...formData.projectDetails.technologiesUsed,
        newTechnology.trim()
      ]);
      setNewTechnology('');
    }
  };

  // Remove technology
  const removeTechnology = (index) => {
    const updated = formData.projectDetails.technologiesUsed.filter((_, i) => i !== index);
    handleFieldChange('projectDetails', 'technologiesUsed', updated);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.projectDetails.projectName.trim()) {
      newErrors['projectDetails.projectName'] = 'Project name is required';
    }
    if (!formData.projectDetails.yourRole.trim()) {
      newErrors['projectDetails.yourRole'] = 'Your role is required';
    }
    if (!formData.learningOutcomes.whatYouLearned.trim()) {
      newErrors['learningOutcomes.whatYouLearned'] = 'What you learned is required';
    }

    // Rating validation - at least some ratings should be provided
    const ratingValues = Object.values(ratings);
    const hasAnyRating = ratingValues.some(rating => rating > 0);
    if (!hasAnyRating) {
      newErrors['ratings'] = 'Please provide at least one rating';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const submissionData = {
      goalCategory: goalData?.category || 'project_work',
      feedbackData: formData,
      ratings: ratings
    };

    await onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
      {/* Project Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Briefcase className="h-5 w-5 mr-2" />
            Project Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.projectDetails.projectName}
                onChange={(e) => handleFieldChange('projectDetails', 'projectName', e.target.value)}
                placeholder="Enter project name"
                disabled={isReadOnly}
                className={errors['projectDetails.projectName'] ? 'border-red-500' : ''}
              />
              {errors['projectDetails.projectName'] && (
                <p className="text-red-500 text-xs mt-1">{errors['projectDetails.projectName']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Client Name
              </label>
              <Input
                value={formData.projectDetails.clientName}
                onChange={(e) => handleFieldChange('projectDetails', 'clientName', e.target.value)}
                placeholder="Enter client name"
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Phase
              </label>
              <select
                value={formData.projectDetails.projectPhase}
                onChange={(e) => handleFieldChange('projectDetails', 'projectPhase', e.target.value)}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {projectPhases.map(phase => (
                  <option key={phase} value={phase}>
                    {phase.charAt(0).toUpperCase() + phase.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Role <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.projectDetails.yourRole}
                onChange={(e) => handleFieldChange('projectDetails', 'yourRole', e.target.value)}
                placeholder="e.g., Frontend Developer, Team Lead"
                disabled={isReadOnly}
                className={errors['projectDetails.yourRole'] ? 'border-red-500' : ''}
              />
              {errors['projectDetails.yourRole'] && (
                <p className="text-red-500 text-xs mt-1">{errors['projectDetails.yourRole']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Team Size
              </label>
              <Input
                type="number"
                min="1"
                value={formData.projectDetails.teamSize}
                onChange={(e) => handleFieldChange('projectDetails', 'teamSize', parseInt(e.target.value) || 1)}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Duration
              </label>
              <Input
                value={formData.projectDetails.projectDuration}
                onChange={(e) => handleFieldChange('projectDetails', 'projectDuration', e.target.value)}
                placeholder="e.g., 6 months, 3 weeks"
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Technologies Used */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Technologies Used
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.projectDetails.technologiesUsed.map((tech, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {tech}
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => removeTechnology(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {!isReadOnly && (
              <div className="flex gap-2">
                <Input
                  value={newTechnology}
                  onChange={(e) => setNewTechnology(e.target.value)}
                  placeholder="Add technology"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                />
                <Button type="button" onClick={addTechnology} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Learning & Development Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <BookOpen className="h-5 w-5 mr-2" />
            Learning & Development
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              What You Learned <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.learningOutcomes.whatYouLearned}
              onChange={(e) => handleFieldChange('learningOutcomes', 'whatYouLearned', e.target.value)}
              placeholder="Describe what you learned during this project..."
              disabled={isReadOnly}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white ${
                errors['learningOutcomes.whatYouLearned'] ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors['learningOutcomes.whatYouLearned'] && (
              <p className="text-red-500 text-xs mt-1">{errors['learningOutcomes.whatYouLearned']}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Skills Gained
            </label>
            <textarea
              value={formData.learningOutcomes.skillsGained}
              onChange={(e) => handleFieldChange('learningOutcomes', 'skillsGained', e.target.value)}
              placeholder="What new skills did you develop..."
              disabled={isReadOnly}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Challenges Faced
            </label>
            <textarea
              value={formData.learningOutcomes.challengesFaced}
              onChange={(e) => handleFieldChange('learningOutcomes', 'challengesFaced', e.target.value)}
              placeholder="What challenges did you encounter..."
              disabled={isReadOnly}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Solutions Implemented
            </label>
            <textarea
              value={formData.learningOutcomes.solutionsImplemented}
              onChange={(e) => handleFieldChange('learningOutcomes', 'solutionsImplemented', e.target.value)}
              placeholder="How did you solve the challenges..."
              disabled={isReadOnly}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Knowledge Shared
            </label>
            <textarea
              value={formData.learningOutcomes.knowledgeShared}
              onChange={(e) => handleFieldChange('learningOutcomes', 'knowledgeShared', e.target.value)}
              placeholder="How did you share knowledge with your team..."
              disabled={isReadOnly}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Self-Assessment Ratings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <StarIcon className="h-5 w-5 mr-2" />
            Self-Assessment Ratings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors['ratings'] && (
            <p className="text-red-500 text-sm">{errors['ratings']}</p>
          )}
          {ratingQuestions.map(({ key, question }) => (
            <RatingQuestion
              key={key}
              question={question}
              value={ratings[key]}
              onChange={(value) => handleRatingChange(key, value)}
              disabled={isReadOnly}
            />
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!isReadOnly && (
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );
};

export default CurrentProjectFeedbackForm;
