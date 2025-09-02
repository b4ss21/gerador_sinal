import React from 'react';
import { TrendingUp } from 'lucide-react';

export const MatrixHeader: React.FC = () => {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center mb-4">
        <TrendingUp className="w-8 h-8 text-green-400 mr-3" />
        <h1 className="text-3xl font-bold tracking-wider text-green-400">
          TOP 500 PARES /USDT
        </h1>
      </div>
      <p className="text-green-300/70 text-sm">
        Classificados por volume de negociação em 24h
      </p>
    </div>
  );
};