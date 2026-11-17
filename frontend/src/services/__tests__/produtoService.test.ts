import { describe, it, expect, vi, beforeEach } from 'vitest';
import { produtoService, parseMoeda, formatMoeda } from '../produtoService';
import type { ProdutoPayload } from '../../types/produto';
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

describe('produtoService (Camada de Serviços do Frontend)', () => {
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

  describe('listar / listAll (GET /produto)', () => {
    it('deve chamar o endpoint GET /produto e retornar a lista de produtos', async () => {
      const mockProdutos = [
        {
          id_produto: 'prod-uuid-1',
          nome_produto: 'Cappuccino Especial',
          preco: 14.5,
          desconto_produto: 2.5,
          descricao: 'Café expresso com canela',
          imagem_produto: 'https://exemplo.com/cappuccino.jpg',
          id_categoria: 'cat-1',
          active: true,
        },
        {
          id_produto: 'prod-uuid-2',
          nome_produto: 'Expresso Tradicional',
          preco: 6.5,
          desconto_produto: null,
          descricao: null,
          imagem_produto: 'https://exemplo.com/expresso.jpg',
          id_categoria: null,
          active: true,
        },
      ];

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockProdutos });

      const result = await produtoService.listar();

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/produto', { signal: undefined });
      expect(result).toEqual(mockProdutos);
    });

    it('deve repassar AbortSignal ao listar', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
      const controller = new AbortController();

      await produtoService.listar(controller.signal);

      expect(api.get).toHaveBeenCalledWith('/produto', { signal: controller.signal });
    });

    it('deve propagar erro quando a chamada GET falhar', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Erro interno ao buscar produtos'));

      await expect(produtoService.listar()).rejects.toThrow('Erro interno ao buscar produtos');
    });
  });

  describe('criar / create (POST /produto)', () => {
    it('deve enviar payload com nomes exatos em snake_case esperados pelo backend', async () => {
      const mockCreated = [
        {
          id_produto: 'prod-uuid-new',
          nome_produto: 'Bolo de Cenoura',
          preco: 12.0,
          desconto_produto: 2.0,
          descricao: 'Com calda de chocolate belga',
          imagem_produto: 'https://exemplo.com/bolo.jpg',
          id_categoria: 'cat-doces',
          active: true,
        },
      ];

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockCreated });

      const payload: ProdutoPayload = {
        nome_produto: 'Bolo de Cenoura',
        preco: 12.0,
        desconto_produto: 2.0,
        descricao: 'Com calda de chocolate belga',
        imagem_produto: 'https://exemplo.com/bolo.jpg',
        id_categoria: 'cat-doces',
        active: true,
      };

      const result = await produtoService.criar(payload);

      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith('/produto', payload, { signal: undefined });

      const sentPayload = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>;
      expect(sentPayload).toHaveProperty('nome_produto', 'Bolo de Cenoura');
      expect(sentPayload).toHaveProperty('preco', 12.0);
      expect(sentPayload).toHaveProperty('desconto_produto', 2.0);
      expect(sentPayload).toHaveProperty('descricao', 'Com calda de chocolate belga');
      expect(sentPayload).toHaveProperty('imagem_produto', 'https://exemplo.com/bolo.jpg');
      expect(sentPayload).toHaveProperty('id_categoria', 'cat-doces');
      expect(sentPayload).toHaveProperty('active', true);

      // Garante que não possui campos fora do padrão snake_case
      expect(sentPayload).not.toHaveProperty('nome');
      expect(sentPayload).not.toHaveProperty('nomeProduto');
      expect(sentPayload).not.toHaveProperty('imagemProduto');
      expect(sentPayload).not.toHaveProperty('desconto');
      expect(sentPayload).not.toHaveProperty('observacoes');
      expect(sentPayload).not.toHaveProperty('categoriaId');

      expect(result).toEqual(mockCreated);
    });

    it('deve repassar AbortSignal ao criar', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: [] });
      const controller = new AbortController();

      const payload: ProdutoPayload = {
        nome_produto: 'Café Latte',
        preco: 10.0,
        imagem_produto: 'https://exemplo.com/latte.jpg',
      };

      await produtoService.criar(payload, controller.signal);

      expect(api.post).toHaveBeenCalledWith('/produto', payload, {
        signal: controller.signal,
      });
    });

    it('deve propagar erro de validação da API', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('nome_produto é obrigatório'));

      await expect(
        produtoService.criar({
          nome_produto: '',
          preco: 0,
          imagem_produto: '',
        })
      ).rejects.toThrow('nome_produto é obrigatório');
    });
  });

  describe('atualizar / update (PATCH /produto/:id_produto)', () => {
    it('deve chamar PATCH /produto/:id_produto com o id e campos em snake_case', async () => {
      const mockUpdateResponse = {
        mensagem: 'Produto atualizado',
        produto: [
          {
            id_produto: 'prod-uuid-1',
            nome_produto: 'Cappuccino Gelado',
            preco: 18.0,
            desconto_produto: 3.0,
          },
        ],
      };

      vi.mocked(api.patch).mockResolvedValueOnce({ data: mockUpdateResponse });

      const idProduto = 'prod-uuid-1';
      const payload: Partial<ProdutoPayload> = {
        nome_produto: 'Cappuccino Gelado',
        preco: 18.0,
        desconto_produto: 3.0,
      };

      const result = await produtoService.atualizar(idProduto, payload);

      expect(api.patch).toHaveBeenCalledTimes(1);
      expect(api.patch).toHaveBeenCalledWith(`/produto/${idProduto}`, payload, {
        signal: undefined,
      });

      const sentPayload = vi.mocked(api.patch).mock.calls[0][1] as Record<string, unknown>;
      expect(sentPayload).toHaveProperty('nome_produto', 'Cappuccino Gelado');
      expect(sentPayload).toHaveProperty('preco', 18.0);
      expect(sentPayload).toHaveProperty('desconto_produto', 3.0);

      expect(result).toEqual(mockUpdateResponse);
    });

    it('deve repassar AbortSignal ao atualizar', async () => {
      vi.mocked(api.patch).mockResolvedValueOnce({ data: { mensagem: 'OK', produto: [] } });
      const controller = new AbortController();

      await produtoService.atualizar('prod-1', { preco: 15.0 }, controller.signal);

      expect(api.patch).toHaveBeenCalledWith(
        '/produto/prod-1',
        { preco: 15.0 },
        { signal: controller.signal }
      );
    });

    it('deve atualizar produto com limpeza de imagem e desconto zerado', async () => {
      const mockUpdateResponse = {
        mensagem: 'Produto atualizado',
        produto: [{ id_produto: 'prod-1', imagem_produto: '', desconto_produto: 0 }],
      };
      vi.mocked(api.patch).mockResolvedValueOnce({ data: mockUpdateResponse });

      const result = await produtoService.atualizar('prod-1', {
        nome_produto: 'Café Simples',
        preco: 10.0,
        imagem_produto: '',
        desconto_produto: 0,
      });

      expect(api.patch).toHaveBeenCalledWith(
        '/produto/prod-1',
        {
          nome_produto: 'Café Simples',
          preco: 10.0,
          imagem_produto: '',
          desconto_produto: 0,
        },
        { signal: undefined }
      );
      expect(result).toEqual(mockUpdateResponse);
    });

    it('deve propagar erro quando a rota PATCH /produto/:id_produto falhar', async () => {
      vi.mocked(api.patch).mockRejectedValueOnce(new Error('Produto não encontrado'));

      await expect(
        produtoService.atualizar('prod-inexistente', { preco: 25.0 })
      ).rejects.toThrow('Produto não encontrado');
    });
  });

  describe('softDelete (PATCH /produto/:id_produto/softdelete)', () => {
    it('deve chamar a rota de soft delete PATCH /produto/:id_produto/softdelete', async () => {
      const mockSoftDeleteResponse = {
        mensagem: 'Produto desativado!!',
      };

      vi.mocked(api.patch).mockResolvedValueOnce({ data: mockSoftDeleteResponse });

      const idProduto = 'prod-uuid-to-delete';
      const result = await produtoService.softDelete(idProduto);

      expect(api.patch).toHaveBeenCalledTimes(1);
      expect(api.patch).toHaveBeenCalledWith(
        `/produto/${idProduto}/softdelete`,
        undefined,
        { signal: undefined }
      );
      expect(result).toEqual(mockSoftDeleteResponse);
    });

    it('deve repassar AbortSignal no softDelete', async () => {
      vi.mocked(api.patch).mockResolvedValueOnce({ data: { mensagem: 'OK' } });
      const controller = new AbortController();

      await produtoService.softDelete('prod-123', controller.signal);

      expect(api.patch).toHaveBeenCalledWith(
        '/produto/prod-123/softdelete',
        undefined,
        { signal: controller.signal }
      );
    });

    it('deve propagar erro se a rota de softDelete falhar', async () => {
      vi.mocked(api.patch).mockRejectedValueOnce(new Error('Produto não encontrado'));

      await expect(produtoService.softDelete('invalid-id')).rejects.toThrow(
        'Produto não encontrado'
      );
    });
  });

  describe('Autenticação e Envio de Token (Authorization: Bearer <token>)', () => {
    const getAuthInterceptor = () => {
      const requestHandlers = (api.interceptors.request as unknown as {
        handlers: Array<{ fulfilled: (config: Record<string, unknown>) => Record<string, unknown> }>;
      }).handlers;
      return requestHandlers.find((h) => typeof h?.fulfilled === 'function')?.fulfilled;
    };

    it('deve garantir que o interceptor de requisições anexa o token Bearer no header de autorização quando presente no localStorage', () => {
      mockStorage['token'] = 'token-jwt-admin-prod';

      const authInterceptor = getAuthInterceptor();
      expect(authInterceptor).toBeDefined();

      const config = { headers: {} };
      const modifiedConfig = authInterceptor!(config);

      expect(modifiedConfig.headers).toHaveProperty(
        'Authorization',
        'Bearer token-jwt-admin-prod'
      );
    });

    it('não deve injetar o header Authorization quando não houver token no localStorage', () => {
      delete mockStorage['token'];

      const authInterceptor = getAuthInterceptor();
      const config = { headers: {} };
      const modifiedConfig = authInterceptor!(config);

      expect(modifiedConfig.headers).not.toHaveProperty('Authorization');
    });

    it('criar (POST /produto) — operação protegida — deve incluir Authorization: Bearer <token>', () => {
      mockStorage['token'] = 'token-admin-criar-prod';
      const authInterceptor = getAuthInterceptor();
      expect(authInterceptor).toBeDefined();

      const config = { method: 'post', url: '/produto', headers: {} };
      const modifiedConfig = authInterceptor!(config);

      expect(modifiedConfig.headers).toHaveProperty(
        'Authorization',
        'Bearer token-admin-criar-prod'
      );
    });

    it('atualizar (PATCH /produto/:id_produto) — operação protegida — deve incluir Authorization: Bearer <token>', () => {
      mockStorage['token'] = 'token-admin-atualizar-prod';
      const authInterceptor = getAuthInterceptor();
      expect(authInterceptor).toBeDefined();

      const config = { method: 'patch', url: '/produto/prod-uuid-1', headers: {} };
      const modifiedConfig = authInterceptor!(config);

      expect(modifiedConfig.headers).toHaveProperty(
        'Authorization',
        'Bearer token-admin-atualizar-prod'
      );
    });

    it('softDelete (PATCH /produto/:id_produto/softdelete) — operação protegida — deve incluir Authorization: Bearer <token>', () => {
      mockStorage['token'] = 'token-admin-softdelete-prod';
      const authInterceptor = getAuthInterceptor();
      expect(authInterceptor).toBeDefined();

      const config = { method: 'patch', url: '/produto/prod-uuid-1/softdelete', headers: {} };
      const modifiedConfig = authInterceptor!(config);

      expect(modifiedConfig.headers).toHaveProperty(
        'Authorization',
        'Bearer token-admin-softdelete-prod'
      );
    });

    it('remover (DELETE /produto/:id_produto) — operação protegida — deve incluir Authorization: Bearer <token>', () => {
      mockStorage['token'] = 'token-admin-remover-prod';
      const authInterceptor = getAuthInterceptor();
      expect(authInterceptor).toBeDefined();

      const config = { method: 'delete', url: '/produto/prod-uuid-1', headers: {} };
      const modifiedConfig = authInterceptor!(config);

      expect(modifiedConfig.headers).toHaveProperty(
        'Authorization',
        'Bearer token-admin-remover-prod'
      );
    });

    it('sem token no localStorage — nenhuma operação protegida deve enviar Authorization', () => {
      delete mockStorage['token'];
      const authInterceptor = getAuthInterceptor();
      expect(authInterceptor).toBeDefined();

      const operacoes = [
        { method: 'post',   url: '/produto' },
        { method: 'patch',  url: '/produto/prod-uuid-1' },
        { method: 'patch',  url: '/produto/prod-uuid-1/softdelete' },
        { method: 'delete', url: '/produto/prod-uuid-1' },
      ];

      for (const op of operacoes) {
        const config = { ...op, headers: {} };
        const modifiedConfig = authInterceptor!(config);
        expect(modifiedConfig.headers).not.toHaveProperty('Authorization');
      }
    });
  });

  describe('parseMoeda (Conversão numérica de preço e desconto)', () => {
    it('deve converter strings no formato brasileiro (ex: 14,50) para float (14.5)', () => {
      expect(parseMoeda('14,50')).toBe(14.5);
      expect(parseMoeda('6,50')).toBe(6.5);
      expect(parseMoeda('0,99')).toBe(0.99);
    });

    it('deve converter strings com R$ e espaços para float', () => {
      expect(parseMoeda('R$ 10,00')).toBe(10);
      expect(parseMoeda('R$ 1.250,50')).toBe(1250.5);
      expect(parseMoeda('R$ 2,50')).toBe(2.5);
    });

    it('deve converter números diretamente para float de 2 casas decimais', () => {
      expect(parseMoeda(14.5)).toBe(14.5);
      expect(parseMoeda(10)).toBe(10);
      expect(parseMoeda(0)).toBe(0);
    });

    it('deve retornar undefined para valores vazios, nulos ou strings inválidas', () => {
      expect(parseMoeda('')).toBeUndefined();
      expect(parseMoeda(undefined)).toBeUndefined();
      expect(parseMoeda(null)).toBeUndefined();
      expect(parseMoeda('abc')).toBeUndefined();
      expect(parseMoeda(NaN)).toBeUndefined();
    });
  });

  describe('formatMoeda (Formatação de moeda brasileira)', () => {
    it('deve formatar números para formato R$ 0,00', () => {
      expect(formatMoeda(10)).toBe('R$ 10,00');
      expect(formatMoeda(14.5)).toBe('R$ 14,50');
      expect(formatMoeda(6.5)).toBe('R$ 6,50');
      expect(formatMoeda(0)).toBe('R$ 0,00');
    });

    it('deve retornar R$ 0,00 para valores undefined, null ou NaN', () => {
      expect(formatMoeda(undefined)).toBe('R$ 0,00');
      expect(formatMoeda(null)).toBe('R$ 0,00');
      expect(formatMoeda(NaN)).toBe('R$ 0,00');
    });
  });
});
