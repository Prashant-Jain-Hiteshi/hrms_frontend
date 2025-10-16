import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Clock, Calendar, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const MyAttendance = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Mock data for demonstration
  const mockAttendanceData = [
    { date: '2025-01-01', checkIn: '09:00', checkOut: '18:00', status: 'Present', hours: 9 },
    { date: '2025-01-02', checkIn: '09:15', checkOut: '18:30', status: 'Late', hours: 9.25 },
    { date: '2025-01-03', checkIn: null, checkOut: null, status: 'Absent', hours: 0 },
  ];

  const attendanceStats = {
    totalDays: 22,
    presentDays: 20,
    absentDays: 1,
    lateDays: 1,
    avgHours: 8.5,
    totalHours: 170
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your attendance and working hours</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2025, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {/* Quick Check-in/out */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quick Check-in/out
          </CardTitle>
          <CardDescription>Mark your attendance for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Today: {new Date().toLocaleDateString()}</p>
              <p className="text-lg font-semibold">Ready to check in?</p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              Check In
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Present Days</p>
                <p className="text-2xl font-bold text-green-600">{attendanceStats.presentDays}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent Days</p>
                <p className="text-2xl font-bold text-red-600">{attendanceStats.absentDays}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Late Days</p>
                <p className="text-2xl font-bold text-yellow-600">{attendanceStats.lateDays}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hours</p>
                <p className="text-2xl font-bold text-blue-600">{attendanceStats.totalHours}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>My Attendance Records</CardTitle>
          <CardDescription>Your attendance history for the selected month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Check In</th>
                  <th className="text-left p-2">Check Out</th>
                  <th className="text-left p-2">Hours</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockAttendanceData.map((record, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{record.date}</td>
                    <td className="p-2">{record.checkIn || '-'}</td>
                    <td className="p-2">{record.checkOut || '-'}</td>
                    <td className="p-2">{record.hours}h</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'Present' ? 'bg-green-100 text-green-800' :
                        record.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyAttendance;
