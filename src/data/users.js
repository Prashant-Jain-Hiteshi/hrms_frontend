export const PREDEFINED_USERS = [
  {
    id: 1,
    email: 'admin@hiteshi.com',
    password: '123456',
    role: 'admin',
    name: 'Admin User',
    department: 'Administration',
    designation: 'System Administrator',
    employeeId: 'EMP001'
  },
  {
    id: 2,
    email: 'hr@hiteshi.com',
    password: '123456',
    role: 'hr',
    name: 'HR Manager',
    department: 'Human Resources',
    designation: 'HR Manager',
    employeeId: 'EMP002'
  },
  {
    id: 3,
    email: 'shubham@hiteshi.com',
    password: '123456',
    role: 'employee',
    name: 'Shubham Kumar',
    department: 'Engineering',
    designation: 'Software Developer',
    employeeId: 'EMP003'
  },
  {
    id: 4,
    email: 'finance@hiteshi.com',
    password: '123456',
    role: 'finance',
    name: 'Finance Manager',
    department: 'Finance',
    designation: 'Finance Manager',
    employeeId: 'EMP004'
  }
];

export const ROLE_PERMISSIONS = {
  admin: ['all'],
  hr: ['employees', 'leave', 'attendance', 'recruitment', 'performance'],
  employee: ['self-service', 'attendance', 'leave', 'documents'],
  finance: ['payroll', 'expenses', 'reports']
};
