import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

/**
 * ErrorState — Reusable error display with retry button.
 * @param {string} message - Error message to display
 * @param {function} [onRetry] - Retry callback
 */
const ErrorState = ({ message = 'Something went wrong', onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
    <div className="w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center text-status-error mb-4">
      <AlertTriangle size={32} />
    </div>
    <h3 className="text-lg font-semibold text-on-surface mb-2">Error</h3>
    <p className="text-sm text-on-surface-variant mb-6 max-w-sm">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-secondary flex items-center gap-2">
        <RefreshCcw size={16} /> Try Again
      </button>
    )}
  </div>
);

export default ErrorState;
