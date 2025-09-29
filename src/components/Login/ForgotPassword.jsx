import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import OTPInput from '../ui/OTPInput';
import { Mail, ArrowLeft, Lock, Eye, EyeOff, Clock, RefreshCw, CheckCircle } from 'lucide-react';
import { useToast } from '../ui/Toast';

const ForgotPassword = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'password'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendResetOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password reset OTP sent to your email');
        setStep('otp');
        setCountdown(60);
      } else {
        toast.error(data.message || 'Failed to send reset OTP');
      }
    } catch (error) {
      console.error('Send reset OTP error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('OTP resent to your email address');
        setCountdown(60);
        setOtp('');
      } else {
        toast.error(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          otpCode: otpCode 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('OTP verified! Set your new password');
        setStep('password');
      } else {
        toast.error(data.message || 'Invalid or expired OTP');
        setOtp('');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error('Network error. Please try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Note: This endpoint needs to be implemented in the backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(),
          otpCode: otp,
          newPassword: newPassword.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password reset successfully! Please login with your new password');
        onSuccess();
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = (otpCode) => {
    setOtp(otpCode);
    handleVerifyOTP(otpCode);
  };

  const handleOTPChange = (otpCode) => {
    setOtp(otpCode);
  };

  // Email Step
  if (step === 'email') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <button
            onClick={onBack}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Login
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Forgot Password
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your email to receive a password reset code
          </p>
        </div>

        <form onSubmit={handleSendResetOTP} className="space-y-4">
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
                disabled={loading}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sending Reset Code...</span>
              </div>
            ) : (
              'Send Reset Code'
            )}
          </Button>
        </form>
      </div>
    );
  }

  // OTP Verification Step
  if (step === 'otp') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <button
            onClick={() => setStep('email')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Change Email
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Enter Reset Code
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a 6-digit code to<br />
            <span className="font-medium text-gray-900 dark:text-white">{email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block text-center">
              Enter 6-digit Reset Code
            </label>
            <OTPInput
              length={6}
              value={otp}
              onChange={handleOTPChange}
              onComplete={handleOTPComplete}
              disabled={loading}
              className="justify-center"
            />
          </div>

          <div className="text-center">
            {countdown > 0 ? (
              <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-1" />
                Resend code in {countdown}s
              </div>
            ) : (
              <button
                onClick={handleResendOTP}
                disabled={resendLoading}
                className="inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${resendLoading ? 'animate-spin' : ''}`} />
                {resendLoading ? 'Resending...' : 'Resend Code'}
              </button>
            )}
          </div>

          <Button
            onClick={() => handleVerifyOTP(otp)}
            className="w-full h-12 text-base font-medium"
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              'Verify Code'
            )}
          </Button>
        </div>
      </div>
    );
  }

  // New Password Step
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Set New Password
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Create a strong password for your account
        </p>
      </div>

      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 pr-10 h-12 border-gray-200 focus:border-primary focus:ring-primary"
              required
              disabled={loading}
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 pr-10 h-12 border-gray-200 focus:border-primary focus:ring-primary"
              required
              disabled={loading}
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>Password requirements:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li className={newPassword.length >= 6 ? 'text-green-600 dark:text-green-400' : ''}>
              At least 6 characters
            </li>
            <li className={newPassword === confirmPassword && newPassword ? 'text-green-600 dark:text-green-400' : ''}>
              Passwords match
            </li>
          </ul>
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 text-base font-medium" 
          disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Resetting Password...</span>
            </div>
          ) : (
            'Reset Password'
          )}
        </Button>
      </form>
    </div>
  );
};

export default ForgotPassword;
