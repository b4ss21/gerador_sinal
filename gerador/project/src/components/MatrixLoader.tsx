import React from 'react';

export const MatrixLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-pulse text-center">
        <div className="text-xl mb-4">Carregando...</div>
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '0.8s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};