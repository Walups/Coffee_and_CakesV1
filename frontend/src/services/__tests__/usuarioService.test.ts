import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usuarioService } from '../usuarioService';
import type { UsuarioResponse } from '../usuarioService';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('usuarioService (Camada de Serviços do Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('deve enviar payload com os nomes exatos de campos esperados pelo backend (email e password)', async () => {
      const mockSuccessResponse = {
        data: {
          mensagem: 'Login realizado com sucesso!',
          token: 'jwt-token-12345',
          usuario: {
            id_usuario: 'user-uuid-123',
            nome_completo: 'Admin Teste',
            cpf: '52998224725',
            email: 'admin@test.com',
            telefone: '5541999998888',
            role: 'admin',
            active: true,
          },
        },
      };

      vi.mocked(api.post).mockResolvedValueOnce(mockSuccessResponse);

      const loginPayload = {
        email: 'admin@test.com',
        password: 'password123',
      };

      const result = await usuarioService.login(loginPayload);

      // Validação do endpoint e contrato do payload
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith(
        '/usuario/login',
        {
          email: 'admin@test.com',
          password: 'password123',
        },
        { signal: undefined }
      );

      // Garante que o payload NÃO contém campos divergentes como 'senha'
      const payloadSent = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>;
      expect(payloadSent).toHaveProperty('email');
      expect(payloadSent).toHaveProperty('password');
      expect(payloadSent).not.toHaveProperty('senha');

      // Validação do retorno
      expect(result).toEqual(mockSuccessResponse.data);
    });

    it('deve repassar o AbortSignal para cancelamento de requisições se fornecido', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          mensagem: 'OK',
          token: 'tok',
          usuario: {
            id_usuario: 'mock-id',
            nome_completo: 'Mock',
            cpf: '123',
            email: 'mock@test.com',
            telefone: '123',
            role: 'cliente',
            active: true,
          } as UsuarioResponse,
        },
      });

      const controller = new AbortController();
      await usuarioService.login({ email: 'a@b.com', password: '123' }, controller.signal);

      expect(api.post).toHaveBeenCalledWith(
        '/usuario/login',
        expect.any(Object),
        { signal: controller.signal }
      );
    });

    it('deve propagar erro quando a chamada da API falhar', async () => {
      const apiError = new Error('E-mail ou password incorretos');
      vi.mocked(api.post).mockRejectedValueOnce(apiError);

      await expect(
        usuarioService.login({ email: 'admin@test.com', password: 'wrong' })
      ).rejects.toThrow('E-mail ou password incorretos');
    });
  });

  describe('register', () => {
    it('deve enviar payload com campos de domínio em snake_case em português e autenticação em password', async () => {
      const mockSuccessResponse = {
        data: {
          mensagem: 'Usuário cadastrado com sucesso!',
          usuario: {
            id_usuario: 'new-user-uuid',
            nome_completo: 'Cliente Novo',
            cpf: '11642276960',
            email: 'cliente@novo.com',
            telefone: '5541999990000',
            role: 'cliente',
            active: true,
          },
        },
      };

      vi.mocked(api.post).mockResolvedValueOnce(mockSuccessResponse);

      const registerPayload = {
        nome_completo: 'Cliente Novo',
        cpf: '11642276960',
        email: 'cliente@novo.com',
        telefone: '5541999990000',
        password: 'passwordSeguro123',
      };

      const result = await usuarioService.register(registerPayload);

      // Validação do endpoint e contrato do payload
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith(
        '/usuario/register',
        registerPayload,
        { signal: undefined }
      );

      // Validação estrita dos campos do contrato
      const payloadSent = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>;
      expect(payloadSent).toHaveProperty('nome_completo');
      expect(payloadSent).toHaveProperty('cpf');
      expect(payloadSent).toHaveProperty('email');
      expect(payloadSent).toHaveProperty('telefone');
      expect(payloadSent).toHaveProperty('password');
      expect(payloadSent).not.toHaveProperty('senha');

      expect(result).toEqual(mockSuccessResponse.data);
    });

    it('deve propagar erro quando o cadastro falhar na API', async () => {
      const apiError = new Error('CPF já cadastrado');
      vi.mocked(api.post).mockRejectedValueOnce(apiError);

      await expect(
        usuarioService.register({
          nome_completo: 'Test',
          cpf: '11642276960',
          email: 'test@dup.com',
          telefone: '5541999990000',
          password: 'password123',
        })
      ).rejects.toThrow('CPF já cadastrado');
    });
  });

  describe('Gerenciamento de Sessão e Logout', () => {
    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
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

    it('deve salvar e recuperar token e usuário no localStorage através de setSession, getStoredToken e getStoredUsuario', () => {
      const mockUsuario: UsuarioResponse = {
        id_usuario: 'user-admin-123',
        nome_completo: 'Admin Master',
        cpf: '11122233344',
        email: 'admin@coffeecakes.com',
        telefone: '5541988887777',
        role: 'admin',
        active: true,
      };

      usuarioService.setSession('token-jwt-super-seguro', mockUsuario);

      expect(usuarioService.getStoredToken()).toBe('token-jwt-super-seguro');
      expect(usuarioService.getStoredUsuario()).toEqual(mockUsuario);
      expect(usuarioService.isAuthenticated()).toBe(true);
      expect(usuarioService.isAdmin()).toBe(true);
    });

    it('deve identificar corretamente quando usuário não for admin', () => {
      const mockCliente: UsuarioResponse = {
        id_usuario: 'user-cliente-456',
        nome_completo: 'Cliente Comum',
        cpf: '22233344455',
        email: 'cliente@coffeecakes.com',
        telefone: '5541988881111',
        role: 'cliente',
        active: true,
      };

      usuarioService.setSession('token-jwt-cliente', mockCliente);

      expect(usuarioService.isAuthenticated()).toBe(true);
      expect(usuarioService.isAdmin()).toBe(false);
    });

    it('deve limpar completamente os dados da sessão com clearSession', () => {
      usuarioService.setSession('token-qualquer', {
        id_usuario: 'id-qualquer',
        nome_completo: 'Qualquer',
        cpf: '123',
        email: 'q@q.com',
        telefone: '123',
        role: 'cliente',
        active: true,
      });

      expect(usuarioService.isAuthenticated()).toBe(true);

      usuarioService.clearSession();

      expect(usuarioService.getStoredToken()).toBeNull();
      expect(usuarioService.getStoredUsuario()).toBeNull();
      expect(usuarioService.isAuthenticated()).toBe(false);
    });

    it('deve limpar a sessão e redirecionar para /login no logout via callback onNavigate', () => {
      usuarioService.setSession('token-sessao', {
        id_usuario: 'id-sessao',
        nome_completo: 'Sessao Ativa',
        cpf: '12345678900',
        email: 'sessao@teste.com',
        telefone: '123',
        role: 'admin',
        active: true,
      });

      const onNavigateMock = vi.fn();
      usuarioService.logout(onNavigateMock);

      expect(usuarioService.getStoredToken()).toBeNull();
      expect(usuarioService.getStoredUsuario()).toBeNull();
      expect(usuarioService.isAuthenticated()).toBe(false);
      expect(onNavigateMock).toHaveBeenCalledTimes(1);
      expect(onNavigateMock).toHaveBeenCalledWith('/login');
    });

    it('deve disparar pushState e popstate no logout quando onNavigate não for informado', () => {
      const pushStateSpy = vi.fn();
      const dispatchEventSpy = vi.fn();

      class MockPopStateEvent {
        type: string;
        constructor(type: string) {
          this.type = type;
        }
      }

      Object.defineProperty(globalThis, 'PopStateEvent', {
        value: MockPopStateEvent,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(globalThis, 'window', {
        value: {
          history: { pushState: pushStateSpy },
          dispatchEvent: dispatchEventSpy,
        },
        writable: true,
        configurable: true,
      });

      usuarioService.setSession('token-avulso', {
        id_usuario: 'id-avulso',
        nome_completo: 'Avulso',
        cpf: '000',
        email: 'a@a.com',
        telefone: '000',
        role: 'cliente',
        active: true,
      });

      usuarioService.logout();

      expect(usuarioService.getStoredToken()).toBeNull();
      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/login');
      expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
    });
  });
});
