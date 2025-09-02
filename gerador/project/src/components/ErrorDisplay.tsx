import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="text-center py-8">
      <div className="flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400 mr-2" />
        <span className="text-red-400 text-lg">Erro</span>
      </div>
      <p className="text-green-300 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-green-400/10 border border-green-400 text-green-400 rounded hover:bg-green-400/20 transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </button>
      )}
    </div>
  );
};