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
};
