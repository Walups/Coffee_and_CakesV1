import type { FC } from 'react';
import { X, Home, ShoppingBag, UserCheck, LogOut } from 'lucide-react';
import { usuarioService, getStoredUsuario } from '../services/usuarioService';
import { formatarNomeCliente } from '../services/pedidoService';

interface SideMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  onNavigateHome?: () => void;
  onNavigateMinhasCompras?: () => void;
  onNavigateEditarCadastro?: () => void;
}

export const SideMenuDrawer: FC<SideMenuDrawerProps> = ({
  isOpen,
  onClose,
  onLogout,
  onNavigateHome,
  onNavigateMinhasCompras,
  onNavigateEditarCadastro,
}) => {
  if (!isOpen) return null;

  const usuario = getStoredUsuario();
  const nomeCliente = formatarNomeCliente(usuario?.nome_completo);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      usuarioService.logout();
    }
  };

  const handleHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      onClose();
    }
  };

  const handleMinhasCompras = () => {
    if (onNavigateMinhasCompras) {
      onNavigateMinhasCompras();
    } else {
      onClose();
    }
  };

  const handleEditarCadastro = () => {
    if (onNavigateEditarCadastro) {
      onNavigateEditarCadastro();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full relative flex">
        {/* Painel do menu lateral cobrindo ~82% da largura */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Menu lateral"
          className="w-[82%] h-full bg-[#FCE8DC] shadow-2xl flex flex-col justify-between p-6 z-10 animate-in slide-in-from-left duration-200"
        >
          {/* Topo do Menu: Botão Fechar (X) e Nome do Usuário */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#5B2418]/15">
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar menu"
                className="p-1 rounded-full text-[#5B2418] hover:bg-[#5B2418]/10 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Destaque do nome do usuário logado (sem avatar/foto) */}
            <div className="mt-6 mb-8">
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                Olá,
              </p>
              <h2 className="text-xl font-extrabold text-[#5B2418] truncate mt-1">
                {nomeCliente || 'Cliente'}
              </h2>
            </div>

            {/* Opções de Navegação */}
            <nav className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleHome}
                className="flex items-center gap-3 w-full text-left py-2.5 px-3 rounded-xl text-lg font-bold text-[#1E1E1E] hover:text-[#5B2418] hover:bg-[#5B2418]/5 transition-colors cursor-pointer"
              >
                <Home className="w-5 h-5 text-[#5B2418]" />
                <span>Início</span>
              </button>

              <button
                type="button"
                onClick={handleMinhasCompras}
                className="flex items-center gap-3 w-full text-left py-2.5 px-3 rounded-xl text-lg font-bold text-[#1E1E1E] hover:text-[#5B2418] hover:bg-[#5B2418]/5 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5 text-[#5B2418]" />
                <span>Minhas compras</span>
              </button>

              <button
                type="button"
                onClick={handleEditarCadastro}
                className="flex items-center gap-3 w-full text-left py-2.5 px-3 rounded-xl text-lg font-bold text-[#1E1E1E] hover:text-[#5B2418] hover:bg-[#5B2418]/5 transition-colors cursor-pointer"
              >
                <UserCheck className="w-5 h-5 text-[#5B2418]" />
                <span>Editar Cadastro</span>
              </button>
            </nav>
          </div>

          {/* Opção Sair fixada na parte inferior */}
          <div className="pt-4 border-t border-[#5B2418]/15">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 w-full text-left py-3 px-3 rounded-xl font-extrabold text-[#5B2418] hover:bg-[#5B2418]/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </aside>

        {/* Faixa externa transparente à direita (~18%) para fechar ao clicar */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Fechar menu ao clicar fora"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onClose();
          }}
          className="w-[18%] h-full cursor-pointer"
        />
      </div>
    </div>
  );
};
