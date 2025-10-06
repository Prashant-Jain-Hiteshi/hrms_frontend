import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CheckCircle, XCircle } from 'lucide-react';

const CandidateFormModal = ({
  showCandidateForm,
  setShowCandidateForm,
  candidateForm,
  candidateFormErrors,
  handleCandidateFormChange,
  handleCandidateSubmit,
  jobs,
  loading
}) => {
  if (!showCandidateForm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-4">Add New Candidate</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name Field */}
          <div>
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <Input 
              placeholder="Enter candidate name" 
              value={candidateForm.fullName}
              onChange={(e) => handleCandidateFormChange('fullName', e.target.value)}
              className={candidateFormErrors.fullName ? 'border-red-500' : ''}
            />
            {candidateFormErrors.fullName && (
              <p className="text-red-500 text-xs mt-1">{candidateFormErrors.fullName}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <Input 
              type="email"
              placeholder="candidate@email.com" 
              value={candidateForm.email}
              onChange={(e) => handleCandidateFormChange('email', e.target.value)}
              className={candidateFormErrors.email ? 'border-red-500' : ''}
            />
            {candidateFormErrors.email && (
              <p className="text-red-500 text-xs mt-1">{candidateFormErrors.email}</p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <Input 
              placeholder="+1 (555) 123-4567" 
              value={candidateForm.phone}
              onChange={(e) => handleCandidateFormChange('phone', e.target.value)}
              className={candidateFormErrors.phone ? 'border-red-500' : ''}
            />
            {candidateFormErrors.phone && (
              <p className="text-red-500 text-xs mt-1">{candidateFormErrors.phone}</p>
            )}
          </div>

          {/* Position Field */}
          <div>
            <label className="block text-sm font-medium mb-1">Position *</label>
            <Input 
              placeholder="e.g. Software Engineer" 
              value={candidateForm.position}
              onChange={(e) => handleCandidateFormChange('position', e.target.value)}
              className={candidateFormErrors.position ? 'border-red-500' : ''}
            />
            {candidateFormErrors.position && (
              <p className="text-red-500 text-xs mt-1">{candidateFormErrors.position}</p>
            )}
          </div>

          {/* Experience Field */}
          <div>
            <label className="block text-sm font-medium mb-1">Experience (years)</label>
            <Input 
              type="number"
              placeholder="e.g. 3" 
              value={candidateForm.experience}
              onChange={(e) => handleCandidateFormChange('experience', e.target.value)}
              className={candidateFormErrors.experience ? 'border-red-500' : ''}
              min="0"
              max="50"
            />
            {candidateFormErrors.experience && (
              <p className="text-red-500 text-xs mt-1">{candidateFormErrors.experience}</p>
            )}
          </div>

          {/* Job Selection Field */}
          <div>
            <label className="block text-sm font-medium mb-1">Apply for Job *</label>
            <select 
              className={`w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 ${candidateFormErrors.jobId ? 'border-red-500' : ''}`}
              value={candidateForm.jobId}
              onChange={(e) => handleCandidateFormChange('jobId', e.target.value)}
            >
              <option value="">Select a job...</option>
              {jobs.filter(job => job.status === 'active').map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.department?.name || job.department}
                </option>
              ))}
            </select>
            {candidateFormErrors.jobId && (
              <p className="text-red-500 text-xs mt-1">{candidateFormErrors.jobId}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button 
            variant="outline" 
            onClick={() => {
              setShowCandidateForm(false);
              // Clear any errors when closing
            }}
            disabled={loading}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            variant="default" 
            onClick={handleCandidateSubmit}
            disabled={loading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {loading ? 'Adding...' : 'Add Candidate'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CandidateFormModal;
