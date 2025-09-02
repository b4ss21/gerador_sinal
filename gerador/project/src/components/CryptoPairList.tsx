import React from 'react';
import { CryptoPair } from '../types/crypto';

interface CryptoPairListProps {
  pairs: CryptoPair[];
}

export const CryptoPairList: React.FC<CryptoPairListProps> = ({ pairs }) => {
  return (
    <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-green-400">
      <ul className="space-y-0">
        {pairs.map((pair, index) => (
          <li
            key={pair.symbol}
            className="py-2 px-1 border-b border-green-400/20 text-lg font-mono hover:bg-green-400/5 transition-colors duration-200"
            style={{
              animationDelay: `${index * 0.02}s`
            }}
          >
            <span className="text-green-300/60 text-sm mr-3">#{pair.rank.toString().padStart(3, '0')}</span>
            <span className="text-green-400">{pair.symbol}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};