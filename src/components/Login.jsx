import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import Logo from './ui/Logo';
import { Building2, Mail, Lock, Eye, EyeOff, Users, TrendingUp, Shield, Clock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Login attempt:', { email, password });
    
    try {
      const result = await login(email, password);
      console.log('Login result:', result);
      
      if (result.success) {
        // Navigate to dashboard on successful login
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
    }
    
    setLoading(false);
  };

  const demoCredentials = [
    { role: 'Admin', email: 'admin@hiteshi.com', password: '123456' },
    { role: 'HR Manager', email: 'hr@hiteshi.com', password: '123456' },
    { role: 'Employee', email: 'shubham@hiteshi.com', password: '123456' },
    { role: 'Finance', email: 'finance@hiteshi.com', password: '123456' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-900 dark:to-slate-800 flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900"></div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 border border-white/20 rounded-full"></div>
          <div className="absolute bottom-32 left-32 w-40 h-40 border border-white/20 rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 border border-white/20 rounded-full"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <Logo className="scale-125" />
          </div>
          
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Streamline Your<br />
            <span className="text-white/80">HR Operations</span>
          </h2>
          
          <p className="text-xl text-white/80 mb-12 leading-relaxed">
            Manage employees, track attendance, process payroll, and boost productivity with our comprehensive HR management system.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 rounded-lg p-3">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Employee Management</h3>
                <p className="text-white/70 text-sm">Complete employee lifecycle management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 rounded-lg p-3">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Time & Attendance</h3>
                <p className="text-white/70 text-sm">Real-time attendance tracking and reporting</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 rounded-lg p-3">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Performance Analytics</h3>
                <p className="text-white/70 text-sm">Data-driven insights and reporting</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 rounded-lg p-3">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Secure & Compliant</h3>
                <p className="text-white/70 text-sm">Enterprise-grade security and compliance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 mb-4">
              <Logo />
            </div>
          </div>

          {/* Login Header */}
          <div className="text-center lg:text-left mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
            <p className="text-gray-600 dark:text-gray-400">Sign in to access your StaffLoom dashboard</p>
          </div>

          {/* Login Form */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 border-gray-200 focus:border-primary focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 border-gray-200 focus:border-primary focus:ring-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Demo Credentials */}
          <Card className="shadow-lg border-0 bg-white/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-gray-900">Demo Credentials</CardTitle>
              <CardDescription>Click any credential below to auto-fill the form</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {demoCredentials.map((cred, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-slate-800 rounded-xl cursor-pointer hover:from-slate-100 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-slate-700 transition-all duration-200 border border-gray-200/50 hover:border-gray-300/50 hover:shadow-md"
                    onClick={() => {
                      setEmail(cred.email);
                      setPassword(cred.password);
                    }}
                  >
                    <div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">{cred.role}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{cred.email}</div>
                    </div>
                    <div className="text-xs text-primary font-medium">Click to use</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
