import { format, subDays, addDays } from 'date-fns';

// Mock employees data
export const MOCK_EMPLOYEES = [
  {
    id: 1,
    employeeId: 'EMP001',
    name: 'Admin User',
    email: 'admin@hiteshi.com',
    phone: '+91 9876543210',
    department: 'Administration',
    designation: 'System Administrator',
    role: 'admin',
    joiningDate: '2020-01-15',
    salary: 80000,
    status: 'active',
    manager: null,
    avatar: null,
    address: '123 Admin Street, Delhi',
    emergencyContact: '+91 9876543211'
  },
  {
    id: 2,
    employeeId: 'EMP002',
    name: 'HR Manager',
    email: 'hr@hiteshi.com',
    phone: '+91 9876543212',
    department: 'Human Resources',
    designation: 'HR Manager',
    role: 'hr',
    joiningDate: '2020-03-10',
    salary: 75000,
    status: 'active',
    manager: 1,
    avatar: null,
    address: '456 HR Colony, Mumbai',
    emergencyContact: '+91 9876543213'
  },
  {
    id: 3,
    employeeId: 'EMP003',
    name: 'Shubham Kumar',
    email: 'shubham@hiteshi.com',
    phone: '+91 9876543214',
    department: 'Engineering',
    designation: 'Software Developer',
    role: 'employee',
    joiningDate: '2021-06-01',
    salary: 65000,
    status: 'active',
    manager: 5,
    avatar: null,
    address: '789 Tech Park, Bangalore',
    emergencyContact: '+91 9876543215'
  },
  {
    id: 4,
    employeeId: 'EMP004',
    name: 'Finance Manager',
    email: 'finance@hiteshi.com',
    phone: '+91 9876543216',
    department: 'Finance',
    designation: 'Finance Manager',
    role: 'finance',
    joiningDate: '2020-02-20',
    salary: 70000,
    status: 'active',
    manager: 1,
    avatar: null,
    address: '321 Finance Street, Chennai',
    emergencyContact: '+91 9876543217'
  },
  {
    id: 5,
    employeeId: 'EMP005',
    name: 'Tech Lead',
    email: 'techlead@hiteshi.com',
    phone: '+91 9876543218',
    department: 'Engineering',
    designation: 'Technical Lead',
    role: 'employee',
    joiningDate: '2019-08-15',
    salary: 85000,
    status: 'active',
    manager: 1,
    avatar: null,
    address: '654 Innovation Hub, Hyderabad',
    emergencyContact: '+91 9876543219'
  }
];

// Mock departments
export const MOCK_DEPARTMENTS = [
  { id: 1, name: 'Administration', headId: 1, employeeCount: 1 },
  { id: 2, name: 'Human Resources', headId: 2, employeeCount: 1 },
  { id: 3, name: 'Engineering', headId: 5, employeeCount: 2 },
  { id: 4, name: 'Finance', headId: 4, employeeCount: 1 }
];

// Mock attendance data
export const MOCK_ATTENDANCE = [
  {
    id: 1,
    employeeId: 3,
    date: format(new Date(), 'yyyy-MM-dd'),
    checkIn: '09:15',
    checkOut: '18:30',
    status: 'present',
    hoursWorked: 8.25
  },
  {
    id: 2,
    employeeId: 3,
    date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    checkIn: '09:00',
    checkOut: '18:00',
    status: 'present',
    hoursWorked: 8
  }
];

// Mock leave requests
export const MOCK_LEAVE_REQUESTS = [
  {
    id: 1,
    employeeId: 3,
    employeeName: 'Shubham Kumar',
    leaveType: 'Annual Leave',
    startDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    days: 3,
    reason: 'Family vacation',
    status: 'pending',
    appliedDate: format(new Date(), 'yyyy-MM-dd'),
    approvedBy: null
  },
  {
    id: 2,
    employeeId: 3,
    employeeName: 'Shubham Kumar',
    leaveType: 'Sick Leave',
    startDate: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
    endDate: format(subDays(new Date(), 8), 'yyyy-MM-dd'),
    days: 2,
    reason: 'Fever and cold',
    status: 'approved',
    appliedDate: format(subDays(new Date(), 12), 'yyyy-MM-dd'),
    approvedBy: 2
  }
];

