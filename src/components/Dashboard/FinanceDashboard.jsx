import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { 
  DollarSign, TrendingUp, Receipt, FileText, 
  CheckCircle, AlertCircle, CreditCard, PieChart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getDashboardStats } from '../../data/mockData';
import { HRPayrollAPI } from '../../lib/hrPayrollApi';
import { useAuth } from '../../contexts/AuthContext';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const stats = getDashboardStats('finance');
  
  // Real data state
  const [realData, setRealData] = useState({
    monthlyPayroll: 0,
    processedPayslips: 0,
    pendingApprovals: [],
    recentTransactions: [],
    payrollTrends: [],
    loading: true
  });
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  // Debug: Log current state
  console.log('🔍 Current realData state:', realData);

  // Fetch real data from existing APIs
  useEffect(() => {
    console.log('🚀 Finance Dashboard useEffect triggered!', { user, currentMonth });
    
    const fetchDashboardData = async () => {
      console.log('🔍 Finance Dashboard - User check:', { user, role: user?.role });
      if (!user) {
        console.log('❌ No user found, skipping API calls');
        return;
      }
      
      // Check if user has finance role (could be 'finance' or 'admin' with finance access)
      // Temporarily allow all roles for debugging
      if (user.role !== 'finance' && user.role !== 'admin') {
        console.log('❌ User role is not finance or admin:', user.role, 'skipping API calls');
        return;
      }
      
      console.log('✅ User role check passed, proceeding with API calls...');
      
      try {
        console.log('🔍 Fetching Finance Dashboard data...');
        
        // 1. Get Pending Finance Approvals (for pending approvals)
        console.log('🔗 Calling API: getPendingFinanceApprovals for month:', currentMonth);
        const pendingFinanceApprovals = await HRPayrollAPI.getPendingFinanceApprovals(currentMonth);
        console.log('📊 Pending Finance Approvals Response:', pendingFinanceApprovals);
        console.log('📊 Pending Finance Approvals Type:', typeof pendingFinanceApprovals);
        console.log('📊 Pending Finance Approvals Array?:', Array.isArray(pendingFinanceApprovals));
        
        // 2. Get Bank Transfer Summary (for summary stats)
        console.log('🔗 Calling API: getBankTransferSummary for month:', currentMonth);
        const bankTransferSummary = await HRPayrollAPI.getBankTransferSummary(currentMonth);
        console.log('🏦 Bank Transfer Summary Response:', bankTransferSummary);
        console.log('🏦 Bank Transfer Summary Type:', typeof bankTransferSummary);
        console.log('🏦 Bank Transfer Summary Keys:', bankTransferSummary ? Object.keys(bankTransferSummary) : 'null/undefined');
        
        // 3. Get Bank Transfer Data (for recent transactions and processed count)
        console.log('🔗 Calling API: getBankTransferData for month:', currentMonth);
        const bankTransferData = await HRPayrollAPI.getBankTransferData(currentMonth);
        console.log('💳 Bank Transfer Data Response:', bankTransferData);
        console.log('💳 Bank Transfer Data Type:', typeof bankTransferData);
        console.log('💳 Bank Transfer Data Array?:', Array.isArray(bankTransferData));
        console.log('💳 Bank Transfer Data Length:', bankTransferData ? bankTransferData.length : 'null/undefined');
        
        // Process pending finance approvals for pending approvals section
        // Extract data from API response (handle both array and object with data property)
        const pendingApprovalsData = Array.isArray(pendingFinanceApprovals) 
          ? pendingFinanceApprovals 
          : (pendingFinanceApprovals?.data || []);
          
        console.log('🔍 Processing Pending Finance Approvals - Extracted data:', pendingApprovalsData);
        console.log('🔍 Processing Pending Finance Approvals - Total records:', pendingApprovalsData.length);
        
        const pendingApprovals = pendingApprovalsData
          .slice(0, 5) // Show top 5
          .map(p => ({
            employee: p.employee?.name || p.employeeName || 'Unknown',
            type: 'Payroll Approval',
            amount: p.netSalary || p.amount || 0,
            date: new Date(p.updatedAt || p.createdAt || Date.now()).toLocaleDateString('en-IN', { 
              month: 'short', 
              day: 'numeric' 
            })
          }));
        
        console.log('📋 Formatted Pending Approvals:', pendingApprovals);
        
        // Calculate monthly total from bank transfer summary
        // Extract data from API response (handle both direct object and object with data property)
        const summaryData = bankTransferSummary?.data || bankTransferSummary;
        
        let monthlyTotal = 0;
        let processedCount = 0;
        
        if (summaryData) {
          // Use the totalAmount from the API response structure you showed
          monthlyTotal = summaryData.totalAmount || 0;
          
          // Calculate processed count (completed + processing)
          processedCount = (summaryData.completed?.count || 0) + (summaryData.processing?.count || 0);
          
          console.log('💰 Monthly Total from Summary:', monthlyTotal);
          console.log('📊 Processed Count from Summary:', processedCount);
          console.log('📈 Summary breakdown:', {
            totalEmployees: summaryData.totalEmployees,
            totalAmount: summaryData.totalAmount,
            pending: summaryData.pending,
            completed: summaryData.completed,
            processing: summaryData.processing
          });
        }
        
        console.log('💰 Final Monthly Total:', monthlyTotal);
        console.log('📊 Final Processed Count:', processedCount);
        
        // Get recent transactions from bank transfers
        // Extract data from API response (handle both array and object with data property)
        const transferData = Array.isArray(bankTransferData) 
          ? bankTransferData 
          : (bankTransferData?.data || []);
          
        console.log('🔍 Processing Bank Transfer Data - Extracted data:', transferData);
        console.log('🔍 Processing Bank Transfer Data - Total records:', transferData.length);
        
        if (transferData.length > 0) {
          console.log('🔍 Bank Transfer statuses:', transferData.map(t => ({ id: t.id, status: t.transferStatus, amount: t.transferAmount })));
        }
        
        const completedTransfers = transferData.filter(t => t.transferStatus === 'COMPLETED');
        console.log('✅ Completed Transfers:', completedTransfers.length, completedTransfers);
        
        const recentTransactions = completedTransfers
          .slice(0, 5) // Show top 5
          .map(t => ({
            description: `Salary - ${t.employee?.name || 'Employee'}`,
            amount: -(t.transferAmount || 0), // Negative for debit
            type: 'debit',
            date: new Date(t.transferredAt || t.updatedAt).toLocaleDateString('en-IN', { 
              month: 'short', 
              day: 'numeric' 
            })
          }));
        
        console.log('💳 Formatted Recent Transactions:', recentTransactions);
        
        // Update processed count if we have bank transfer data (fallback)
        if (processedCount === 0 && transferData && transferData.length > 0) {
          processedCount = transferData.filter(t => 
            t.transferStatus === 'COMPLETED' || t.transferStatus === 'PROCESSING'
          ).length;
          console.log('📊 Processed Count (fallback from transfer data):', processedCount);
        }
        
        // Generate payroll trends (last 6 months) with real backend data
        console.log('📈 Fetching payroll trends for last 6 months...');
        
        // Prepare months data
        const monthsData = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = date.toISOString().slice(0, 7);
          const monthName = date.toLocaleDateString('en-IN', { month: 'short' });
          monthsData.push({ monthKey, monthName, index: i });
        }
        
        // Fetch all months data in parallel
        const monthPromises = monthsData.map(async ({ monthKey, monthName, index }) => {
          try {
            console.log(`📊 Fetching data for month: ${monthKey} (${monthName})`);
            const monthSummary = await HRPayrollAPI.getBankTransferSummary(monthKey);
            const monthSummaryData = monthSummary?.data || monthSummary;
            
            let amount = 0;
            if (monthSummaryData && monthSummaryData.totalAmount) {
              amount = monthSummaryData.totalAmount;
              console.log(`💰 ${monthName}: ₹${amount.toLocaleString()} (real data)`);
            } else {
              // Fallback to mock data for months with no data
              amount = 380000 + (Math.random() * 20000);
              console.log(`💰 ${monthName}: ₹${amount.toLocaleString()} (mock data - no backend data)`);
            }
            
            return {
              name: monthName,
              amount: Math.round(amount),
              monthKey,
              index
            };
            
          } catch (error) {
            console.warn(`⚠️ Error fetching data for ${monthName} (${monthKey}):`, error);
            // Fallback to mock data on error
            const fallbackAmount = 380000 + (Math.random() * 20000);
            return {
              name: monthName,
              amount: Math.round(fallbackAmount),
              monthKey,
              index
            };
          }
        });
        
        // Wait for all month data to be fetched
        const monthResults = await Promise.all(monthPromises);
        
        // Sort by index to maintain chronological order
        const payrollTrends = monthResults
          .sort((a, b) => b.index - a.index)
          .map(({ name, amount }) => ({ name, amount }));
        
        console.log('📈 Final Payroll Trends Data:', payrollTrends);
        
        const finalData = {
          monthlyPayroll: monthlyTotal,
          processedPayslips: processedCount,
          pendingApprovals: pendingApprovals,
          recentTransactions: recentTransactions,
          payrollTrends: payrollTrends,
          loading: false
        };
        
        console.log('🎯 Setting final data to state:', finalData);
        console.log('🎯 Final data breakdown:', {
          monthlyPayroll: monthlyTotal,
          processedPayslips: processedCount,
          pendingCount: pendingApprovals.length,
          transactionCount: recentTransactions.length,
          trendsCount: payrollTrends.length
        });
        
        setRealData(finalData);
        
        console.log('✅ Finance Dashboard data loaded and state updated!');
        
      } catch (error) {
        console.error('❌ Error fetching Finance Dashboard data:', error);
        setRealData(prev => ({ ...prev, loading: false }));
      }
    };
    
    console.log('🎯 About to call fetchDashboardData...');
    fetchDashboardData();
  }, [user, currentMonth]);

  // Mock data for fallback (kept for sections without backend support)
  const payrollData = [
    { name: 'Jan', amount: 380000 },
    { name: 'Feb', amount: 385000 },
    { name: 'Mar', amount: 390000 },
    { name: 'Apr', amount: 385000 },
    { name: 'May', amount: 387000 },
    { name: 'Jun', amount: 387000 },
  ];

  const expenseData = [
    { name: 'Travel', amount: 45000, color: '#3b82f6' },
    { name: 'Office Supplies', amount: 25000, color: '#10b981' },
    { name: 'Software', amount: 35000, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor financial operations and approvals</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {realData.loading ? (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-24 rounded"></div>
              ) : (
                `₹${realData.monthlyPayroll?.toLocaleString() || 0}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingExpenses}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed Payslips</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {realData.loading ? (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-12 rounded"></div>
              ) : (
                realData.processedPayslips
              )}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.budgetUtilization}%</div>
            <p className="text-xs text-muted-foreground">Of annual budget</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Trends</CardTitle>
            <CardDescription>Monthly payroll expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {realData.loading ? (
              <div className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 h-[300px] w-full rounded"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={realData.payrollTrends.length > 0 ? realData.payrollTrends : payrollData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>Monthly expense breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
                <Bar dataKey="amount" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Payroll records awaiting your approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {realData.loading ? (
                // Loading skeleton
                Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="animate-pulse flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-2 h-8 w-8"></div>
                      <div>
                        <div className="bg-gray-200 dark:bg-gray-700 h-4 w-24 rounded mb-1"></div>
                        <div className="bg-gray-200 dark:bg-gray-700 h-3 w-16 rounded"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-gray-200 dark:bg-gray-700 h-4 w-16 rounded mb-1"></div>
                      <div className="bg-gray-200 dark:bg-gray-700 h-3 w-12 rounded"></div>
                    </div>
                  </div>
                ))
              ) : realData.pendingApprovals.length > 0 ? (
                realData.pendingApprovals.map((approval, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-full p-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{approval.employee}</p>
                        <p className="text-xs text-muted-foreground">{approval.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">₹{approval.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{approval.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No pending approvals</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex space-x-2">
              <button 
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                onClick={() => navigate('/payroll')}
              >
                View All
              </button>
              <button 
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onClick={() => navigate('/payroll')}
              >
                Review
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest financial activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {realData.loading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-2 h-8 w-8"></div>
                      <div>
                        <div className="bg-gray-200 dark:bg-gray-700 h-4 w-32 rounded mb-1"></div>
                        <div className="bg-gray-200 dark:bg-gray-700 h-3 w-16 rounded"></div>
                      </div>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 h-4 w-20 rounded"></div>
                  </div>
                ))
              ) : realData.recentTransactions.length > 0 ? (
                realData.recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className={`rounded-full p-2 ${
                        transaction.type === 'credit' 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : 'bg-red-100 dark:bg-red-900/20'
                      }`}>
                        {transaction.type === 'credit' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${
                      transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'credit' ? '+' : ''}₹{Math.abs(transaction.amount).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent transactions</p>
                </div>
              )}
              
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
            <CardDescription>This month's summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Income</span>
                <span className="text-sm font-bold text-green-600">+₹8,50,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Expenses</span>
                <span className="text-sm font-bold text-red-600">-₹4,87,000</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Net Flow</span>
                  <span className="text-lg font-bold text-green-600">+₹3,63,000</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common finance tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button 
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => navigate('/payroll')}
              >
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Process Payroll</span>
              </button>
              <button 
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => navigate('/expenses')}
              >
                <Receipt className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Review Expenses</span>
              </button>
              <button 
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => navigate('/reports')}
              >
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Generate Reports</span>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>Department-wise allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { dept: 'Engineering', budget: 200000, used: 156000 },
                { dept: 'Marketing', budget: 150000, used: 98000 },
                { dept: 'Operations', budget: 100000, used: 87000 },
                { dept: 'HR', budget: 80000, used: 62000 }
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.dept}</span>
                    <span>{Math.round((item.used / item.budget) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${(item.used / item.budget) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceDashboard;
