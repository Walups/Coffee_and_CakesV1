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
import type {
  Pedido,
  PedidoUpdateResponse,
  StatusPedido,
  CriarPedidoPayload,
  CriarPedidoResponse,
} from '../types/pedido';

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
export function formatarStatus(status: StatusPedido | string): string {
  const normalizado = status ? String(status).toLowerCase().replace(/\s+/g, '_') : '';
  switch (normalizado) {
    case 'aguardando':
      return 'Aguardando';
    case 'em_preparo':
      return 'Em preparo';
    case 'pronto':
      return 'Pronto';
    case 'entregue':
      return 'Entregue';
    case 'cancelado':
      return 'Cancelado';
    default:
      return status || 'Aguardando';
  }
}

export const pedidoService = {
  /**
   * Envia um novo pedido para a API (POST /pedidos)
   */
  async criar(payload: CriarPedidoPayload, signal?: AbortSignal): Promise<CriarPedidoResponse> {
    try {
      const response = await api.post<CriarPedidoResponse>('/pedidos', payload, { signal });
      return response.data;
    } catch (err: unknown) {
      if (isApiError(err) && err.response?.status === 404) {
        // Fallback transparente caso o router backend esteja montado com prefixo /pedido
        const fallbackResponse = await api.post<CriarPedidoResponse>('/pedido/pedidos', payload, { signal });
        return fallbackResponse.data;
      }
      throw err;
    }
  },
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
   * Lista os pedidos do usuário logado (GET /pedidos/meus)
   */
  async listarMeus(signal?: AbortSignal): Promise<Pedido[]> {
    try {
      const response = await api.get<Pedido[]>('/pedidos/meus', { signal });
      return response.data;
    } catch (err: unknown) {
      if (isApiError(err) && err.response?.status === 404) {
        // Fallback transparente caso o router backend esteja montado com prefixo /pedido
        const fallbackResponse = await api.get<Pedido[]>('/pedido/pedidos/meus', { signal });
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
