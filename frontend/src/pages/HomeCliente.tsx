import { useState, useEffect, useRef, useCallback } from 'react';
import type { FC } from 'react';
import { Menu, ShoppingCart, RefreshCw, Check } from 'lucide-react';
import { SideMenuDrawer } from '../components/SideMenuDrawer';
import { CategoriasCarousel } from '../components/CategoriasCarousel';
import { ListaProdutosCliente } from '../components/ListaProdutosCliente';
import { CarrinhoCliente } from '../components/CarrinhoCliente';
import { StatusPedidosModal } from '../components/StatusPedidosModal';
import { produtoService } from '../services/produtoService';
import { categoriaService } from '../services/categoriaService';
import { pedidoService } from '../services/pedidoService';
import { isApiError, getApiErrorMessage } from '../services/api';
import { useCart } from '../contexts/CartContext';
import type { Produto } from '../types/produto';
import type { Categoria } from '../types/categoria';
import logoImg from '../assets/Logo.png';

interface HomeClienteProps {
  onLogout?: () => void;
  onNavigate?: (path: string) => void;
  initialAbrirPedidos?: boolean;
}

export const HomeCliente: FC<HomeClienteProps> = ({
  onLogout,
  onNavigate,
  initialAbrirPedidos = false,
}) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Controle do Menu Lateral
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // Controle do Modal de Status de Pedidos
  const [modalStatusPedidosAberto, setModalStatusPedidosAberto] = useState<boolean>(initialAbrirPedidos);

  // Navegação provisória interna do carrinho
  const [telaAtual, setTelaAtual] = useState<'vitrine' | 'carrinho'>('vitrine');

  // Categoria selecionada no carrossel (opcional para filtro visual)
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState<string | null>(null);

  // Indica se o cliente possui um pedido ativo em andamento
  const [temPedidoAtivo, setTemPedidoAtivo] = useState<boolean>(false);

  // Contexto Global de Carrinho
  const { totalItens, addItem } = useCart();

  // Feedback visual rápido ao adicionar item ao carrinho
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleAdicionarAoCarrinho = useCallback(
    (produto: Produto) => {
      const temDesconto =
        typeof produto.desconto_produto === 'number' &&
        produto.desconto_produto > 0;
      const precoFinal = temDesconto
        ? (produto.desconto_produto! < 1
            ? produto.preco * (1 - produto.desconto_produto!)
            : Math.max(0, produto.preco - produto.desconto_produto!))
        : produto.preco;

      addItem({
        produtoId: produto.id_produto,
        nome: produto.nome_produto,
        imagem: produto.imagem_produto || '',
        precoOriginal: produto.preco,
        precoUnitario: Number(precoFinal.toFixed(2)),
        quantidade: 1,
        observacoes: '',
      });

      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      setToastMessage(`${produto.nome_produto} adicionado ao carrinho!`);
      toastTimeoutRef.current = setTimeout(() => {
        setToastMessage(null);
      }, 2500);
    },
    [addItem]
  );

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarDados();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [carregarDados]);

  // Produtos para a lista vertical (podem ser filtrados pela categoria selecionada caso haja seleção)
  const produtosExibicao = categoriaSelecionadaId
    ? produtos.filter((p) => {
        const catId = categoriaSelecionadaId.trim().toLowerCase();
        if (p.id_categoria && p.id_categoria.trim().toLowerCase() === catId) return true;
        if (
          Array.isArray(p.categoria_x_produto) &&
          p.categoria_x_produto.some(
            (cxp) => cxp.id_categoria && cxp.id_categoria.trim().toLowerCase() === catId
          )
        ) {
          return true;
        }
        return false;
      })
    : produtos;

  return (
    <div className="h-screen h-[100dvh] w-full bg-[#F5D8C7] flex justify-center overflow-hidden">
      {/* Container mobile-first de tela única com altura fixa */}
      <div className="w-full max-w-md h-full bg-[#FCE8DC] flex flex-col relative shadow-2xl overflow-hidden">
        {/* =========================================================================
            HEADER SUPERIOR FIXO: Fundo rosado (#F8C8CE)
           ========================================================================= */}
        <header className="w-full bg-[#F8C8CE] px-4 py-3 shadow-xs shrink-0 z-30">
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
              {totalItens > 0 && (
                <span
                  data-testid="badge-carrinho"
                  className="absolute -top-1 -right-1 bg-[#5B2418] text-[#FCE8DC] text-[10px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center border-2 border-[#F8C8CE] shadow-xs"
                >
                  {totalItens > 99 ? '99+' : totalItens}
                </span>
              )}
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
            setModalStatusPedidosAberto(true);
          }}
          onNavigateEditarCadastro={() => {
            setMenuOpen(false);
            if (onNavigate) onNavigate('/perfil');
          }}
        />

        {/* =========================================================================
            CONTEÚDO DINÂMICO: VITRINE OU CARRINHO
           ========================================================================= */}
        {telaAtual === 'carrinho' ? (
          <CarrinhoCliente
            onVoltar={() => {
              setTelaAtual('vitrine');
              void carregarDados();
            }}
          />
        ) : (
          /* =======================================================================
             TELA DA VITRINE: Categorias FIXAS e Scroll EXCLUSIVO nos Produtos
             ======================================================================= */
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Mensagem de Erro com Ação de Recarregar */}
            {errorMessage && (
              <div className="shrink-0 mx-4 my-2 p-3 bg-red-100 border border-red-300 rounded-xl text-xs text-red-700 flex items-center justify-between">
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
                {/* 1. Carrossel de Categorias FIXO no topo (logo abaixo do header) */}
                <div className="shrink-0 w-full bg-[#FCE8DC] z-10 border-b border-[#5B2418]/10 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                  <CategoriasCarousel
                    categorias={categorias}
                    categoriaSelecionadaId={categoriaSelecionadaId}
                    onSelectCategoria={(cat) => {
                      setCategoriaSelecionadaId((prev) =>
                        prev === cat.id_categoria ? null : cat.id_categoria
                      );
                    }}
                  />
                </div>

                {/* 2. Lista Vertical de Produtos com SCROLL INDEPENDENTE */}
                <main className="flex-1 min-h-0 overflow-y-auto pb-28">
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
                    onLimparFiltro={
                      categoriaSelecionadaId
                        ? () => setCategoriaSelecionadaId(null)
                        : undefined
                    }
                    onAdicionarAoCarrinho={handleAdicionarAoCarrinho}
                  />
                </main>
              </>
            )}
          </div>
        )}

        {/* Feedback visual rápido (Toast com animação) ao adicionar item */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#5B2418] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce max-w-[90%] pointer-events-none"
          >
            <Check className="w-4 h-4 text-emerald-300 shrink-0 stroke-[2.5]" />
            <span className="truncate">{toastMessage}</span>
          </div>
        )}

        {/* =========================================================================
            BOTÃO INFERIOR FIXO/FLUTUANTE: "Status pedido ..."
            Exibido exclusivamente se o cliente possuir um pedido ativo
           ========================================================================= */}
        {temPedidoAtivo && (
          <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-6 pointer-events-none z-20 flex justify-center">
            <button
              type="button"
              data-testid="btn-status-pedido"
              onClick={() => setModalStatusPedidosAberto(true)}
              className="w-60 max-w-[68%] mx-auto py-3 px-6 rounded-full bg-[#5B2418] hover:bg-[#481c13] text-white font-semibold text-sm text-center shadow-lg pointer-events-auto transition-transform active:scale-98 cursor-pointer select-none truncate flex items-center justify-center gap-2"
            >
              <span>Status pedido ...</span>
            </button>
          </div>
        )}

        {/* Modal Interativo de Acompanhamento de Pedidos em Tempo Real */}
        <StatusPedidosModal
          isOpen={modalStatusPedidosAberto}
          onClose={() => {
            setModalStatusPedidosAberto(false);
            void carregarDados();
          }}
          onNavigateVitrine={() => {
            setModalStatusPedidosAberto(false);
            setTelaAtual('vitrine');
            void carregarDados();
          }}
        />
      </div>
    </div>
  );
};

export default HomeCliente;
