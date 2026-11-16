import { useState, useEffect, useCallback, useRef } from 'react';
import type { FC, MouseEvent } from 'react';
import { X } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { pedidoService, formatarNomeCliente, formatarStatus } from '../services/pedidoService';
import { isApiError, getApiErrorMessage } from '../services/api';
import type { Pedido } from '../types/pedido';

interface AdminProps {
  onLogout?: () => void;
  onNavigate?: (path: string) => void;
}

export const AdminPage: FC<AdminProps> = ({ onLogout, onNavigate }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Estado do modal de ação no pedido
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
  const [loadingAcao, setLoadingAcao] = useState<boolean>(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const carregarPedidos = useCallback(async () => {
    setLoading(true);
    setFeedbackError(null);
    abortControllerRef.current = new AbortController();

    try {
      const data = await pedidoService.listarTodos(abortControllerRef.current.signal);
      // Filtro da fila: exibe apenas os pedidos com status 'aguardando' ou 'em_preparo'
      const listaFila = Array.isArray(data)
        ? data.filter((p) => p.status === 'aguardando' || p.status === 'em_preparo')
        : [];
      setPedidos(listaFila);
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        setFeedbackError(getApiErrorMessage(err, 'Erro ao carregar a fila de pedidos.'));
      } else if (err instanceof Error) {
        if (err.name !== 'AbortError') {
          setFeedbackError(err.message);
        }
      } else {
        setFeedbackError('Erro inesperado ao listar pedidos.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Prevenção de vazamento de memória (Memory Leak) ao desmontar tela
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarPedidos();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [carregarPedidos]);

  // Abre modal com o pedido selecionado
  const handleCardClick = (pedido: Pedido) => {
    setErrorModal(null);
    setPedidoSelecionado(pedido);
  };

  // Fecha modal ao clicar fora ou no botão fechar
  const handleCloseModal = () => {
    if (loadingAcao) return;
    setPedidoSelecionado(null);
    setErrorModal(null);
  };

  // Impede fechamento ao clicar dentro do card do modal
  const handleModalContentClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  // Ação de avançar status do pedido
  const handleAvancar = async () => {
    if (!pedidoSelecionado) return;
    setLoadingAcao(true);
    setErrorModal(null);

    const id = pedidoSelecionado.id_pedido;
    const proximoStatus = pedidoSelecionado.status === 'aguardando' ? 'em_preparo' : 'pronto';

    try {
      await pedidoService.atualizarStatus(id, proximoStatus);

      if (proximoStatus === 'em_preparo') {
        // Atualiza o status do card na tela para 'em_preparo'
        setPedidos((prev) =>
          prev.map((p) => (p.id_pedido === id ? { ...p, status: 'em_preparo' } : p))
        );
      } else {
        // Pedido avançado para 'pronto': remove da fila imediatamente
        setPedidos((prev) => prev.filter((p) => p.id_pedido !== id));
      }

      setPedidoSelecionado(null);
    } catch (err: unknown) {
      setErrorModal(getApiErrorMessage(err, 'Erro ao avançar status do pedido.'));
    } finally {
      setLoadingAcao(false);
    }
  };

  // Ação de cancelar pedido
  const handleCancelar = async () => {
    if (!pedidoSelecionado) return;
    setLoadingAcao(true);
    setErrorModal(null);

    const id = pedidoSelecionado.id_pedido;

    try {
      await pedidoService.atualizarStatus(id, 'cancelado');
      // Remove da fila imediatamente
      setPedidos((prev) => prev.filter((p) => p.id_pedido !== id));
      setPedidoSelecionado(null);
    } catch (err: unknown) {
      setErrorModal(getApiErrorMessage(err, 'Erro ao cancelar o pedido.'));
    } finally {
      setLoadingAcao(false);
    }
  };

  return (
    <AdminLayout activeItem="home" onLogout={onLogout} onNavigate={onNavigate}>
      <div className="w-full flex flex-col flex-1">
        {/* Título da tela */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
            Fila de pedidos
          </h1>
        </div>

        {/* Mensagem de Erro geral se houver */}
        {feedbackError && (
          <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between">
            <span>{feedbackError}</span>
            <button
              type="button"
              onClick={() => void carregarPedidos()}
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
            <span className="text-sm font-medium text-zinc-600">Carregando pedidos...</span>
          </div>
        )}

        {/* Estado de Fila Vazia */}
        {!loading && pedidos.length === 0 && !feedbackError && (
          <div className="py-20 px-4 text-center max-w-md mx-auto flex flex-col items-center justify-center">
            <p className="text-zinc-600 text-base sm:text-lg font-medium leading-relaxed">
              Nenhum pedido na fila no momento.
            </p>
          </div>
        )}

        {/* Grid de Pedidos (2 colunas no desktop) */}
        {!loading && pedidos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {pedidos.map((pedido) => {
              const observacoesValidas = (pedido.produto_pedido || []).filter(
                (item) => item.observacao && item.observacao.trim().length > 0
              );

              const isAguardando = pedido.status === 'aguardando';

              return (
                <div
                  key={pedido.id_pedido}
                  onClick={() => handleCardClick(pedido)}
                  className="bg-[#D9D9D9] rounded-2xl p-6 cursor-pointer hover:brightness-95 transition shadow-xs flex flex-col justify-between select-none"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(pedido);
                    }
                  }}
                  aria-label={`Pedido de ${formatarNomeCliente(pedido.usuario?.nome_completo)}`}
                >
                  <div>
                    {/* 1. Cabeçalho do card: Nome do cliente (esquerda) e Badge de Status (direita) */}
                    <div className="flex justify-between items-center mb-4 gap-2">
                      <span className="font-bold text-lg sm:text-xl text-black truncate">
                        {formatarNomeCliente(pedido.usuario?.nome_completo)}
                      </span>

                      <span
                        className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-full shadow-xs shrink-0 ${
                          isAguardando
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}
                      >
                        {formatarStatus(pedido.status)}
                      </span>
                    </div>

                    {/* 2. Lista de produtos do pedido */}
                    <div className="flex flex-col gap-2 py-3 border-y border-black/10">
                      {(pedido.produto_pedido || []).map((item) => (
                        <div
                          key={item.id_produto_pedido}
                          className="flex justify-between items-center text-sm sm:text-base font-medium text-black"
                        >
                          <span className="truncate pr-3">
                            {item.produto?.nome_produto || 'Produto'}
                          </span>
                          <span className="shrink-0 font-bold text-zinc-900">{item.quant}x</span>
                        </div>
                      ))}
                    </div>

                    {/* 3. Seção Observações */}
                    <div className="mt-4 text-sm text-black">
                      <span className="font-bold block mb-1">Observações</span>
                      {observacoesValidas.length > 0 ? (
                        <div className="flex flex-col gap-1 text-zinc-800">
                          {observacoesValidas.map((item) => (
                            <p
                              key={item.id_produto_pedido}
                              className="text-xs sm:text-sm leading-relaxed"
                            >
                              <span className="font-semibold">
                                {item.produto?.nome_produto || 'Produto'}:
                              </span>{' '}
                              {item.observacao}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-600 text-xs sm:text-sm italic">
                          Nenhuma observação.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Popup de Ação ao Clicar no Card (Overlay escuro, fecha ao clicar fora) */}
        {pedidoSelecionado && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-pedido-title"
            onClick={handleCloseModal}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          >
            <div
              onClick={handleModalContentClick}
              className="bg-[#D9D9D9] rounded-2xl md:rounded-3xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl text-center"
            >
              {/* Botão X de fechar */}
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={loadingAcao}
                aria-label="Fechar modal"
                className="absolute top-5 right-5 bg-white rounded-full w-9 h-9 flex items-center justify-center text-black hover:bg-zinc-100 shadow transition-transform hover:scale-105 cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5 text-black stroke-[2.5]" />
              </button>

              {/* Nome do Cliente */}
              <p className="text-sm font-bold text-zinc-600 uppercase tracking-wider mb-2">
                {formatarNomeCliente(pedidoSelecionado.usuario?.nome_completo)}
              </p>

              {/* Pergunta dinâmica conforme o status atual */}
              <h2
                id="modal-pedido-title"
                className="text-xl sm:text-2xl font-extrabold text-black mb-6 px-4"
              >
                {pedidoSelecionado.status === 'aguardando'
                  ? 'Deseja avançar o pedido para Em preparo?'
                  : 'Deseja avançar o pedido para Pronto?'}
              </h2>

              {/* Feedback de erro no modal */}
              {errorModal && (
                <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-xl text-xs font-medium">
                  {errorModal}
                </div>
              )}

              {/* Botões de Ação: Cancelar e Avançar */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  type="button"
                  disabled={loadingAcao}
                  onClick={() => void handleCancelar()}
                  className="bg-white hover:bg-red-50 text-red-700 border border-red-200 font-bold text-base sm:text-lg py-2.5 px-6 rounded-xl shadow-xs transition-all cursor-pointer min-w-[120px] active:scale-[0.98] disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={loadingAcao}
                  onClick={() => void handleAvancar()}
                  className="bg-[#5B2418] hover:bg-[#471c13] text-white font-bold text-base sm:text-lg py-2.5 px-6 rounded-xl shadow-xs transition-all cursor-pointer min-w-[120px] active:scale-[0.98] disabled:opacity-50"
                >
                  {loadingAcao ? 'Atualizando...' : 'Avançar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPage;
