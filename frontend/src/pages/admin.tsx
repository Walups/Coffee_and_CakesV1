import type { FC } from 'react';

interface AdminProps {
  onLogout?: () => void;
}

export const AdminPage: FC<AdminProps> = ({ onLogout }) => {
  return (
    <div className="min-h-screen w-full bg-[#F1BEC5] flex flex-col">
      <header className="w-full bg-[#5B2418] text-white px-6 py-4 flex items-center justify-between shadow-md">
        <h1 className="text-xl font-bold tracking-tight">Painel do Administrador (/admin)</h1>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="text-sm font-medium bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Sair
          </button>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow-[0_13px_7px_rgba(0,0,0,0.15)] text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-zinc-800 mb-2">Bem-vindo, Administrador!</h2>
          <p className="text-zinc-600">Tela administrativa do Coffee & Cakes.</p>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;

