/**
 * @module pedidoService
 *
 * Todas as chamadas HTTP utilizam EXCLUSIVAMENTE a instância centralizada `api`
 * exportada por `frontend/src/services/api.ts`.
 *
 * Essa instância possui um interceptor de requisições que injeta automaticamente
 * o header `Authorization: Bearer <token>` em todas as requisições quando o token
 * JWT estiver presente no localStorage sob a chave `'token'`.
 *
 * ⚠️  NUNCA importe `axios` diretamente neste service.
 */
import { api, isApiError } from './api';
import type { Pedido, PedidoUpdateResponse, StatusPedido } from '../types/pedido';

/**
 * Formata o nome completo do cliente para exibir apenas o primeiro nome + primeiro sobrenome.
 * Exemplo: "Wallison Lopes de Faria" -> "Wallison Lopes"
 */
export function formatarNomeCliente(nomeCompleto?: string | null): string {
  if (!nomeCompleto || !nomeCompleto.trim()) return 'Cliente';
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length <= 2) return partes.join(' ');
  return `${partes[0]} ${partes[1]}`;
}

/**
 * Retorna o rótulo amigável para o status do pedido.
 */
export function formatarStatus(status: StatusPedido): string {
  switch (status) {
    case 'aguardando':
      return 'Aguardando';
    case 'em_preparo':
      return 'Em preparo';
    case 'pronto':
      return 'Pronto';
    case 'cancelado':
      return 'Cancelado';
    default:
      return status;
  }
}

export const pedidoService = {
  /**
   * Lista todos os pedidos cadastrados (GET /pedidos)
   */
  async listarTodos(signal?: AbortSignal): Promise<Pedido[]> {
    try {
      const response = await api.get<Pedido[]>('/pedidos', { signal });
      return response.data;
    } catch (err: unknown) {
      if (isApiError(err) && err.response?.status === 404) {
        // Fallback transparente caso o router backend esteja montado com prefixo /pedido
        const fallbackResponse = await api.get<Pedido[]>('/pedido/pedidos', { signal });
        return fallbackResponse.data;
      }
      throw err;
    }
  },

  /**
   * Atualiza o status de um pedido (PATCH /pedidos/:id_pedido) enviando { status }
   */
  async atualizarStatus(
    id_pedido: string,
    status: StatusPedido,
    signal?: AbortSignal
  ): Promise<PedidoUpdateResponse> {
    try {
      const response = await api.patch<PedidoUpdateResponse>(
        `/pedidos/${id_pedido}`,
        { status },
        { signal }
      );
      return response.data;
    } catch (err: unknown) {
      if (isApiError(err) && err.response?.status === 404) {
        // Fallback transparente caso o router backend esteja montado com prefixo /pedido
        const fallbackResponse = await api.patch<PedidoUpdateResponse>(
          `/pedido/pedidos/${id_pedido}`,
          { status },
          { signal }
        );
        return fallbackResponse.data;
      }
      throw err;
    }
  },
};

export default pedidoService;
