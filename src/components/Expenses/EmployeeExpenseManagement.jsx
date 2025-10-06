import React, { useState } from 'react';
import { Receipt, User } from 'lucide-react';
import ExpenseReimbursement from './ExpenseReimbursement';

const EmployeeExpenseManagement = () => {
  const [selectedTab, setSelectedTab] = useState('reimbursement');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Expenses
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your expense reimbursements and track submissions
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'reimbursement', label: 'Reimbursement', icon: Receipt },
            // Future: Add more employee expense features here
            // { id: 'history', label: 'History', icon: User },
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

      {/* Reimbursement Tab */}
      {selectedTab === 'reimbursement' && (
        <ExpenseReimbursement />
      )}
    </div>
  );
};

export default EmployeeExpenseManagement;
