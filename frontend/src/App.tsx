import { useState, useEffect } from 'react';
import { Login } from './pages/login';
import { Register } from './pages/register';
import { EmConstrucao } from './pages/em_construcao';
import { AdminPage } from './pages/admin';
import { ClientePage } from './pages/cliente';

export function App() {
  const getInitialPage = () => {
    const path = window.location.pathname;
    if (path === '/admin') return 'admin';
    if (path === '/cliente') return 'cliente';
    if (path === '/register') return 'register';
    if (path === '/forgot-password') return 'forgot-password';
    return 'login';
  };

  const [currentPage, setCurrentPage] = useState<string>(getInitialPage);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getInitialPage());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    if (path === '/admin') setCurrentPage('admin');
    else if (path === '/cliente') setCurrentPage('cliente');
    else if (path === '/register') setCurrentPage('register');
    else if (path === '/forgot-password') setCurrentPage('forgot-password');
    else setCurrentPage('login');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigateTo('/login');
  };

  if (currentPage === 'admin') {
    return <AdminPage onLogout={handleLogout} />;
  }

  if (currentPage === 'cliente') {
    return <ClientePage onLogout={handleLogout} />;
  }

  if (currentPage === 'register') {
    return <Register onBackToLogin={() => navigateTo('/login')} />;
  }

  if (currentPage === 'forgot-password') {
    return <EmConstrucao onBackToLogin={() => navigateTo('/login')} />;
  }

  return (
    <Login
      onNavigateRegister={() => navigateTo('/register')}
      onNavigateForgotPassword={() => navigateTo('/forgot-password')}
      onNavigate={navigateTo}
    />
  );
}

export default App;
