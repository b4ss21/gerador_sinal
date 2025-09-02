import React from 'react';
import { LogOut, RefreshCw, Activity, TrendingUp, Minus } from 'lucide-react';
import { TradingSignal } from '../types/signal';
import { SignalCard } from './SignalCard';

interface SignalDashboardProps {
  signals: TradingSignal[];
  loading: boolean;
  error: string | null;
  onLogout: () => void;
  onRefresh: () => void;
  userEmail: string;
}

export const SignalDashboard: React.FC<SignalDashboardProps> = ({
  signals,
  loading,
  error,
  onLogout,
  onRefresh,
  userEmail
}) => {
  const buySignals = signals.filter(s => s.type === 'BUY').length;
  const sellSignals = signals.filter(s => s.type === 'SELL').length;
  const holdSignals = signals.filter(s => s.type === 'HOLD').length;

  return (
    <div className="min-h-screen bg-black text-green-400">
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="matrix-rain"></div>
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-green-400/30 bg-black/85 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-green-400 mr-3" />
                <h1 className="text-2xl font-bold tracking-wider text-green-400">
                  GERADOR DE SINAIS
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-green-300/70 text-sm">
                  Conectado como: <span className="text-green-400">{userEmail}</span>
                </span>
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="p-2 bg-green-400/10 border border-green-400/30 rounded hover:bg-green-400/20 disabled:opacity-50 transition-all duration-200"
                  title="Atualizar sinais"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 bg-red-400/10 border border-red-400/30 text-red-400 rounded hover:bg-red-400/20 transition-all duration-200"
                  title="Sair do sistema"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-black/50 border border-green-400/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300/60 text-sm">Total de Sinais</p>
                  <p className="text-2xl font-bold text-green-400">{signals.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400/60" />
              </div>
            </div>
            
            <div className="bg-black/50 border border-green-400/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300/60 text-sm">Sinais de Compra</p>
                  <p className="text-2xl font-bold text-green-400">{buySignals}</p>
                </div>
                <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-black/50 border border-red-400/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300/60 text-sm">Sinais de Venda</p>
                  <p className="text-2xl font-bold text-red-400">{sellSignals}</p>
                </div>
                <div className="w-8 h-8 bg-red-400/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
                </div>
              </div>
            </div>
            
            <div className="bg-black/50 border border-yellow-400/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300/60 text-sm">Aguardar</p>
                  <p className="text-2xl font-bold text-yellow-400">{holdSignals}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center">
                  <Minus className="w-4 h-4 text-yellow-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Signals List */}
          <div className="bg-black/50 border border-green-400/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-green-400">Sinais Recentes</h2>
              {loading && (
                <div className="flex items-center text-green-300/60 text-sm">
                  <div className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full mr-2" />
                  Atualizando...
                </div>
              )}
            </div>

            {error && (
              <div className="text-red-400 text-center p-4 border border-red-400/30 rounded bg-red-400/5 mb-6">
                {error}
              </div>
            )}

            {signals.length === 0 && !loading && !error && (
              <div className="text-center py-8 text-green-300/60">
                Nenhum sinal disponível. Clique em atualizar para gerar novos sinais.
              </div>
            )}

            <div className="grid gap-4">
              {signals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};