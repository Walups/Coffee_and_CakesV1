import { useState } from 'react';
import { Login } from './pages/login';
import { Register } from './pages/register';
import { EmConstrucao } from './pages/em_construcao';

export function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'forgot-password'>('login');

  if (currentPage === 'register') {
    return <Register onBackToLogin={() => setCurrentPage('login')} />;
  }

  if (currentPage === 'forgot-password') {
    return <EmConstrucao onBackToLogin={() => setCurrentPage('login')} />;
  }

  return (
    <Login
      onNavigateRegister={() => setCurrentPage('register')}
      onNavigateForgotPassword={() => setCurrentPage('forgot-password')}
    />
  );
}

export default App;
