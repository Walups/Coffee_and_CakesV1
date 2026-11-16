import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pedidoService, formatarNomeCliente, formatarStatus } from '../pedidoService';
import { api } from '../api';
import type { Pedido } from '../../types/pedido';

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>();
  return {
    ...actual,
    api: {
      ...actual.api,
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe('pedidoService (Camada de Serviços de Pedidos)', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  describe('listarTodos (GET /pedidos)', () => {
    it('deve chamar GET /pedidos e retornar a lista populada de pedidos', async () => {
      const mockPedidos: Pedido[] = [
        {
          id_pedido: 'pedido-1',
          status: 'aguardando',
          usuario: { nome_completo: 'Wallison Lopes de Faria' },
          produto_pedido: [
            {
              id_produto_pedido: 'item-1',
              quant: 2,
              observacao: 'Sem canela',
              produto: { nome_produto: 'Cappuccino' },
            },
          ],
        },
      ];

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockPedidos });

      const result = await pedidoService.listarTodos();

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/pedidos', { signal: undefined });
      expect(result).toEqual(mockPedidos);
    });

    it('deve repassar AbortSignal ao listar pedidos', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
      const controller = new AbortController();

      await pedidoService.listarTodos(controller.signal);

      expect(api.get).toHaveBeenCalledWith('/pedidos', { signal: controller.signal });
    });

    it('deve propagar erro quando a chamada GET falhar', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Erro interno ao buscar pedidos'));

      await expect(pedidoService.listarTodos()).rejects.toThrow('Erro interno ao buscar pedidos');
    });
  });

  describe('atualizarStatus (PATCH /pedidos/:id_pedido)', () => {
    it('deve chamar PATCH /pedidos/:id_pedido com { status }', async () => {
      const mockResponse = {
        mensagem: 'Pedido atualizado',
      };

      vi.mocked(api.patch).mockResolvedValueOnce({ data: mockResponse });

      const result = await pedidoService.atualizarStatus('pedido-123', 'em_preparo');

      expect(api.patch).toHaveBeenCalledTimes(1);
      expect(api.patch).toHaveBeenCalledWith(
        '/pedidos/pedido-123',
        { status: 'em_preparo' },
        { signal: undefined }
      );
      expect(result).toEqual(mockResponse);
    });

    it('deve repassar AbortSignal ao atualizar status', async () => {
      vi.mocked(api.patch).mockResolvedValueOnce({ data: { mensagem: 'OK' } });
      const controller = new AbortController();

      await pedidoService.atualizarStatus('pedido-123', 'pronto', controller.signal);

      expect(api.patch).toHaveBeenCalledWith(
        '/pedidos/pedido-123',
        { status: 'pronto' },
        { signal: controller.signal }
      );
    });

    it('deve propagar erro quando a chamada PATCH falhar', async () => {
      vi.mocked(api.patch).mockRejectedValueOnce(new Error('Falha ao atualizar pedido'));

      await expect(
        pedidoService.atualizarStatus('pedido-123', 'cancelado')
      ).rejects.toThrow('Falha ao atualizar pedido');
    });
  });

  describe('formatarNomeCliente (Regra primeiro nome + primeiro sobrenome)', () => {
    it('deve formatar nome com 3 ou mais palavras para primeiro nome + primeiro sobrenome', () => {
      expect(formatarNomeCliente('Wallison Lopes de Faria')).toBe('Wallison Lopes');
      expect(formatarNomeCliente('Ana Maria da Silva Santos')).toBe('Ana Maria');
    });

    it('deve manter nome com 2 palavras inalterado', () => {
      expect(formatarNomeCliente('Wallison Lopes')).toBe('Wallison Lopes');
      expect(formatarNomeCliente('Carlos Alberto')).toBe('Carlos Alberto');
    });

    it('deve manter nome único', () => {
      expect(formatarNomeCliente('Wallison')).toBe('Wallison');
    });

    it('deve tratar valores vazios, nulos ou indefinidos', () => {
      expect(formatarNomeCliente('')).toBe('Cliente');
      expect(formatarNomeCliente(null)).toBe('Cliente');
      expect(formatarNomeCliente(undefined)).toBe('Cliente');
      expect(formatarNomeCliente('   ')).toBe('Cliente');
    });
  });

  describe('formatarStatus (Rótulo legível do status)', () => {
    it('deve mapear os status para rótulos legíveis em português', () => {
      expect(formatarStatus('aguardando')).toBe('Aguardando');
      expect(formatarStatus('em_preparo')).toBe('Em preparo');
      expect(formatarStatus('pronto')).toBe('Pronto');
      expect(formatarStatus('cancelado')).toBe('Cancelado');
    });
  });

  describe('Autenticação e Token JWT (Authorization: Bearer <token>)', () => {
    const getAuthInterceptor = () => {
      const requestHandlers = (api.interceptors.request as unknown as {
        handlers: Array<{ fulfilled: (config: Record<string, unknown>) => Record<string, unknown> }>;
      }).handlers;
      return requestHandlers.find((h) => typeof h?.fulfilled === 'function')?.fulfilled;
    };

    it('deve garantir que requisições de pedidos contenham Authorization: Bearer <token> quando token existir no localStorage', () => {
      mockStorage['token'] = 'token-jwt-admin-pedidos';
      const authInterceptor = getAuthInterceptor();
      expect(authInterceptor).toBeDefined();

      const config = { method: 'get', url: '/pedidos', headers: {} };
      const modifiedConfig = authInterceptor!(config);

      expect(modifiedConfig.headers).toHaveProperty(
        'Authorization',
        'Bearer token-jwt-admin-pedidos'
      );
    });

    it('não deve injetar Authorization quando não houver token no localStorage', () => {
      delete mockStorage['token'];
      const authInterceptor = getAuthInterceptor();
      expect(authInterceptor).toBeDefined();

      const config = { method: 'get', url: '/pedidos', headers: {} };
      const modifiedConfig = authInterceptor!(config);

      expect(modifiedConfig.headers).not.toHaveProperty('Authorization');
    });
  });
});
