import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enderecoService } from '../enderecoService';
import type { EnderecoPayload } from '../enderecoService';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('enderecoService (Camada de Serviços do Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('deve enviar payload com os nomes exatos de campos esperados pelo backend em snake_case', async () => {
      const mockSuccessResponse = {
        data: [
          {
            id_endereco: 'endereco-uuid-789',
            id_usuario: 'user-uuid-123',
            cep: '80000000',
            logradouro: 'Rua das Flores',
            numero: '102-B',
            cidade: 'Curitiba',
            uf: 'PR',
            complemento: 'Apto 101',
          },
        ],
      };

      vi.mocked(api.post).mockResolvedValueOnce(mockSuccessResponse);

      const enderecoPayload: EnderecoPayload = {
        id_usuario: 'user-uuid-123',
        cep: '80000000',
        logradouro: 'Rua das Flores',
        numero: '102-B',
        cidade: 'Curitiba',
        uf: 'PR',
        complemento: 'Apto 101',
      };

      const result = await enderecoService.create(enderecoPayload);

      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith('/endereco', enderecoPayload, { signal: undefined });

      const payloadSent = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>;
      expect(payloadSent).toHaveProperty('id_usuario', 'user-uuid-123');
      expect(payloadSent).toHaveProperty('cep', '80000000');
      expect(payloadSent).toHaveProperty('logradouro', 'Rua das Flores');
      expect(payloadSent).toHaveProperty('numero', '102-B');
      expect(payloadSent).toHaveProperty('cidade', 'Curitiba');
      expect(payloadSent).toHaveProperty('uf', 'PR');
      expect(payloadSent).toHaveProperty('complemento', 'Apto 101');
      // Garante que não possui campos divergentes como 'rua'
      expect(payloadSent).not.toHaveProperty('rua');

      expect(result).toEqual(mockSuccessResponse.data);
    });

    it('deve repassar o AbortSignal para cancelamento se fornecido', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: [] });

      const controller = new AbortController();
      const payload: EnderecoPayload = {
        id_usuario: 'user-uuid-123',
        cep: '80000000',
        logradouro: 'Rua Central',
        numero: '10',
        cidade: 'Curitiba',
        uf: 'PR',
      };

      await enderecoService.create(payload, controller.signal);

      expect(api.post).toHaveBeenCalledWith('/endereco', payload, { signal: controller.signal });
    });

    it('deve propagar erro quando a chamada da API falhar', async () => {
      const apiError = new Error('cep deve conter 8 dígitos');
      vi.mocked(api.post).mockRejectedValueOnce(apiError);

      await expect(
        enderecoService.create({
          id_usuario: 'user-uuid-123',
          cep: '123',
          logradouro: 'Rua Teste',
          numero: '1',
          cidade: 'Curitiba',
          uf: 'PR',
        })
      ).rejects.toThrow('cep deve conter 8 dígitos');
    });
  });
});
