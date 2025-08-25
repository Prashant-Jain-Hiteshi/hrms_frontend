import React from 'react';

const Logo = ({ className = "" }) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Animated Icon */}
      <div className="relative">
        <div className="logo-icon bg-white/20 rounded-lg p-2 backdrop-blur-sm">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            {/* Staff/People Icon with Loom Pattern */}
            <circle cx="9" cy="7" r="2" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
            <circle cx="15" cy="7" r="2" stroke="currentColor" strokeWidth="2" className="animate-pulse" style={{animationDelay: '0.5s'}} />
            <path d="M12 14c-3 0-5 2-5 4v2h10v-2c0-2-2-4-5-4z" stroke="currentColor" strokeWidth="2" fill="none" />
            
            {/* Loom/Weaving Pattern */}
            <path d="M3 12h18" stroke="currentColor" strokeWidth="1" opacity="0.6" className="animate-fade" />
            <path d="M3 15h18" stroke="currentColor" strokeWidth="1" opacity="0.4" className="animate-fade" style={{animationDelay: '1s'}} />
            <path d="M6 9h12" stroke="currentColor" strokeWidth="1" opacity="0.3" className="animate-fade" style={{animationDelay: '1.5s'}} />
          </svg>
        </div>
        
        {/* Floating Particles */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
      </div>
      
      {/* Animated Text */}
      <div className="flex flex-col">
        <div className="flex items-center">
          <span className="text-xl font-bold text-white logo-text">
            <span className="inline-block animate-slide-in" style={{animationDelay: '0.1s'}}>S</span>
            <span className="inline-block animate-slide-in" style={{animationDelay: '0.2s'}}>t</span>
            <span className="inline-block animate-slide-in" style={{animationDelay: '0.3s'}}>a</span>
            <span className="inline-block animate-slide-in" style={{animationDelay: '0.4s'}}>f</span>
            <span className="inline-block animate-slide-in" style={{animationDelay: '0.5s'}}>f</span>
            <span className="inline-block animate-slide-in text-white/90" style={{animationDelay: '0.6s'}}>L</span>
            <span className="inline-block animate-slide-in text-white/90" style={{animationDelay: '0.7s'}}>o</span>
            <span className="inline-block animate-slide-in text-white/90" style={{animationDelay: '0.8s'}}>o</span>
            <span className="inline-block animate-slide-in text-white/90" style={{animationDelay: '0.9s'}}>m</span>
          </span>
        </div>
        <p className="text-xs text-white/80 animate-fade-in" style={{animationDelay: '1.2s'}}>
          HR Management System
        </p>
      </div>
    </div>
  );
};

export default Logo;
