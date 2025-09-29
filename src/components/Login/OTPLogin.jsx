import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import OTPInput from '../ui/OTPInput';
import { Mail, ArrowLeft, Clock, RefreshCw } from 'lucide-react';
import { useToast } from '../ui/Toast';

const OTPLogin = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
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

  const handleSendOTP = async (e) => {
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
        toast.success('OTP sent to your email address');
        setStep('otp');
        setCountdown(60); // 60 seconds countdown
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
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
        setOtp(''); // Clear previous OTP
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
        toast.success('Login successful!');
        onSuccess(data); // Pass the login data to parent
      } else {
        toast.error(data.message || 'Invalid or expired OTP');
        setOtp(''); // Clear OTP on error
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error('Network error. Please try again.');
      setOtp(''); // Clear OTP on error
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

  if (step === 'email') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <button
            onClick={onBack}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Login
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Login with OTP
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your email to receive a one-time password
          </p>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSendOTP} className="space-y-4">
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
                <span>Sending OTP...</span>
              </div>
            ) : (
              'Send OTP'
            )}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <button
          onClick={() => setStep('email')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Change Email
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Enter OTP
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We've sent a 6-digit code to<br />
          <span className="font-medium text-gray-900 dark:text-white">{email}</span>
        </p>
      </div>

      {/* OTP Input */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block text-center">
            Enter 6-digit OTP
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

        {/* Resend OTP */}
        <div className="text-center">
          {countdown > 0 ? (
            <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4 mr-1" />
              Resend OTP in {countdown}s
            </div>
          ) : (
            <button
              onClick={handleResendOTP}
              disabled={resendLoading}
              className="inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${resendLoading ? 'animate-spin' : ''}`} />
              {resendLoading ? 'Resending...' : 'Resend OTP'}
            </button>
          )}
        </div>

        {/* Manual Verify Button (backup) */}
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
            'Verify OTP'
          )}
        </Button>
      </div>
    </div>
  );
};

export default OTPLogin;
