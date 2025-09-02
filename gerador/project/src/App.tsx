import React from 'react';
import { useAuth } from './hooks/useAuth';
import { useSignals } from './hooks/useSignals';
import { LoginForm } from './components/LoginForm';
import { SignalDashboard } from './components/SignalDashboard';

function App() {
  const { user, loading: authLoading, error: authError, login, logout, isAuthenticated } = useAuth();
  const { signals, loading: signalsLoading, error: signalsError, generateSignals } = useSignals(isAuthenticated);

  if (!isAuthenticated) {
    return (
      <LoginForm 
        onLogin={login}
        loading={authLoading}
        error={authError}
      />
    );
  }

  return (
    <SignalDashboard
      signals={signals}
      loading={signalsLoading}
      error={signalsError}
      onLogout={logout}
      onRefresh={generateSignals}
      userEmail={user?.email || ''}
    />
  );
}

export default App;