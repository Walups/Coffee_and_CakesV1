import { useState, useEffect, useRef, useCallback } from 'react';
import type { FC } from 'react';
import { Menu, ShoppingCart, ArrowLeft, RefreshCw } from 'lucide-react';
import { SideMenuDrawer } from '../components/SideMenuDrawer';
import { CategoriasCarousel } from '../components/CategoriasCarousel';
import { ListaProdutosCliente } from '../components/ListaProdutosCliente';
import { produtoService } from '../services/produtoService';
import { categoriaService } from '../services/categoriaService';
import { pedidoService } from '../services/pedidoService';
import { isApiError, getApiErrorMessage } from '../services/api';
import type { Produto } from '../types/produto';
import type { Categoria } from '../types/categoria';
import logoImg from '../assets/Logo.png';

interface HomeClienteProps {
  onLogout?: () => void;
  onNavigate?: (path: string) => void;
}

export const HomeCliente: FC<HomeClienteProps> = ({ onLogout, onNavigate }) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Controle do Menu Lateral
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // Navegação provisória interna do carrinho
  const [telaAtual, setTelaAtual] = useState<'vitrine' | 'carrinho'>('vitrine');

  // Categoria selecionada no carrossel (opcional para filtro visual)
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState<string | null>(null);

  // Indica se o cliente possui um pedido ativo em andamento
  const [temPedidoAtivo, setTemPedidoAtivo] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch único na montagem com Promise.all + AbortController
  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    // Cancelar requisição anterior se houver
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      const token = localStorage.getItem('token');
      const pedidosPromise = token
        ? pedidoService.listarMeus(signal)
        : Promise.resolve([]);

      const [produtosRes, categoriasRes, pedidosRes] = await Promise.all([
        produtoService.listar(signal),
        categoriaService.listar(signal),
        pedidosPromise.catch(() => []),
      ]);

      // Mantém apenas registros com active !== false
      const produtosAtivos = Array.isArray(produtosRes)
        ? produtosRes.filter((p) => p.active !== false)
        : [];
      const categoriasAtivas = Array.isArray(categoriasRes)
        ? categoriasRes.filter((c) => c.active !== false)
        : [];

      // Verifica se há pedido ativo em andamento (aguardando, em_preparo ou pronto)
      const pedidosCliente = Array.isArray(pedidosRes) ? pedidosRes : [];
      const possuiAtivo = pedidosCliente.some(
        (p) => p.status === 'aguardando' || p.status === 'em_preparo' || p.status === 'pronto'
      );

      setProdutos(produtosAtivos);
      setCategorias(categoriasAtivas);
      setTemPedidoAtivo(possuiAtivo);
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        setErrorMessage(
          getApiErrorMessage(err, 'Erro ao carregar dados do cardápio.')
        );
      } else if (err instanceof Error) {
        if (err.name !== 'AbortError') {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Erro inesperado ao carregar dados.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarDados();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [carregarDados]);

  // Produtos para a lista vertical (podem ser filtrados pela categoria selecionada caso haja seleção)
  const produtosExibicao = categoriaSelecionadaId
    ? produtos.filter((p) => p.id_categoria === categoriaSelecionadaId)
    : produtos;

  return (
    <div className="min-h-screen w-full bg-[#F5D8C7] flex justify-center">
      {/* Container mobile-first de tela única */}
      <div className="w-full max-w-md min-h-screen bg-[#FCE8DC] flex flex-col relative shadow-2xl overflow-x-hidden">
        {/* =========================================================================
            HEADER SUPERIOR: Fundo rosado (#F8C8CE)
           ========================================================================= */}
        <header className="w-full bg-[#F8C8CE] px-4 py-3 shadow-xs sticky top-0 z-30">
          {/* Linha superior: Menu (esq), Logo (centro), Carrinho (dir) */}
          <div className="flex items-center justify-between w-full">
            {/* Botão de 3 barras (hambúrguer) à esquerda */}
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setMenuOpen(true)}
              className="p-2 rounded-xl text-[#5B2418] hover:bg-[#5B2418]/10 active:scale-95 transition-all cursor-pointer"
            >
              <Menu className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Logo Coffee & Cakes ao centro */}
            <div className="flex items-center justify-center">
              <img
                src={logoImg}
                alt="Coffee & Cakes"
                className="h-10 object-contain pointer-events-none drop-shadow-xs"
              />
            </div>

            {/* Ícone de carrinho à direita */}
            <button
              type="button"
              aria-label="Carrinho de compras"
              onClick={() => setTelaAtual(telaAtual === 'carrinho' ? 'vitrine' : 'carrinho')}
              className="p-2 rounded-xl text-[#5B2418] hover:bg-[#5B2418]/10 active:scale-95 transition-all cursor-pointer relative"
            >
              <ShoppingCart className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        </header>

        {/* Menu Lateral Drawer */}
        <SideMenuDrawer
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onLogout={onLogout}
          onNavigateHome={() => {
            setTelaAtual('vitrine');
            setMenuOpen(false);
          }}
          onNavigateMinhasCompras={() => {
            setMenuOpen(false);
            if (onNavigate) onNavigate('/cliente/pedidos');
          }}
          onNavigateEditarCadastro={() => {
            setMenuOpen(false);
            if (onNavigate) onNavigate('/cliente/perfil');
          }}
        />

        {/* =========================================================================
            CONTEÚDO DINÂMICO: VITRINE OU CARRINHO
           ========================================================================= */}
        {telaAtual === 'carrinho' ? (
          /* =======================================================================
             TELA DO CARRINHO (Navegação Provisória)
             ======================================================================= */
          <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F8C8CE] text-[#5B2418] flex items-center justify-center mb-4 shadow-inner">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#5B2418] mb-2">
              Carrinho
            </h2>
            <p className="text-sm text-zinc-600 mb-6 max-w-xs">
              Seu carrinho está vazio no momento. Adicione delícias do nosso cardápio!
            </p>
            <button
              type="button"
              onClick={() => setTelaAtual('vitrine')}
              className="flex items-center gap-2 bg-[#5B2418] hover:bg-[#481c13] text-white font-bold py-3 px-6 rounded-full shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à vitrine</span>
            </button>
          </main>
        ) : (
          /* =======================================================================
             TELA DA VITRINE
             ======================================================================= */
          <main className="flex-1 flex flex-col pb-28">
            {/* Mensagem de Erro com Ação de Recarregar */}
            {errorMessage && (
              <div className="mx-4 my-2 p-3 bg-red-100 border border-red-300 rounded-xl text-xs text-red-700 flex items-center justify-between">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => void carregarDados()}
                  className="flex items-center gap-1 font-bold underline cursor-pointer text-red-800 ml-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tentar de novo</span>
                </button>
              </div>
            )}

            {/* Loading Indicator */}
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-3 border-[#5B2418]/20 border-t-[#5B2418] rounded-full animate-spin" />
                <p className="text-xs font-semibold text-[#5B2418]">
                  Carregando vitrine...
                </p>
              </div>
            ) : (
              <>
                {/* 1. Carrossel de Categorias */}
                <CategoriasCarousel
                  categorias={categorias}
                  categoriaSelecionadaId={categoriaSelecionadaId}
                  onSelectCategoria={(cat) => {
                    setCategoriaSelecionadaId((prev) =>
                      prev === cat.id_categoria ? null : cat.id_categoria
                    );
                  }}
                />

                {/* 2. Lista Vertical de Produtos */}
                <ListaProdutosCliente
                  produtos={produtosExibicao}
                  titulo={
                    categoriaSelecionadaId
                      ? `Produtos em ${
                          categorias.find((c) => c.id_categoria === categoriaSelecionadaId)
                            ?.nome_categoria ?? 'Categoria'
                        }`
                      : 'Nosso Cardápio'
                  }
                  onAdicionarAoCarrinho={(_prod) => {
                    setTelaAtual('carrinho');
                  }}
                />
              </>
            )}
          </main>
        )}

        {/* =========================================================================
            BOTÃO INFERIOR FIXO/FLUTUANTE: "Status pedido ..."
            Exibido exclusivamente se o cliente possuir um pedido ativo
           ========================================================================= */}
        {temPedidoAtivo && (
          <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-6 pointer-events-none z-20 flex justify-center">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/cliente/pedidos')}
              className="w-60 max-w-[68%] mx-auto py-3 px-6 rounded-full bg-[#5B2418] hover:bg-[#481c13] text-white font-semibold text-sm text-center shadow-lg pointer-events-auto transition-transform active:scale-98 cursor-pointer select-none truncate"
            >
              Status pedido ...
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeCliente;
