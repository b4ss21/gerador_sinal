import React, { useState } from 'react';
import { Lock, User, LogIn } from 'lucide-react';
import { LoginCredentials } from '../types/auth';

interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, loading, error }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(credentials);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="matrix-rain"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-black/85 border-2 border-green-400 rounded-lg shadow-2xl p-8 backdrop-blur-sm">
          <div 
            className="absolute inset-0 rounded-lg opacity-20 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 50%, #39ff1410 0%, transparent 70%)',
              boxShadow: '0 0 50px #39ff14'
            }}
          />
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-green-400 mr-3" />
                <h1 className="text-2xl font-bold tracking-wider text-green-400">
                  ACESSO RESTRITO
                </h1>
              </div>
              <p className="text-green-300/70 text-sm">
                Sistema de Sinais Criptográficos
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-green-400 text-sm mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Usuário
                </label>
                <input
                  type="text"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-black/50 border border-green-400/30 rounded text-green-400 placeholder-green-400/50 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/20 transition-all duration-200"
                  placeholder="Digite seu usuário"
                  required
                />
              </div>

              <div>
                <label className="block text-green-400 text-sm mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Senha
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 bg-black/50 border border-green-400/30 rounded text-green-400 placeholder-green-400/50 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/20 transition-all duration-200"
                  placeholder="Digite sua senha"
                  required
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm text-center p-3 border border-red-400/30 rounded bg-red-400/5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-400/10 border border-green-400 text-green-400 rounded hover:bg-green-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full mr-2" />
                    Autenticando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="w-4 h-4 mr-2" />
                    ACESSAR SISTEMA
                  </div>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-green-300/60 text-xs">
              <p>Credenciais padrão: admin / 123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};