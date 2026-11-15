import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categoriaService, parseDesconto } from '../categoriaService';
import type { CategoriaPayload } from '../../types/categoria';
import { api } from '../api';

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

describe('categoriaService (Camada de Serviços do Frontend)', () => {
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

  describe('listar / listAll (GET /categoria)', () => {
    it('deve chamar o endpoint GET /categoria e retornar a lista de categorias', async () => {
      const mockCategorias = [
        {
          id_categoria: 'cat-uuid-1',
          nome_categoria: 'Cafés Especiais',
          desconto_categoria: 0.15,
          img_banner: 'https://exemplo.com/cafe.jpg',
          active: true,
        },
        {
          id_categoria: 'cat-uuid-2',
          nome_categoria: 'Bolos & Tortas',
          desconto_categoria: null,
          img_banner: null,
          active: true,
        },
      ];

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockCategorias });

      const result = await categoriaService.listar();

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/categoria', { signal: undefined });
      expect(result).toEqual(mockCategorias);
    });

    it('deve repassar AbortSignal ao listar', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
      const controller = new AbortController();

      await categoriaService.listar(controller.signal);

      expect(api.get).toHaveBeenCalledWith('/categoria', { signal: controller.signal });
    });

    it('deve propagar erro quando a chamada GET falhar', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Erro interno ao buscar categorias'));

      await expect(categoriaService.listar()).rejects.toThrow('Erro interno ao buscar categorias');
    });
  });

  describe('criar / create (POST /categoria)', () => {
    it('deve enviar payload com nomes exatos em snake_case esperados pelo backend', async () => {
      const mockCreated = [
        {
          id_categoria: 'cat-uuid-new',
          nome_categoria: 'Bebidas Geladas',
          desconto_categoria: 0.1,
          img_banner: 'https://exemplo.com/geladas.png',
          active: true,
        },
      ];

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockCreated });

      const payload: CategoriaPayload = {
        nome_categoria: 'Bebidas Geladas',
        desconto_categoria: 0.1,
        img_banner: 'https://exemplo.com/geladas.png',
        active: true,
      };

      const result = await categoriaService.criar(payload);

      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith('/categoria', payload, { signal: undefined });

      const sentPayload = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>;
      expect(sentPayload).toHaveProperty('nome_categoria', 'Bebidas Geladas');
      expect(sentPayload).toHaveProperty('desconto_categoria', 0.1);
      expect(sentPayload).toHaveProperty('img_banner', 'https://exemplo.com/geladas.png');
      expect(sentPayload).toHaveProperty('active', true);

      // Garante que não possui campos divergentes fora do contrato da API
      expect(sentPayload).not.toHaveProperty('nome');
      expect(sentPayload).not.toHaveProperty('nomeCategoria');
      expect(sentPayload).not.toHaveProperty('desconto');
      expect(sentPayload).not.toHaveProperty('linkImagem');

      expect(result).toEqual(mockCreated);
    });

    it('deve repassar AbortSignal ao criar', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: [] });
      const controller = new AbortController();

      await categoriaService.criar({ nome_categoria: 'Doces' }, controller.signal);

      expect(api.post).toHaveBeenCalledWith('/categoria', { nome_categoria: 'Doces' }, {
        signal: controller.signal,
      });
    });

    it('deve propagar erro de validação da API', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('nome_categoria é obrigatório'));

      await expect(
        categoriaService.criar({ nome_categoria: '' })
      ).rejects.toThrow('nome_categoria é obrigatório');
    });
  });

  describe('atualizar / update (PATCH /categoria/:id_categoria)', () => {
    it('deve chamar PATCH /categoria/:id_categoria com o id e campos em snake_case', async () => {
      const mockUpdateResponse = {
        mensagem: 'Categoria atualizada',
        categoria: [
          {
            id_categoria: 'cat-uuid-1',
            nome_categoria: 'Cafés Gourmet',
            desconto_categoria: 0.2,
          },
        ],
      };

      vi.mocked(api.patch).mockResolvedValueOnce({ data: mockUpdateResponse });

      const idCategoria = 'cat-uuid-1';
      const payload: Partial<CategoriaPayload> = {
        nome_categoria: 'Cafés Gourmet',
        desconto_categoria: 0.2,
      };

      const result = await categoriaService.atualizar(idCategoria, payload);

      expect(api.patch).toHaveBeenCalledTimes(1);
      expect(api.patch).toHaveBeenCalledWith(
        `/categoria/${idCategoria}`,
        payload,
        { signal: undefined }
      );

      const sentPayload = vi.mocked(api.patch).mock.calls[0][1] as Record<string, unknown>;
      expect(sentPayload).toHaveProperty('nome_categoria', 'Cafés Gourmet');
      expect(sentPayload).toHaveProperty('desconto_categoria', 0.2);

      expect(result).toEqual(mockUpdateResponse);
    });

    it('deve repassar AbortSignal ao atualizar', async () => {
      vi.mocked(api.patch).mockResolvedValueOnce({ data: { mensagem: 'OK', categoria: [] } });
      const controller = new AbortController();

      await categoriaService.atualizar('cat-1', { nome_categoria: 'Chás' }, controller.signal);

      expect(api.patch).toHaveBeenCalledWith(
        '/categoria/cat-1',
        { nome_categoria: 'Chás' },
        { signal: controller.signal }
      );
    });
  });

  describe('softDelete (PATCH /categoria/:id_categoria/softdelete)', () => {
    it('deve chamar a rota de soft delete PATCH /categoria/:id_categoria/softdelete', async () => {
      const mockSoftDeleteResponse = {
        mensagem: 'Categoria desativado!!',
      };

      vi.mocked(api.patch).mockResolvedValueOnce({ data: mockSoftDeleteResponse });

      const idCategoria = 'cat-uuid-to-delete';
      const result = await categoriaService.softDelete(idCategoria);

      expect(api.patch).toHaveBeenCalledTimes(1);
      expect(api.patch).toHaveBeenCalledWith(
        `/categoria/${idCategoria}/softdelete`,
        undefined,
        { signal: undefined }
      );
      expect(result).toEqual(mockSoftDeleteResponse);
    });

    it('deve repassar AbortSignal no softDelete', async () => {
      vi.mocked(api.patch).mockResolvedValueOnce({ data: { mensagem: 'OK' } });
      const controller = new AbortController();

      await categoriaService.softDelete('cat-123', controller.signal);

      expect(api.patch).toHaveBeenCalledWith(
        '/categoria/cat-123/softdelete',
        undefined,
        { signal: controller.signal }
      );
    });

    it('deve propagar erro se a rota de softDelete falhar', async () => {
      vi.mocked(api.patch).mockRejectedValueOnce(new Error('Categoria não encontrada'));

      await expect(categoriaService.softDelete('invalid-id')).rejects.toThrow(
        'Categoria não encontrada'
      );
    });
  });

  describe('Autenticação e Envio de Token (Authorization: Bearer <token>)', () => {
    /**
     * Helper: retorna o interceptor de autenticação registrado na instância `api`.
     * Funciona porque o vi.mock de '../api' preserva o objeto real de api.interceptors
     * via spread (...actual.api), permitindo inspeção direta dos handlers registrados.
     */
    const getAuthInterceptor = () => {
      const requestHandlers = (api.interceptors.request as unknown as {
        handlers: Array<{ fulfilled: (config: Record<string, unknown>) => Record<string, unknown> }>;
      }).handlers;
      return requestHandlers.find((h) => typeof h?.fulfilled === 'function')?.fulfilled;
    };

    it('deve garantir que o interceptor de requisições anexa o token Bearer no header de autorização quando presente no localStorage', () => {
      mockStorage['token'] = 'token-jwt-admin-789';

      const authInterceptor = getAuthInterceptor();
      expect(authInterceptor).toBeDefined();

      const config = { headers: {} };
      const modifiedConfig = authInterceptor!(config);

      expect(modifiedConfig.headers).toHaveProperty(
        'Authorization',
        'Bearer token-jwt-admin-789'
      );
    });

    it('não deve injetar o header Authorization quando não houver token no localStorage', () => {
      delete mockStorage['token'];

      const authInterceptor = getAuthInterceptor();
      const config = { headers: {} };
      const modifiedConfig = authInterceptor!(config);

      expect(modifiedConfig.headers).not.toHaveProperty('Authorization');
    });

    // ── Operações protegidas por authMiddleware + checkRole(['admin']) no backend ──
    // Cada teste abaixo simula o interceptor de auth sobre o config real da chamada,
    // garantindo que Authorization: Bearer <token> estaria presente no header enviado.

    it('criar (POST /categoria) — operação protegida — deve incluir Authorization: Bearer <token>', () => {
      mockStorage['token'] = 'token-admin-criar-cat';
      const authInterceptor = getAuthInterceptor();
      expect(authInterceptor).toBeDefined();

      const config = { method: 'post', url: '/categoria', headers: {} };
      const modifiedConfig = authInterceptor!(config);

      expect(modifiedConfig.headers).toHaveProperty(
        'Authorization',
        'Bearer token-admin-criar-cat'
      );
    });

    it('atualizar (PATCH /categoria/:id_categoria) — operação protegida — deve incluir Authorization: Bearer <token>', () => {
      mockStorage['token'] = 'token-admin-atualizar-cat';
      const authInterceptor = getAuthInterceptor();
      expect(authInterceptor).toBeDefined();

      const config = { method: 'patch', url: '/categoria/cat-uuid-1', headers: {} };
      const modifiedConfig = authInterceptor!(config);

      expect(modifiedConfig.headers).toHaveProperty(
        'Authorization',
        'Bearer token-admin-atualizar-cat'
      );
    });

    it('softDelete (PATCH /categoria/:id_categoria/softdelete) — operação protegida — deve incluir Authorization: Bearer <token>', () => {
      mockStorage['token'] = 'token-admin-softdelete-cat';
      const authInterceptor = getAuthInterceptor();
      expect(authInterceptor).toBeDefined();

      const config = { method: 'patch', url: '/categoria/cat-uuid-1/softdelete', headers: {} };
      const modifiedConfig = authInterceptor!(config);

      expect(modifiedConfig.headers).toHaveProperty(
        'Authorization',
        'Bearer token-admin-softdelete-cat'
      );
    });

    it('remover (DELETE /categoria/:id_categoria) — operação protegida — deve incluir Authorization: Bearer <token>', () => {
      mockStorage['token'] = 'token-admin-remover-cat';
      const authInterceptor = getAuthInterceptor();
      expect(authInterceptor).toBeDefined();

      const config = { method: 'delete', url: '/categoria/cat-uuid-1', headers: {} };
      const modifiedConfig = authInterceptor!(config);

      expect(modifiedConfig.headers).toHaveProperty(
        'Authorization',
        'Bearer token-admin-remover-cat'
      );
    });

    it('sem token no localStorage — nenhuma operação protegida deve enviar Authorization', () => {
      delete mockStorage['token'];
      const authInterceptor = getAuthInterceptor();
      expect(authInterceptor).toBeDefined();

      const operacoes = [
        { method: 'post',   url: '/categoria' },
        { method: 'patch',  url: '/categoria/cat-uuid-1' },
        { method: 'patch',  url: '/categoria/cat-uuid-1/softdelete' },
        { method: 'delete', url: '/categoria/cat-uuid-1' },
      ];

      for (const op of operacoes) {
        const config = { ...op, headers: {} };
        const modifiedConfig = authInterceptor!(config);
        expect(modifiedConfig.headers).not.toHaveProperty('Authorization');
      }
    });
  });

  describe('parseDesconto (Conversão e normalização de percentual)', () => {
    it('deve converter string com porcentagem para decimal < 1', () => {
      expect(parseDesconto('15%')).toBe(0.15);
      expect(parseDesconto('50%')).toBe(0.5);
      expect(parseDesconto('5%')).toBe(0.05);
    });

    it('deve converter número maior ou igual a 1 (ex: 15) para decimal < 1 (0.15)', () => {
      expect(parseDesconto('15')).toBe(0.15);
      expect(parseDesconto(25)).toBe(0.25);
    });

    it('deve manter decimal menor que 1 (ex: 0.15)', () => {
      expect(parseDesconto('0.15')).toBe(0.15);
      expect(parseDesconto(0.3)).toBe(0.3);
      expect(parseDesconto(0)).toBe(0);
      expect(parseDesconto('0%')).toBe(0);
    });

    it('deve retornar undefined para valores vazios, nulos ou inválidos', () => {
      expect(parseDesconto('')).toBeUndefined();
      expect(parseDesconto(undefined)).toBeUndefined();
      expect(parseDesconto(null)).toBeUndefined();
      expect(parseDesconto('abc')).toBeUndefined();
      expect(parseDesconto(-10)).toBeUndefined();
      expect(parseDesconto(100)).toBeUndefined();
    });
  });
});
