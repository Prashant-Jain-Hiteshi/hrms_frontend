import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// Toast Context
const ToastContext = createContext();

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const toast = {
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    info: (message, duration) => addToast(message, 'info', duration),
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Container Component
const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Individual Toast Item Component
const ToastItem = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(onRemove, 300); // Wait for exit animation
  };

  const getToastStyles = () => {
    const baseStyles = "flex items-center p-4 rounded-lg shadow-lg border transition-all duration-300 transform max-w-md";
    
    const typeStyles = {
      success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300",
      error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300",
      info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
    };

    const animationStyles = isLeaving 
      ? "translate-x-full opacity-0" 
      : isVisible 
        ? "translate-x-0 opacity-100" 
        : "translate-x-full opacity-0";

    return `${baseStyles} ${typeStyles[toast.type]} ${animationStyles}`;
  };

  const getIcon = () => {
    const iconProps = { className: "h-5 w-5 mr-3 flex-shrink-0" };
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle {...iconProps} className="h-5 w-5 mr-3 flex-shrink-0 text-green-600 dark:text-green-400" />;
      case 'error':
        return <XCircle {...iconProps} className="h-5 w-5 mr-3 flex-shrink-0 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertCircle {...iconProps} className="h-5 w-5 mr-3 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />;
      case 'info':
        return <Info {...iconProps} className="h-5 w-5 mr-3 flex-shrink-0 text-blue-600 dark:text-blue-400" />;
      default:
        return <Info {...iconProps} />;
    }
  };

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <div className="flex-1">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={handleRemove}
        className="ml-3 flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ToastItem;
