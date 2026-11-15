/**
 * @module categoriaService
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
 *      seja enviado nas rotas protegidas (POST, PATCH, DELETE /categoria).
 */
import { api } from './api';
import type {
  Categoria,
  CategoriaPayload,
  CategoriaUpdateResponse,
  CategoriaDeleteResponse,
} from '../types/categoria';

/**
 * Converte valores de desconto (ex: '15%', '15', '0.15', 0.15)
 * para o formato decimal esperado pelo backend (>= 0 e < 1).
 */
export function parseDesconto(val: string | number | undefined | null): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') {
    if (isNaN(val)) return undefined;
    const decimal = val >= 1 ? val / 100 : val;
    return decimal >= 0 && decimal < 1 ? Number(decimal.toFixed(2)) : undefined;
  }
  const cleanStr = String(val).replace('%', '').trim().replace(',', '.');
  if (!cleanStr) return undefined;
  const num = parseFloat(cleanStr);
  if (isNaN(num)) return undefined;
  const decimal = num >= 1 ? num / 100 : num;
  return decimal >= 0 && decimal < 1 ? Number(decimal.toFixed(2)) : undefined;
}

export const categoriaService = {
  /**
   * Lista todas as categorias cadastradas (GET /categoria)
   */
  async listar(signal?: AbortSignal): Promise<Categoria[]> {
    const response = await api.get<Categoria[]>('/categoria', { signal });
    return response.data;
  },

  /**
   * Cria uma nova categoria com campos em snake_case (POST /categoria)
   */
  async criar(payload: CategoriaPayload, signal?: AbortSignal): Promise<Categoria[] | Categoria> {
    const response = await api.post<Categoria[] | Categoria>('/categoria', payload, { signal });
    return response.data;
  },

  /**
   * Atualiza dados de uma categoria existente (PATCH /categoria/:id_categoria)
   */
  async atualizar(
    id_categoria: string,
    payload: Partial<CategoriaPayload>,
    signal?: AbortSignal
  ): Promise<CategoriaUpdateResponse> {
    const response = await api.patch<CategoriaUpdateResponse>(
      `/categoria/${id_categoria}`,
      payload,
      { signal }
    );
    return response.data;
  },

  /**
   * Realiza a desativação lógica (soft delete) da categoria (PATCH /categoria/:id_categoria/softdelete)
   */
  async softDelete(id_categoria: string, signal?: AbortSignal): Promise<CategoriaDeleteResponse> {
    const response = await api.patch<CategoriaDeleteResponse>(
      `/categoria/${id_categoria}/softdelete`,
      undefined,
      { signal }
    );
    return response.data;
  },

  /**
   * Deleta fisicamente uma categoria (DELETE /categoria/:id_categoria)
   */
  async remover(id_categoria: string, signal?: AbortSignal): Promise<CategoriaDeleteResponse> {
    const response = await api.delete<CategoriaDeleteResponse>(`/categoria/${id_categoria}`, {
      signal,
    });
    return response.data;
  },

  // Aliases para conveniência
  listAll(signal?: AbortSignal): Promise<Categoria[]> {
    return this.listar(signal);
  },
  create(payload: CategoriaPayload, signal?: AbortSignal): Promise<Categoria[] | Categoria> {
    return this.criar(payload, signal);
  },
  update(
    id_categoria: string,
    payload: Partial<CategoriaPayload>,
    signal?: AbortSignal
  ): Promise<CategoriaUpdateResponse> {
    return this.atualizar(id_categoria, payload, signal);
  },
};

export default categoriaService;
