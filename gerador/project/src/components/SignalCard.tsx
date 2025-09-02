import React from 'react';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { TradingSignal } from '../types/signal';

interface SignalCardProps {
  signal: TradingSignal;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const getSignalIcon = () => {
    switch (signal.type) {
      case 'BUY':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'SELL':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      case 'HOLD':
        return <Minus className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getSignalColor = () => {
    switch (signal.type) {
      case 'BUY':
        return 'border-green-400/30 bg-green-400/5';
      case 'SELL':
        return 'border-red-400/30 bg-red-400/5';
      case 'HOLD':
        return 'border-yellow-400/30 bg-yellow-400/5';
    }
  };

  const getTypeColor = () => {
    switch (signal.type) {
      case 'BUY':
        return 'text-green-400';
      case 'SELL':
        return 'text-red-400';
      case 'HOLD':
        return 'text-yellow-400';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getSignalColor()} hover:bg-opacity-20 transition-all duration-200`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {getSignalIcon()}
          <span className="text-green-400 font-bold text-lg ml-2">{signal.symbol}</span>
        </div>
        <div className="flex items-center text-green-300/60 text-sm">
          <Clock className="w-4 h-4 mr-1" />
          {signal.timestamp.toLocaleTimeString('pt-BR')}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <span className="text-green-300/60 text-sm block">Tipo</span>
          <span className={`font-bold ${getTypeColor()}`}>{signal.type}</span>
        </div>
        <div>
          <span className="text-green-300/60 text-sm block">Preço</span>
          <span className="text-green-400 font-mono">${signal.price.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="mb-3">
        <span className="text-green-300/60 text-sm block">Confiança</span>
        <div className="flex items-center mt-1">
          <div className="flex-1 bg-gray-800 rounded-full h-2 mr-3">
            <div 
              className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-300"
              style={{ width: `${signal.confidence}%` }}
            />
          </div>
          <span className="text-green-400 font-bold text-sm">{signal.confidence}%</span>
        </div>
      </div>
      
      <div>
        <span className="text-green-300/60 text-sm block mb-1">Análise</span>
        <p className="text-green-300 text-sm">{signal.reason}</p>
      </div>
    </div>
  );
};