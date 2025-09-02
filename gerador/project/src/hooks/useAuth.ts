import { useState, useEffect } from 'react';
import { User, LoginCredentials, AuthResponse } from '../types/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedEmail = localStorage.getItem('auth_email');
    
    if (storedToken && storedEmail) {
      setUser({ email: storedEmail, token: storedToken });
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call with hardcoded credentials
      const isValid = credentials.email === 'admin' && credentials.password === '123456';
      
      if (isValid) {
        const token = 'fake-jwt-token-' + Date.now();
        const userData = { email: credentials.email, token };
        
        setUser(userData);
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_email', credentials.email);
        
        return true;
      } else {
        setError('Credenciais inválidas');
        return false;
      }
    } catch (err) {
      setError('Erro ao fazer login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_email');
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };
};