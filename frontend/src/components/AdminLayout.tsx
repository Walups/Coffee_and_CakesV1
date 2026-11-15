import type { FC, ReactNode } from 'react';
import logoImg from '../assets/Logo.png';
import { usuarioService } from '../services/usuarioService';

export type AdminNavItem = 'home' | 'produtos' | 'categorias';

export interface AdminLayoutProps {
  children?: ReactNode;
  activeItem?: AdminNavItem;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

export const AdminLayout: FC<AdminLayoutProps> = ({
  children,
  activeItem = 'home',
  onNavigate,
  onLogout,
}) => {
  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      if (typeof PopStateEvent !== 'undefined') {
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      usuarioService.logout(onNavigate);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F1BEC5] flex flex-col md:flex-row overflow-x-hidden">
      {/* Menu Lateral Esquerdo */}
      <aside className="w-full md:w-64 md:min-h-screen shrink-0 p-6 md:p-8 flex flex-col justify-between select-none">
        <div>
          {/* Logotipo Coffee & Cakes */}
          <div
            className="cursor-pointer mb-10 flex items-center"
            onClick={() => handleNavigate('/admin')}
            title="Coffee & Cakes - Início"
          >
            <img
              src={logoImg}
              alt="Coffee & Cakes"
              className="w-40 sm:w-44 object-contain pointer-events-none drop-shadow-xs"
            />
          </div>

          {/* Links de Navegação */}
          <nav className="flex flex-col gap-5" aria-label="Navegação administrativa">
            <button
              type="button"
              onClick={() => handleNavigate('/admin')}
              className={`text-left text-lg md:text-xl transition-colors cursor-pointer ${
                activeItem === 'home'
                  ? 'font-extrabold text-[#5B2418]'
                  : 'font-bold text-zinc-900 hover:text-[#5B2418]'
              }`}
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/admin/produtos')}
              className={`text-left text-lg md:text-xl transition-colors cursor-pointer ${
                activeItem === 'produtos'
                  ? 'font-extrabold text-[#5B2418]'
                  : 'font-bold text-zinc-900 hover:text-[#5B2418]'
              }`}
            >
              Produtos
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/admin/categorias')}
              className={`text-left text-lg md:text-xl transition-colors cursor-pointer ${
                activeItem === 'categorias'
                  ? 'font-extrabold text-[#5B2418]'
                  : 'font-bold text-zinc-900 hover:text-[#5B2418]'
              }`}
            >
              Categorias
            </button>
          </nav>
        </div>

        {/* Botão Sair fixado na parte inferior */}
        <div className="mt-8 md:mt-auto pt-6 border-t border-black/10 md:border-none">
          <button
            type="button"
            onClick={handleLogout}
            className="text-left text-lg md:text-xl font-bold text-zinc-900 hover:text-[#5B2418] transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Moldura superior e Área Principal Branca à Direita */}
      <div className="flex-1 flex flex-col md:pt-10">
        <main className="flex-1 bg-white rounded-t-3xl md:rounded-t-none md:rounded-tl-[44px] shadow-sm p-6 sm:p-8 md:p-12 flex flex-col min-h-[calc(100vh-2.5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
