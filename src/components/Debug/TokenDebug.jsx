import React from 'react';
import { getToken, isAuthenticated } from '../../socket/tokenUtils';
import { useAuth } from '../../contexts/AuthContext';

const TokenDebug = () => {
  const { user } = useAuth();
  const token = getToken();
  const authenticated = isAuthenticated();

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">🔍 Debug Info</h3>
      
      <div className="space-y-1">
        <div>
          <strong>User:</strong> {user ? `${user.name} (${user.role})` : 'Not logged in'}
        </div>
        
        <div>
          <strong>Token exists:</strong> {token ? '✅ Yes' : '❌ No'}
        </div>
        
        <div>
          <strong>Is authenticated:</strong> {authenticated ? '✅ Yes' : '❌ No'}
        </div>
        
        <div>
          <strong>Token preview:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}
        </div>
        
        <div>
          <strong>LocalStorage keys:</strong>
          <div className="ml-2 text-xs">
            {Object.keys(localStorage).filter(key => key.includes('hrms')).map(key => (
              <div key={key}>• {key}: {localStorage.getItem(key) ? '✅' : '❌'}</div>
            ))}
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => console.log('Token:', token)}
        className="mt-2 px-2 py-1 bg-blue-600 rounded text-xs"
      >
        Log Token
      </button>
    </div>
  );
};

export default TokenDebug;
