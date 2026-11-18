import { api } from './api';

export interface EnderecoPayload {
  id_usuario: string;
  cep: string;
  logradouro: string;
  numero: string;
  cidade: string;
  uf: string;
  complemento?: string;
}

export interface EnderecoResponse {
  id_endereco?: string;
  id_usuario: string;
  cep: string;
  logradouro: string;
  numero: string;
  cidade: string;
  uf: string;
  complemento?: string;
  criado_em?: string;
}

export const enderecoService = {
  async create(payload: EnderecoPayload, signal?: AbortSignal): Promise<EnderecoResponse[] | EnderecoResponse> {
    const response = await api.post<EnderecoResponse[] | EnderecoResponse>('/endereco', payload, { signal });
    return response.data;
  },

  async getMine(signal?: AbortSignal): Promise<EnderecoResponse | null> {
    const response = await api.get<EnderecoResponse>('/endereco/me', { signal });
    return response.data || null;
  },

  async update(
    id_endereco: string,
    payload: Partial<EnderecoPayload>,
    signal?: AbortSignal
  ): Promise<{ mensagem: string; endereco: EnderecoResponse }> {
    const response = await api.patch<{ mensagem: string; endereco: EnderecoResponse }>(
      `/endereco/${id_endereco}`,
      payload,
      { signal }
    );
    return response.data;
  },

  async saveOrUpdateMine(
    payload: EnderecoPayload,
    signal?: AbortSignal
  ): Promise<EnderecoResponse[] | EnderecoResponse> {
    try {
      const existing = await enderecoService.getMine(signal);
      if (existing?.id_endereco) {
        const updated = await enderecoService.update(existing.id_endereco, payload, signal);
        return updated.endereco;
      }
    } catch {
      // Caso não consiga consultar ou não exista, tenta criar um novo endereço
    }
    return enderecoService.create(payload, signal);
  },
};
