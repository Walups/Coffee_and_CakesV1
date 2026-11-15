import { useState, useEffect, useCallback, useRef } from 'react';
import type { FC } from 'react';
import { Trash2 } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { ProdutoModal } from '../components/ProdutoModal';
import { produtoService, formatMoeda } from '../services/produtoService';
import { isApiError, getApiErrorMessage } from '../services/api';
import type { Produto } from '../types/produto';

interface ProdutosPageProps {
  onLogout?: () => void;
  onNavigate?: (path: string) => void;
}

export const ProdutosPage: FC<ProdutosPageProps> = ({ onLogout, onNavigate }) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState<Produto | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const carregarProdutos = useCallback(async () => {
    setLoading(true);
    setFeedbackError(null);
    abortControllerRef.current = new AbortController();

    try {
      const data = await produtoService.listar(abortControllerRef.current.signal);
      // Filtra para exibir exclusivamente produtos ativos (active !== false)
      const listaAtivos = Array.isArray(data)
        ? data.filter((prod) => prod.active !== false)
        : [];
      setProdutos(listaAtivos);
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        setFeedbackError(getApiErrorMessage(err, 'Erro ao carregar produtos.'));
      } else if (err instanceof Error) {
        if (err.name !== 'AbortError') {
          setFeedbackError(err.message);
        }
      } else {
        setFeedbackError('Erro inesperado ao listar produtos.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Prevenção de vazamento de memória (Memory Leak) ao desmontar a tela
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarProdutos();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [carregarProdutos]);

  const handleOpenCreateModal = () => {
    setProdutoParaEditar(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (prod: Produto) => {
    setProdutoParaEditar(prod);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setProdutoParaEditar(null);
  };

  const handleModalSuccess = () => {
    void carregarProdutos();
  };

  const handleSoftDelete = async (prod: Produto) => {
    const confirmar = window.confirm(
      `Deseja realmente desativar o produto "${prod.nome_produto}"?`
    );
    if (!confirmar) return;

    try {
      await produtoService.softDelete(prod.id_produto);
      void carregarProdutos();
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, 'Erro ao desativar produto. Tente novamente.'));
    }
  };

  return (
    <AdminLayout activeItem="produtos" onLogout={onLogout} onNavigate={onNavigate}>
      <div className="w-full flex flex-col flex-1">
        {/* Cabeçalho da página: Título e Botão Novo produto */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
            Produtos cadastrados
          </h1>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="self-start sm:self-auto bg-[#D9D9D9] hover:bg-[#c9c9c9] text-black font-extrabold text-base sm:text-lg px-6 py-2 rounded-xl sm:rounded-2xl shadow-xs transition-colors cursor-pointer select-none active:scale-[0.98]"
          >
            Novo produto
          </button>
        </div>

        {/* Mensagem de Erro geral se houver */}
        {feedbackError && (
          <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between">
            <span>{feedbackError}</span>
            <button
              type="button"
              onClick={() => void carregarProdutos()}
              className="underline font-bold text-xs uppercase cursor-pointer hover:text-red-900 ml-4"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Estado de Carregamento Discreto */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center text-zinc-500 gap-3">
            <div className="w-7 h-7 border-3 border-zinc-300 border-t-[#5B2418] rounded-full animate-spin" />
            <span className="text-sm font-medium text-zinc-600">Carregando produtos...</span>
          </div>
        )}

        {/* Estado de Lista Vazia */}
        {!loading && produtos.length === 0 && !feedbackError && (
          <div className="py-20 px-4 text-center max-w-md mx-auto flex flex-col items-center justify-center">
            <p className="text-zinc-600 text-base sm:text-lg font-medium leading-relaxed">
              Nenhum produto cadastrado até o momento. Clique em{' '}
              <span className="font-bold text-zinc-900">'Novo produto'</span> para adicionar o
              primeiro.
            </p>
          </div>
        )}

        {/* Listagem Estritamente Dinâmica */}
        {!loading && produtos.length > 0 && (
          <div className="flex flex-col gap-3 sm:gap-4 w-full">
            {produtos.map((prod) => (
              <div
                key={prod.id_produto}
                className="bg-[#D9D9D9] rounded-xl sm:rounded-2xl px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-xs transition-all hover:bg-[#cecece]"
              >
                {/* Nome do Produto */}
                <span className="text-black font-semibold text-base sm:text-lg truncate max-w-[45%]">
                  {prod.nome_produto}
                </span>

                {/* Preço Formatado em Moeda Brasileira (R$ 0,00) */}
                <span className="text-black font-medium text-sm sm:text-base text-center min-w-[90px]">
                  {formatMoeda(prod.preco)}
                </span>

                {/* Ações: Editar e Soft Delete */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(prod)}
                    className="bg-white hover:bg-zinc-100 text-black font-semibold text-sm sm:text-base px-5 sm:px-6 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer select-none active:scale-95"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleSoftDelete(prod)}
                    title="Desativar produto"
                    aria-label={`Desativar produto ${prod.nome_produto}`}
                    className="p-1 text-black hover:text-red-600 transition-colors cursor-pointer select-none"
                  >
                    <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Reutilizável de Criar / Editar */}
        <ProdutoModal
          isOpen={modalOpen}
          produtoParaEditar={produtoParaEditar}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
        />
      </div>
    </AdminLayout>
  );
};

export default ProdutosPage;
