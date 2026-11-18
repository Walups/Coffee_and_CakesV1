import { useState, useEffect, useRef, useCallback } from 'react';
import type { FC } from 'react';
import { X, RefreshCw, ShoppingBag, Clock, AlertCircle, Package } from 'lucide-react';
import { pedidoService, formatarStatus } from '../services/pedidoService';
import { formatMoeda } from '../services/produtoService';
import { isApiError, getApiErrorMessage } from '../services/api';
import type { Pedido, StatusPedido } from '../types/pedido';

export interface StatusPedidosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateVitrine?: () => void;
}

export function formatarDataHora(dataIso?: string): string {
  if (!dataIso) return 'Data não informada';
  try {
    const data = new Date(dataIso);
    if (Number.isNaN(data.getTime())) return 'Data não informada';
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Data não informada';
  }
}

export function formatarNumeroCurto(idPedido: string): string {
  if (!idPedido) return '#CC-0000';
  if (idPedido.startsWith('#')) return idPedido;
  const limpo = idPedido.replace(/-/g, '');
  return `#CC-${limpo.slice(0, 4).toUpperCase()}`;
}

export function getStatusBadgeStyle(status: StatusPedido | string): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  const norm = status ? String(status).toLowerCase().replace(/\s+/g, '_') : '';
  switch (norm) {
    case 'aguardando':
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        border: 'border-amber-300',
        label: 'Aguardando',
      };
    case 'em_preparo':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-300',
        label: 'Em preparo',
      };
    case 'pronto':
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-800',
        border: 'border-emerald-300',
        label: 'Pronto',
      };
    case 'entregue':
      return {
        bg: 'bg-teal-100',
        text: 'text-teal-800',
        border: 'border-teal-300',
        label: 'Entregue',
      };
    case 'cancelado':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
        label: 'Cancelado',
      };
    default:
      return {
        bg: 'bg-zinc-100',
        text: 'text-zinc-800',
        border: 'border-zinc-300',
        label: formatarStatus(status as StatusPedido),
      };
  }
}