// Mock payroll data
export const MOCK_PAYSLIPS = [
  {
    id: 1,
    employeeId: 3,
    month: format(subDays(new Date(), 30), 'yyyy-MM'),
    basicSalary: 65000,
    hra: 13000,
    allowances: 5000,
    grossSalary: 83000,
    pf: 7800,
    tax: 8000,
    otherDeductions: 200,
    netSalary: 67000,
    status: 'paid'
  }
];

// Mock job openings
export const MOCK_JOB_OPENINGS = [
  {
    id: 1,
    title: 'Senior Software Developer',
    department: 'Engineering',
    location: 'Bangalore',
    type: 'Full-time',
    experience: '3-5 years',
    skills: ['React', 'Node.js', 'MongoDB'],
    description: 'Looking for an experienced developer to join our team.',
    status: 'active',
    postedDate: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
    applications: 12
  },
  {
    id: 2,
    title: 'HR Executive',
    department: 'Human Resources',
    location: 'Mumbai',
    type: 'Full-time',
    experience: '1-3 years',
    skills: ['Recruitment', 'Employee Relations', 'HR Policies'],
    description: 'Join our HR team to help build a great workplace.',
    status: 'active',
    postedDate: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
    applications: 8
  }
];

// Mock performance data
export const MOCK_PERFORMANCE = [
  {
    id: 1,
    employeeId: 3,
    reviewPeriod: '2024-Q1',
    overallRating: 4.2,
    goals: [
      { title: 'Complete React certification', status: 'completed', progress: 100 },
      { title: 'Lead team project', status: 'in-progress', progress: 75 }
    ],
    feedback: 'Excellent performance this quarter. Shows great leadership potential.',
    reviewerId: 1,
    reviewDate: format(subDays(new Date(), 15), 'yyyy-MM-dd')
  }
];


// Mock expense requests
export const MOCK_EXPENSE_REQUESTS = [
  {
    id: 1,
    employeeId: 3,
    employeeName: 'Shubham Kumar',
    category: 'Travel',
    amount: 5000,
    description: 'Client meeting travel expenses',
    date: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
    status: 'pending',
    receipts: ['receipt1.jpg'],
    approvedBy: null
  }
];

// Mock announcements
export const MOCK_ANNOUNCEMENTS = [
  {
    id: 1,
    title: 'New Office Opening',
    content: 'We are excited to announce the opening of our new office in Pune!',
    type: 'info',
    publishedDate: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
    publishedBy: 2,
    priority: 'high'
  },
  {
    id: 2,
    title: 'Holiday Notice',
    content: 'Office will remain closed on Independence Day (August 15th).',
    type: 'notice',
    publishedDate: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
    publishedBy: 2,
    priority: 'medium'
  }
];

// Dashboard stats
export const getDashboardStats = (userRole) => {
  const baseStats = {
    totalEmployees: MOCK_EMPLOYEES.length,
    totalDepartments: MOCK_DEPARTMENTS.length,
    activeLeaves: MOCK_LEAVE_REQUESTS.filter(l => l.status === 'approved' && new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date()).length,
    pendingLeaves: MOCK_LEAVE_REQUESTS.filter(l => l.status === 'pending').length
  };

  switch (userRole) {
    case 'admin':
      return {
        ...baseStats,
        monthlyPayroll: 387000,
        openPositions: MOCK_JOB_OPENINGS.filter(j => j.status === 'active').length,
        pendingExpenses: MOCK_EXPENSE_REQUESTS.filter(e => e.status === 'pending').length
      };
    case 'hr':
      return {
        ...baseStats,
        upcomingInterviews: 5,
        newApplications: 20,
        performanceReviews: 8
      };
    case 'finance':
      return {
        monthlyPayroll: 387000,
        pendingExpenses: MOCK_EXPENSE_REQUESTS.filter(e => e.status === 'pending').length,
        processedPayslips: MOCK_PAYSLIPS.length,
        budgetUtilization: 78
      };
    default:
      return {
        myLeaveBalance: 18,
        attendanceThisMonth: 22,
        pendingTasks: 3,
      };
  }
};
