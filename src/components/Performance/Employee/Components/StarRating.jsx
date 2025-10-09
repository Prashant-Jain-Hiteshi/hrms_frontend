import React, { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ 
  value = 0, 
  onChange, 
  maxRating = 5, 
  size = 'md',
  disabled = false,
  showValue = true,
  label = ''
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  // Size configurations
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const handleStarClick = (rating) => {
    if (disabled) return;
    if (onChange) {
      onChange(rating);
    }
  };

  const handleStarHover = (rating) => {
    if (disabled) return;
    setHoverValue(rating);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setHoverValue(0);
  };

  const getStarColor = (starIndex) => {
    const currentValue = hoverValue || value;
    
    if (starIndex <= currentValue) {
      return disabled 
        ? 'text-gray-400 fill-gray-400' 
        : 'text-yellow-400 fill-yellow-400';
    }
    
    return disabled 
      ? 'text-gray-300' 
      : 'text-gray-300 hover:text-yellow-300';
  };

  return (
    <div className="flex items-center space-x-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0 flex-shrink-0">
          {label}
        </label>
      )}
      
      <div 
        className="flex items-center space-x-1"
        onMouseLeave={handleMouseLeave}
      >
        {[...Array(maxRating)].map((_, index) => {
          const starIndex = index + 1;
          
          return (
            <button
              key={starIndex}
              type="button"
              className={`
                ${disabled ? 'cursor-default' : 'cursor-pointer'} 
                transition-colors duration-150 
                focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded
                ${!disabled && 'hover:scale-110 transform transition-transform duration-150'}
              `}
              onClick={() => handleStarClick(starIndex)}
              onMouseEnter={() => handleStarHover(starIndex)}
              disabled={disabled}
              aria-label={`Rate ${starIndex} out of ${maxRating} stars`}
            >
              <Star 
                className={`
                  ${sizeClasses[size]} 
                  ${getStarColor(starIndex)}
                  transition-colors duration-150
                `}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm text-gray-600 dark:text-gray-400 min-w-0 flex-shrink-0">
          ({value}/{maxRating})
        </span>
      )}
    </div>
  );
};

// Rating question component for forms
export const RatingQuestion = ({ 
  question, 
  value, 
  onChange, 
  disabled = false,
  required = false 
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 pr-4">
          {question}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex-shrink-0">
          <StarRating
            value={value}
            onChange={onChange}
            disabled={disabled}
            size="md"
            showValue={true}
          />
        </div>
      </div>
    </div>
  );
};

export default StarRating;