export const StatusPedidosModal: FC<StatusPedidosModalProps> = ({
  isOpen,
  onClose,
  onNavigateVitrine,
}) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const carregarPedidos = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setRefreshing(true);
      setErrorMessage(null);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const data = await pedidoService.listarMeus(signal);
      // Ordena pelos mais recentes primeiro
      const ordenados = Array.isArray(data)
        ? [...data].sort((a, b) => {
            const timeA = a.created_at || a.criado_em ? new Date(a.created_at || a.criado_em!).getTime() : 0;
            const timeB = b.created_at || b.criado_em ? new Date(b.created_at || b.criado_em!).getTime() : 0;
            return timeB - timeA;
          })
        : [];
      setPedidos(ordenados);
    } catch (err: unknown) {
      if (isApiError(err) && (err.name === 'CanceledError' || err.name === 'AbortError')) return;
      if (!isSilent) {
        setErrorMessage(getApiErrorMessage(err, 'Erro ao carregar o status dos pedidos.'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    void carregarPedidos(false);

    // Polling a cada 8 segundos para atualizar em tempo real quando o admin alterar status
    pollingTimerRef.current = setInterval(() => {
      void carregarPedidos(true);
    }, 8000);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [isOpen, carregarPedidos]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-status-pedidos"
      data-testid="modal-status-pedidos"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-[#FDE5D7] rounded-3xl p-5 shadow-2xl flex flex-col max-h-[88vh] border border-[#5C2A14]/15 relative">
        {/* Topo do Modal: Título, Botão de Atualizar e Fechar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#5C2A14]/15 shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#5C2A14]" />
            <h2 id="titulo-status-pedidos" className="text-lg font-extrabold text-[#5C2A14]">
              Status dos Pedidos
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              data-testid="btn-recarregar-status"
              aria-label="Atualizar status dos pedidos"
              onClick={() => void carregarPedidos(false)}
              disabled={refreshing}
              className="p-1.5 rounded-xl text-[#5C2A14] hover:bg-[#5C2A14]/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="Atualizar em tempo real"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              data-testid="btn-fechar-modal-pedidos"
              aria-label="Fechar"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-600 hover:text-[#5C2A14] hover:bg-[#5C2A14]/10 active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mensagem de Erro (se houver) */}
        {errorMessage && (
          <div
            role="alert"
            data-testid="erro-status-pedidos"
            className="my-3 p-3 bg-red-100 border border-red-300 rounded-xl text-xs text-red-800 flex items-center justify-between shrink-0"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => void carregarPedidos(false)}
              className="font-bold underline text-red-800 hover:text-red-900 cursor-pointer ml-2"
            >
              Tentar de novo
            </button>
          </div>
        )}

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#5C2A14]">
              <div className="w-7 h-7 border-3 border-[#5C2A14]/20 border-t-[#5C2A14] rounded-full animate-spin" />
              <p className="text-xs font-semibold">Buscando seus pedidos...</p>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4">
              <div className="w-14 h-14 rounded-full bg-[#F8C8CE] text-[#5C2A14] flex items-center justify-center mb-3 shadow-inner">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-sm text-[#5C2A14] mb-1">
                Nenhum pedido encontrado
              </h3>
              <p className="text-xs text-zinc-600 max-w-xs mb-4">
                Você ainda não realizou nenhum pedido. Escolha delícias em nosso cardápio e finalize sua compra!
              </p>
              {onNavigateVitrine && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateVitrine();
                  }}
                  className="bg-[#5C2A14] hover:bg-[#481c13] text-white text-xs font-bold py-2.5 px-5 rounded-full shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  Ver Cardápio
                </button>
              )}
            </div>
          ) : (
            pedidos.map((pedido) => {
              const badge = getStatusBadgeStyle(pedido.status);
              const dataFormatada = formatarDataHora(pedido.created_at || pedido.criado_em);
              const numeroCurto = formatarNumeroCurto(pedido.id_pedido);

              return (
                <div
                  key={pedido.id_pedido}
                  data-testid={`card-pedido-${pedido.id_pedido}`}
                  className="bg-white/95 rounded-2xl p-4 shadow-sm border border-[#5C2A14]/10 transition-shadow hover:shadow-md"
                >
                  {/* Topo do Card: Número do pedido e Badge de Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-[#5C2A14] shrink-0" />
                        <span className="font-extrabold text-sm text-[#5C2A14] tracking-wide truncate">
                          {numeroCurto}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">
                        {dataFormatada}
                      </span>
                    </div>

                    {/* Badge Visual Colorido para o Status */}
                    <span
                      data-testid={`badge-status-${pedido.id_pedido}`}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Linha Divisória Suave */}
                  <div className="border-t border-zinc-100 my-2" />

                  {/* Lista de Itens do Pedido */}
                  <div className="space-y-1 mb-2.5">
                    <span className="text-[11px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Itens do pedido
                    </span>
                    <ul className="space-y-1 text-xs text-zinc-700">
                      {Array.isArray(pedido.produto_pedido) && pedido.produto_pedido.length > 0 ? (
                        pedido.produto_pedido.map((item, idx) => (
                          <li
                            key={item.id_produto_pedido || `${pedido.id_pedido}-item-${idx}`}
                            className="flex items-start justify-between gap-2"
                          >
                            <span className="min-w-0 truncate">
                              <strong className="text-zinc-900 font-bold">{item.quant}x</strong>{' '}
                              {item.produto?.nome_produto || 'Item do cardápio'}
                              {item.observacao && (
                                <span className="text-[11px] text-zinc-500 italic block pl-4">
                                  Obs: {item.observacao}
                                </span>
                              )}
                            </span>
                            {typeof item.valor_produto_pedido === 'number' && (
                              <span className="text-zinc-600 font-semibold shrink-0">
                                {formatMoeda(item.valor_produto_pedido * item.quant)}
                              </span>
                            )}
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-zinc-500 italic">Itens sob processamento</li>
                      )}
                    </ul>
                  </div>

                  {/* Rodapé do Card: Forma de pagamento e Total */}
                  <div className="border-t border-zinc-100 pt-2 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-500">
                      {pedido.forma_pagamento ? `Pagamento: ${pedido.forma_pagamento}` : 'Pagamento no balcão'}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-zinc-500 text-[11px]">Total:</span>
                      <span className="font-extrabold text-[#5C2A14] text-sm">
                        {typeof pedido.valor_total === 'number'
                          ? formatMoeda(pedido.valor_total)
                          : 'R$ 0,00'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé Fixo do Modal */}
        <div className="pt-3 border-t border-[#5C2A14]/15 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#5C2A14] hover:bg-[#481c13] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs active:scale-98 transition-all cursor-pointer text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusPedidosModal;
