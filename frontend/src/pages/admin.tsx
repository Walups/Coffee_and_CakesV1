import type { FC } from 'react';
import { AdminLayout } from '../components/AdminLayout';

interface AdminProps {
  onLogout?: () => void;
  onNavigate?: (path: string) => void;
}

export const AdminPage: FC<AdminProps> = ({ onLogout, onNavigate }) => {
  return (
    <AdminLayout activeItem="home" onLogout={onLogout} onNavigate={onNavigate}>
      {/* Conteúdo interno da Home administrativa vazio conforme especificação */}
      <div className="flex-1 w-full" />
    </AdminLayout>
  );
};

export default AdminPage;
