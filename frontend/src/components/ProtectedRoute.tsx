import React from 'react';
import type { FC, ReactNode } from 'react';
import { getStoredToken, getStoredUsuario } from '../services/usuarioService';

export interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  onNavigate?: (path: string) => void;
  redirectTo?: string;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  onNavigate,
  redirectTo,
}) => {
  const token = getStoredToken();
  const usuario = getStoredUsuario();
  const isAuthenticated = Boolean(token && usuario);
  const isAdmin = usuario?.role === 'admin';

  let targetRedirect: string | null = null;

  if (!isAuthenticated) {
    targetRedirect = '/login';
  } else if (requireAdmin && !isAdmin) {
    targetRedirect = redirectTo || '/';
  }

  React.useEffect(() => {
    if (targetRedirect) {
      if (onNavigate) {
        onNavigate(targetRedirect);
      } else if (typeof window !== 'undefined') {
        window.history.pushState({}, '', targetRedirect);
        if (typeof PopStateEvent !== 'undefined') {
          window.dispatchEvent(new PopStateEvent('popstate'));
        } else if (typeof Event !== 'undefined') {
          window.dispatchEvent(new Event('popstate'));
        }
      }
    }
  }, [targetRedirect, onNavigate]);

  if (targetRedirect) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
