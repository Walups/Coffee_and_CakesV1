import { useState, useEffect, useCallback, useRef } from 'react';
import type { FC } from 'react';
import { Trash2 } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { CategoriaModal } from '../components/CategoriaModal';
import { categoriaService } from '../services/categoriaService';
import { isApiError, getApiErrorMessage } from '../services/api';
import type { Categoria } from '../types/categoria';

interface CategoriasPageProps {
  onLogout?: () => void;
  onNavigate?: (path: string) => void;
}

export const CategoriasPage: FC<CategoriasPageProps> = ({ onLogout, onNavigate }) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [categoriaParaEditar, setCategoriaParaEditar] = useState<Categoria | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const carregarCategorias = useCallback(async () => {
    setLoading(true);
    setFeedbackError(null);
    abortControllerRef.current = new AbortController();

    try {
      const data = await categoriaService.listar(abortControllerRef.current.signal);
      // Filtra para exibir apenas categorias ativas (active !== false)
      const listaAtivas = Array.isArray(data)
        ? data.filter((cat) => cat.active !== false)
        : [];
      setCategorias(listaAtivas);
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        setFeedbackError(getApiErrorMessage(err, 'Erro ao carregar categorias.'));
      } else if (err instanceof Error) {
        if (err.name !== 'AbortError') {
          setFeedbackError(err.message);
        }
      } else {
        setFeedbackError('Erro inesperado ao listar categorias.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Prevenção de vazamento de memória (Memory Leak) ao desmontar a tela
  useEffect(() => {
    void carregarCategorias();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [carregarCategorias]);

  const handleOpenCreateModal = () => {
    setCategoriaParaEditar(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat: Categoria) => {
    setCategoriaParaEditar(cat);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCategoriaParaEditar(null);
  };

  const handleModalSuccess = () => {
    void carregarCategorias();
  };

  const handleSoftDelete = async (cat: Categoria) => {
    const confirmar = window.confirm(
      `Deseja realmente desativar a categoria "${cat.nome_categoria}"?`
    );
    if (!confirmar) return;

    try {
      await categoriaService.softDelete(cat.id_categoria);
      void carregarCategorias();
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, 'Erro ao desativar categoria. Tente novamente.'));
    }
  };

  const formatDesconto = (valor?: number | null): string => {
    if (valor === undefined || valor === null || valor === 0) {
      return '0%';
    }
    const perc = Math.round(valor * 100);
    return `${perc}%`;
  };

  return (
    <AdminLayout activeItem="categorias" onLogout={onLogout} onNavigate={onNavigate}>
      <div className="w-full flex flex-col flex-1">
        {/* Cabeçalho da página: Título e Botão Nova categoria */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
            Categorias Cadastradas
          </h1>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="self-start sm:self-auto bg-[#D9D9D9] hover:bg-[#c9c9c9] text-black font-extrabold text-base sm:text-lg px-6 py-2 rounded-xl sm:rounded-2xl shadow-xs transition-colors cursor-pointer select-none active:scale-[0.98]"
          >
            Nova categoria
          </button>
        </div>

        {/* Mensagem de Erro geral se houver */}
        {feedbackError && (
          <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between">
            <span>{feedbackError}</span>
            <button
              type="button"
              onClick={() => void carregarCategorias()}
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
            <span className="text-sm font-medium text-zinc-600">Carregando categorias...</span>
          </div>
        )}

        {/* Estado de Lista Vazia */}
        {!loading && categorias.length === 0 && !feedbackError && (
          <div className="py-20 px-4 text-center max-w-md mx-auto flex flex-col items-center justify-center">
            <p className="text-zinc-600 text-base sm:text-lg font-medium leading-relaxed">
              Nenhuma categoria cadastrada até o momento. Clique em{' '}
              <span className="font-bold text-zinc-900">'Nova categoria'</span> para adicionar a
              primeira.
            </p>
          </div>
        )}

        {/* Listagem Estritamente Dinâmica */}
        {!loading && categorias.length > 0 && (
          <div className="flex flex-col gap-3 sm:gap-4 w-full">
            {categorias.map((cat) => (
              <div
                key={cat.id_categoria}
                className="bg-[#D9D9D9] rounded-xl sm:rounded-2xl px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-xs transition-all hover:bg-[#cecece]"
              >
                {/* Nome da Categoria */}
                <span className="text-black font-semibold text-base sm:text-lg truncate max-w-[45%]">
                  {cat.nome_categoria}
                </span>

                {/* Desconto Cadastrado */}
                <span className="text-black font-medium text-sm sm:text-base text-center min-w-[70px]">
                  {formatDesconto(cat.desconto_categoria)}
                </span>

                {/* Ações: Editar e Soft Delete */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(cat)}
                    className="bg-white hover:bg-zinc-100 text-black font-semibold text-sm sm:text-base px-5 sm:px-6 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer select-none active:scale-95"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleSoftDelete(cat)}
                    title="Desativar categoria"
                    aria-label={`Desativar categoria ${cat.nome_categoria}`}
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
        <CategoriaModal
          isOpen={modalOpen}
          categoriaParaEditar={categoriaParaEditar}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
        />
      </div>
    </AdminLayout>
  );
};

export default CategoriasPage;
