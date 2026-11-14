import type { FC, ReactNode } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

export interface AdminRouteProps {
  children: ReactNode;
  onNavigate?: (path: string) => void;
  redirectTo?: string;
}

export const AdminRoute: FC<AdminRouteProps> = ({
  children,
  onNavigate,
  redirectTo = '/',
}) => {
  return ProtectedRoute({
    children,
    requireAdmin: true,
    onNavigate,
    redirectTo,
  });
};

export default AdminRoute;
