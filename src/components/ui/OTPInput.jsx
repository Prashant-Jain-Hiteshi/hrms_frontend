import React, { useState, useRef, useEffect } from 'react';

const OTPInput = ({ length = 6, value = '', onChange, onComplete, disabled = false, className = '' }) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  // Initialize refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      const otpArray = value.split('').slice(0, length);
      while (otpArray.length < length) {
        otpArray.push('');
      }
      setOtp(otpArray);
    } else {
      setOtp(Array(length).fill(''));
    }
  }, [value, length]);

  const handleChange = (index, newValue) => {
    // Only allow digits
    if (newValue && !/^\d$/.test(newValue)) return;

    const newOtp = [...otp];
    newOtp[index] = newValue;
    setOtp(newOtp);

    const otpString = newOtp.join('');
    onChange?.(otpString);

    // Auto-focus next input
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete when all digits are filled
    if (otpString.length === length && !otpString.includes('')) {
      onComplete?.(otpString);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        handleChange(index, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '');
    
    if (pastedData) {
      const pastedArray = pastedData.split('').slice(0, length);
      const newOtp = [...Array(length).fill('')];
      
      pastedArray.forEach((digit, index) => {
        if (index < length) {
          newOtp[index] = digit;
        }
      });
      
      setOtp(newOtp);
      const otpString = newOtp.join('');
      onChange?.(otpString);
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = newOtp.findIndex(digit => digit === '');
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1;
      inputRefs.current[focusIndex]?.focus();
      
      // Call onComplete if all digits are filled
      if (otpString.length === length && !otpString.includes('')) {
        onComplete?.(otpString);
      }
    }
  };

  const handleFocus = (index) => {
    // Select all text when focusing
    inputRefs.current[index]?.select();
  };

  return (
    <div className={`flex gap-3 justify-center ${className}`}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={`
            w-12 h-12 text-center text-lg font-semibold
            border-2 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
            transition-all duration-200
            ${digit ? 'border-primary bg-primary/5' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
            dark:bg-gray-800 dark:border-gray-600 dark:text-white
            dark:focus:border-primary dark:hover:border-gray-500
          `}
          autoComplete="off"
        />
      ))}
    </div>
  );
};

export default OTPInput;
