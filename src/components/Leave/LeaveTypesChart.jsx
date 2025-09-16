import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar, Heart, Briefcase, Baby, AlertTriangle } from 'lucide-react';

const LeaveTypesChart = ({ leaveData = [] }) => {
  // Sample data if no real data is provided with status breakdown
  const defaultLeaveData = [
    { 
      name: 'Annual Leave', 
      value: 45, 
      percentage: 35, 
      color: '#3b82f6', 
      icon: Calendar,
      pending: 12,
      approved: 28,
      rejected: 5
    },
    { 
      name: 'Sick Leave', 
      value: 28, 
      percentage: 22, 
      color: '#ef4444', 
      icon: Heart,
      pending: 8,
      approved: 15,
      rejected: 5
    },
    { 
      name: 'Casual Leave', 
      value: 32, 
      percentage: 25, 
      color: '#10b981', 
      icon: Briefcase,
      pending: 10,
      approved: 18,
      rejected: 4
    },
    { 
      name: 'Maternity Leave', 
      value: 8, 
      percentage: 6, 
      color: '#f59e0b', 
      icon: Baby,
      pending: 2,
      approved: 5,
      rejected: 1
    },
    { 
      name: 'Emergency Leave', 
      value: 15, 
      percentage: 12, 
      color: '#8b5cf6', 
      icon: AlertTriangle,
      pending: 4,
      approved: 9,
      rejected: 2
    }
  ];

  const processedData = leaveData.length > 0 ? leaveData : defaultLeaveData;

  // Custom responsive tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 sm:p-4 shadow-lg max-w-xs">
          <p className="text-white font-semibold mb-2 text-sm sm:text-base">{data.name}</p>
          <div className="space-y-1 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total:</span>
              <span className="text-white font-medium">{data.value} requests</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">Pending:</span>
              <span className="text-yellow-300">{data.pending || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-400">Approved:</span>
              <span className="text-green-300">{data.approved || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-400">Rejected:</span>
              <span className="text-red-300">{data.rejected || 0}</span>
            </div>
            <div className="border-t border-gray-600 pt-1 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Percentage:</span>
                <span className="text-white font-medium">{data.percentage}%</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full bg-gray-800 border-gray-700">
      <CardContent className="p-3 sm:p-4 md:p-6">
        {/* Pie Chart */}
        <div className="mb-4 sm:mb-6">
          <ResponsiveContainer width="100%" height={240} className="sm:h-[280px] md:h-[320px]">
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                outerRadius="80%"
                fill="#8884d8"
                dataKey="value"
                label={({ percentage }) => `${percentage}%`}
                labelLine={false}
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {processedData.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg bg-gray-700/50">
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <div 
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <item.icon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-300 truncate">
                  {item.value} requests
                </p>
                <p className="text-xs text-gray-500">
                  ({item.percentage}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveTypesChart;
