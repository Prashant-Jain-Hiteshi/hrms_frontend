import React from 'react';

const Progress = ({ value = 0, className = '', style = {}, ...props }) => {
  // Ensure value is between 0 and 100
  const normalizedValue = Math.min(100, Math.max(0, value));
  
  return (
    <div 
      className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}
      {...props}
    >
      <div
        className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${normalizedValue}%`,
          ...style
        }}
      />
    </div>
  );
};

export { Progress };
