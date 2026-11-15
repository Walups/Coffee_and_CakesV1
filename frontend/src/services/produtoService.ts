/**
 * @module produtoService
 *
 * Todas as chamadas HTTP utilizam EXCLUSIVAMENTE a instância centralizada `api`
 * exportada por `frontend/src/services/api.ts`.
 *
 * Essa instância possui um interceptor de requisições que injeta automaticamente
 * o header `Authorization: Bearer <token>` em todas as requisições quando o token
 * JWT estiver presente no localStorage sob a chave `'token'`.
 *
 * ⚠️  NUNCA importe `axios` diretamente neste service.
 *      Use sempre a instância `api` para garantir que o header de autenticação
 *      seja enviado nas rotas protegidas (POST, PATCH, DELETE /produto).
 */
import { api } from './api';
import type {
  Produto,
  ProdutoPayload,
  ProdutoUpdateResponse,
  ProdutoDeleteResponse,
} from '../types/produto';

/**
 * Converte strings monetárias ou numéricas (ex: 'R$ 14,50', '14.50', '14,50', 14.5)
 * em número de ponto flutuante com 2 casas decimais.
 */
export function parseMoeda(val: string | number | undefined | null): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') {
    return isNaN(val) ? undefined : Number(val.toFixed(2));
  }
  const clean = String(val)
    .replace('R$', '')
    .trim()
    .replace(/\s+/g, '');
  if (!clean) return undefined;

  let normalized = clean;
  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(',', '.');
  }

  const num = parseFloat(normalized);
  if (isNaN(num)) return undefined;
  return Number(num.toFixed(2));
}

/**
 * Formata um valor numérico para exibição em moeda brasileira (R$ 0,00).
 */
export function formatMoeda(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) {
    return 'R$ 0,00';
  }
  return val
    .toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
    .replace(/\s/g, ' ');
}

export const produtoService = {
  /**
   * Lista todos os produtos cadastrados (GET /produto)
   */
  async listar(signal?: AbortSignal): Promise<Produto[]> {
    const response = await api.get<Produto[]>('/produto', { signal });
    return response.data;
  },

  /**
   * Cria um novo produto com campos em snake_case (POST /produto)
   */
  async criar(payload: ProdutoPayload, signal?: AbortSignal): Promise<Produto[] | Produto> {
    const response = await api.post<Produto[] | Produto>('/produto', payload, { signal });
    return response.data;
  },

  /**
   * Atualiza dados de um produto existente (PATCH /produto/:id_produto)
   */
  async atualizar(
    id_produto: string,
    payload: Partial<ProdutoPayload>,
    signal?: AbortSignal
  ): Promise<ProdutoUpdateResponse> {
    const response = await api.patch<ProdutoUpdateResponse>(
      `/produto/${id_produto}`,
      payload,
      { signal }
    );
    return response.data;
  },

  /**
   * Realiza a desativação lógica (soft delete) do produto (PATCH /produto/:id_produto/softdelete)
   */
  async softDelete(id_produto: string, signal?: AbortSignal): Promise<ProdutoDeleteResponse> {
    const response = await api.patch<ProdutoDeleteResponse>(
      `/produto/${id_produto}/softdelete`,
      undefined,
      { signal }
    );
    return response.data;
  },

  /**
   * Deleta fisicamente um produto (DELETE /produto/:id_produto)
   */
  async remover(id_produto: string, signal?: AbortSignal): Promise<ProdutoDeleteResponse> {
    const response = await api.delete<ProdutoDeleteResponse>(`/produto/${id_produto}`, {
      signal,
    });
    return response.data;
  },

  // Aliases para conveniência
  listAll(signal?: AbortSignal): Promise<Produto[]> {
    return this.listar(signal);
  },
  create(payload: ProdutoPayload, signal?: AbortSignal): Promise<Produto[] | Produto> {
    return this.criar(payload, signal);
  },
  update(
    id_produto: string,
    payload: Partial<ProdutoPayload>,
    signal?: AbortSignal
  ): Promise<ProdutoUpdateResponse> {
    return this.atualizar(id_produto, payload, signal);
  },
};

export default produtoService;
