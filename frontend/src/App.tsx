import { useState, useEffect } from 'react';
import { Login } from './pages/login';
import { Register } from './pages/register';
import { EmConstrucao } from './pages/em_construcao';
import { AdminPage } from './pages/admin';
import { CategoriasPage } from './pages/CategoriasPage';
import { ProdutosPage } from './pages/ProdutosPage';
import { HomeCliente } from './pages/HomeCliente';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { usuarioService, getStoredUsuario } from './services/usuarioService';

export function App() {
  const getInitialPage = () => {
    const path = window.location.pathname;
    if (path === '/admin/categorias') return 'admin-categorias';
    if (path === '/admin/produtos') return 'admin-produtos';
    if (path === '/admin') return 'admin';
    if (path === '/cliente') return 'cliente';
    if (path === '/register') return 'register';
    if (path === '/forgot-password') return 'forgot-password';
    if (path === '/') {
      const usuario = getStoredUsuario();
      if (usuario?.role === 'cliente') return 'cliente';
      if (usuario?.role === 'admin') return 'admin';
      return 'login';
    }
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
    if (path === '/admin/categorias') setCurrentPage('admin-categorias');
    else if (path === '/admin/produtos') setCurrentPage('admin-produtos');
    else if (path === '/admin') setCurrentPage('admin');
    else if (path === '/cliente') setCurrentPage('cliente');
    else if (path === '/register') setCurrentPage('register');
    else if (path === '/forgot-password') setCurrentPage('forgot-password');
    else if (path === '/') {
      const usuario = getStoredUsuario();
      if (usuario?.role === 'cliente') setCurrentPage('cliente');
      else if (usuario?.role === 'admin') setCurrentPage('admin');
      else setCurrentPage('login');
    } else setCurrentPage('login');
  };

  const handleLogout = () => {
    usuarioService.logout(navigateTo);
  };

  if (currentPage === 'admin') {
    return (
      <AdminRoute onNavigate={navigateTo}>
        <AdminPage onLogout={handleLogout} onNavigate={navigateTo} />
      </AdminRoute>
    );
  }

  if (currentPage === 'admin-categorias') {
    return (
      <AdminRoute onNavigate={navigateTo}>
        <CategoriasPage onLogout={handleLogout} onNavigate={navigateTo} />
      </AdminRoute>
    );
  }

  if (currentPage === 'admin-produtos') {
    return (
      <AdminRoute onNavigate={navigateTo}>
        <ProdutosPage onLogout={handleLogout} onNavigate={navigateTo} />
      </AdminRoute>
    );
  }

  if (currentPage === 'cliente') {
    return (
      <ProtectedRoute onNavigate={navigateTo}>
        <HomeCliente onLogout={handleLogout} onNavigate={navigateTo} />
      </ProtectedRoute>
    );
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
