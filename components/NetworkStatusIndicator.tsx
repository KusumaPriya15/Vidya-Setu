/**
 * Network Status Indicator Component
 * Displays connection status and reconnection notifications
 * 
 * **Validates: Requirement 18.7 - Add network error handling**
 */

import React, { useEffect } from 'react';
import { useNetworkStatus } from '../lib/useNetworkStatus';
import { useToast } from './Toast';

export const NetworkStatusIndicator: React.FC = () => {
  const { isOnline, wasOffline, resetWasOffline } = useNetworkStatus();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOnline) {
      showToast('error', 'No internet connection. Please check your network.', 0);
    } else if (wasOffline) {
      showToast('success', 'Connection restored. You\'re back online!', 5000);
      // Reset the wasOffline flag after showing the toast
      setTimeout(() => resetWasOffline(), 5000);
    }
  }, [isOnline, wasOffline, showToast, resetWasOffline]);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <div className="flex items-center gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">
            No Internet Connection
          </p>
          <p className="text-xs text-red-600 mt-1">
            Trying to reconnect...
          </p>
        </div>
        <div className="flex-shrink-0">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
        </div>
      </div>
    </div>
  );
};
