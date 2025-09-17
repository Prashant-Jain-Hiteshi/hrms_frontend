import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { 
  Calculator, 
  Eye, 
  CheckCircle, 
  CreditCard, 
  Users, 
  TrendingUp, 
  DollarSign,
  Clock,
  Info,
  RefreshCw,
  BarChart3,
  AlertCircle,
  XCircle
} from 'lucide-react';

const PayrollProgressChart = ({ payrollData = [], onRefresh = null }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Calculate progress statistics
  const progress = useMemo(() => {
    if (!payrollData || !payrollData.length) {
      return {
        total: 0,
        pending: 0,
        processed: 0,
        paid: 0,
        cancelled: 0,
        pendingPercentage: 0,
        processedPercentage: 0,
        paidPercentage: 0,
        cancelledPercentage: 0
      };
    }

    const total = payrollData.length;
    const pending = payrollData.filter(p => p.status === 'pending').length;
    const processed = payrollData.filter(p => p.status === 'processed').length;
    const paid = payrollData.filter(p => p.status === 'paid').length;
    const cancelled = payrollData.filter(p => p.status === 'cancelled').length;

    return {
      total,
      pending,
      processed,
      paid,
      cancelled,
      pendingPercentage: total > 0 ? (pending / total) * 100 : 0,
      processedPercentage: total > 0 ? (processed / total) * 100 : 0,
      paidPercentage: total > 0 ? (paid / total) * 100 : 0,
      cancelledPercentage: total > 0 ? (cancelled / total) * 100 : 0
    };
  }, [payrollData]);

  const ProgressBar = ({ label, value, percentage, color, icon: Icon }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {value}
          </span>
          <span className="text-xs text-gray-500">
            ({percentage.toFixed(1)}%)
          </span>
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ease-out ${color.replace('text-', 'bg-')}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );

  const SummaryCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 truncate">Total Employees</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{progress.total}</p>
          </div>
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 sm:p-4 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 truncate">Completion Rate</p>
            <p className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-300">
              {progress.total > 0 ? Math.round((progress.paid / progress.total) * 100) : 0}%
            </p>
          </div>
          <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 sm:p-4 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 truncate">Total Amount</p>
            <p className="text-lg sm:text-2xl font-bold text-purple-700 dark:text-purple-300">
              ${(progress.total * 5000).toLocaleString()}
            </p>
          </div>
          <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
        </div>
      </div>
    </div>
  );

  const StageProgressBar = () => {
    const stages = [
      { name: 'Calculation', completed: true, color: 'bg-blue-500' },
      { name: 'Review', completed: progress.processed > 0, color: 'bg-yellow-500' },
      { name: 'Approval', completed: progress.paid > 0, color: 'bg-green-500' },
      { name: 'Payment', completed: progress.paid === progress.total && progress.total > 0, color: 'bg-purple-500' }
    ];

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Processing Pipeline
        </h4>
        <div className="flex items-center space-x-2">
          {stages.map((stage, index) => (
            <React.Fragment key={stage.name}>
              <div className="flex flex-col items-center space-y-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ${
                    stage.completed ? stage.color : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  {stage.completed ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`text-xs ${stage.completed ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500'}`}>
                  {stage.name}
                </span>
              </div>
              {index < stages.length - 1 && (
                <div className={`flex-1 h-1 rounded ${stage.completed ? 'bg-gray-300' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Enhanced Status Breakdown with responsive design
  const StatusBreakdown = () => (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        Status Breakdown
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="group hover:shadow-md transition-all duration-200 p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-600">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-yellow-700 dark:text-yellow-300 truncate">Pending</span>
              <span className="text-sm sm:text-base font-bold text-yellow-900 dark:text-yellow-100 flex-shrink-0 ml-2">{progress.pending}</span>
            </div>
            <div className="space-y-1">
              <Progress value={progress.pendingPercentage} className="h-1.5 sm:h-2" style={{ '--progress-background': '#eab308', backgroundColor: '#eab30820' }} />
              <div className="flex justify-between text-xs text-yellow-600 dark:text-yellow-400">
                <span className="font-medium">{progress.pendingPercentage.toFixed(1)}%</span>
                <Clock className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>

        <div className="group hover:shadow-md transition-all duration-200 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-600">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 truncate">Processed</span>
              <span className="text-sm sm:text-base font-bold text-blue-900 dark:text-blue-100 flex-shrink-0 ml-2">{progress.processed}</span>
            </div>
            <div className="space-y-1">
              <Progress value={progress.processedPercentage} className="h-1.5 sm:h-2" style={{ '--progress-background': '#3b82f6', backgroundColor: '#3b82f620' }} />
              <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
                <span className="font-medium">{progress.processedPercentage.toFixed(1)}%</span>
                <AlertCircle className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>

        <div className="group hover:shadow-md transition-all duration-200 p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-600">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300 truncate">Paid</span>
              <span className="text-sm sm:text-base font-bold text-green-900 dark:text-green-100 flex-shrink-0 ml-2">{progress.paid}</span>
            </div>
            <div className="space-y-1">
              <Progress value={progress.paidPercentage} className="h-1.5 sm:h-2" style={{ '--progress-background': '#10b981', backgroundColor: '#10b98120' }} />
              <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
                <span className="font-medium">{progress.paidPercentage.toFixed(1)}%</span>
                <CheckCircle className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>

        {progress.cancelled > 0 && (
          <div className="group hover:shadow-md transition-all duration-200 p-3 sm:p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-600">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-300 truncate">Cancelled</span>
                <span className="text-sm sm:text-base font-bold text-red-900 dark:text-red-100 flex-shrink-0 ml-2">{progress.cancelled}</span>
              </div>
              <div className="space-y-1">
                <Progress value={progress.cancelledPercentage} className="h-1.5 sm:h-2" style={{ '--progress-background': '#ef4444', backgroundColor: '#ef444420' }} />
                <div className="flex justify-between text-xs text-red-600 dark:text-red-400">
                  <span className="font-medium">{progress.cancelledPercentage.toFixed(1)}%</span>
                  <XCircle className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const processingStages = [
    { name: 'Calculation', description: 'Payroll data is being calculated', status: 'completed', icon: Calculator },
    { name: 'Review', description: 'Payroll data is being reviewed', status: progress.processed > 0 ? 'active' : 'pending', icon: Eye },
    { name: 'Approval', description: 'Payroll data is being approved', status: progress.paid > 0 ? 'active' : 'pending', icon: CreditCard },
    { name: 'Payment', description: 'Payroll data is being paid', status: progress.paid === progress.total && progress.total > 0 ? 'completed' : 'pending', icon: Users }
  ];

  const overallProgress = progress.paid / progress.total * 100;
  const totalEmployees = payrollData.length;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Payroll Processing Progress
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Real-time status of payroll processing pipeline
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                <span className="sm:hidden">{isRefreshing ? '...' : 'Refresh'}</span>
              </Button>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Info className="h-3 w-3" />
              <span className="hidden sm:inline">Live updates</span>
              <span className="sm:hidden">Live</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4 sm:space-y-6">
        {/* Processing Pipeline */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Processing Pipeline
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {processingStages.map((stage, index) => (
              <div key={index} className="relative group">
                <div className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-md ${
                  stage.status === 'completed' 
                    ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:border-green-800 dark:from-green-900/20 dark:to-green-800/20' 
                    : stage.status === 'active'
                    ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-800/20 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800'
                    : 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 dark:border-gray-700 dark:from-gray-800/50 dark:to-gray-700/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <stage.icon className={`h-5 w-5 sm:h-6 sm:w-6 transition-colors ${
                      stage.status === 'completed' ? 'text-green-600' :
                      stage.status === 'active' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    {stage.status === 'completed' && (
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    )}
                    {stage.status === 'active' && (
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 animate-pulse" />
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm mb-1">
                    {stage.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                    {stage.description}
                  </p>
                </div>
                {index < processingStages.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <div className={`w-4 h-0.5 transition-colors ${
                      processingStages[index + 1].status !== 'pending' ? 'bg-green-400' : 'bg-gray-300'
                    }`}></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Summary Cards */}
        <SummaryCards />
        {/* Status Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status Breakdown
          </h4>
          <ProgressBar
            label="Pending"
            value={progress.pending}
            percentage={progress.pendingPercentage}
            color="text-yellow-500"
            icon={Clock}
          />
          <ProgressBar
            label="Processed"
            value={progress.processed}
            percentage={progress.processedPercentage}
            color="text-blue-500"
            icon={AlertCircle}
          />
          <ProgressBar
            label="Paid"
            value={progress.paid}
            percentage={progress.paidPercentage}
            color="text-green-500"
            icon={CheckCircle}
          />
          {progress.cancelled > 0 && (
            <ProgressBar
              label="Cancelled"
              value={progress.cancelled}
              percentage={progress.cancelledPercentage}
              color="text-red-500"
              icon={XCircle}
            />
          )}
        </div>
        {/* Overall Progress */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Overall Progress
          </h3>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/30 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
              <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                Payroll Completion Status
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold text-blue-600">
                  {overallProgress}%
                </span>
                <div className={`w-2 h-2 rounded-full ${overallProgress === 100 ? 'bg-green-500' : overallProgress > 50 ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`}></div>
              </div>
            </div>
            <div className="space-y-2">
              <Progress 
                value={overallProgress} 
                className="h-3 sm:h-4"
                style={{
                  background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)'
                }}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">{Math.round((overallProgress / 100) * totalEmployees)}</span> of <span className="font-medium">{totalEmployees}</span> employees processed
                </p>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {overallProgress === 100 ? 'Complete' : overallProgress > 75 ? 'Almost done' : overallProgress > 25 ? 'In progress' : 'Starting'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayrollProgressChart;
