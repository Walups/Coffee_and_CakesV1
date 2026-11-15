import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usuarioService } from '../usuarioService';
import type { UsuarioResponse, CadastroCompletoInput } from '../usuarioService';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    post: vi.fn(),
  },
  isApiError: (err: unknown) => {
    return Boolean(err && typeof err === 'object' && 'isAxiosError' in err);
  },
  getApiErrorMessage: (err: unknown, fallback = 'Erro inesperado') => {
    if (err && typeof err === 'object') {
      const anyErr = err as { response?: { data?: { erro?: string; erros?: string[]; mensagem?: string } }; message?: string };
      const d = anyErr.response?.data;
      if (d?.erro) return d.erro;
      if (d?.erros?.[0]) return d.erros[0];
      if (d?.mensagem) return d.mensagem;
      if (anyErr.message) return anyErr.message;
    }
    return fallback;
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

  describe('register (Isolado de Usuário)', () => {
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

  describe('registerWithAddress / cadastrarComEndereco (Orquestração e Limpeza de Máscaras)', () => {
    const mockFormData: CadastroCompletoInput = {
      nome: 'Maria da Silva',
      cpf: '116.422.769-60', // com máscara
      email: 'Maria.Silva@exemplo.com',
      telefone: '(41) 99999-0000', // com máscara
      senha: 'minhaSenhaForte123',
      rua: 'Rua das Flores',
      numero: '123',
      cep: '80000-000', // com máscara
      complemento: 'Apto 4B',
      cidade: 'Curitiba',
      uf: 'pr',
    };

    const mockUsuarioCriado: UsuarioResponse = {
      id_usuario: 'user-uuid-999',
      nome_completo: 'Maria da Silva',
      cpf: '11642276960',
      email: 'maria.silva@exemplo.com',
      telefone: '41999990000',
      role: 'cliente',
      active: true,
    };

    const mockEnderecoCriado = [
      {
        id_endereco: 'endereco-uuid-888',
        id_usuario: 'user-uuid-999',
        cep: '80000000',
        logradouro: 'Rua das Flores',
        numero: '123',
        complemento: 'Apto 4B',
        cidade: 'Curitiba',
        uf: 'PR',
      },
    ];

    it('deve orquestrar com sucesso em sequência (1º cria usuário -> 2º cria endereço vinculado a ele) e limpar máscaras', async () => {
      // 1ª resposta mockada: /usuario/register
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          mensagem: 'Usuário cadastrado com sucesso!',
          usuario: mockUsuarioCriado,
        },
      });

      // 2ª resposta mockada: /endereco
      vi.mocked(api.post).mockResolvedValueOnce({
        data: mockEnderecoCriado,
      });

      const result = await usuarioService.registerWithAddress(mockFormData);

      // Verificação de orquestração sequencial de 2 chamadas
      expect(api.post).toHaveBeenCalledTimes(2);

      // 1ª Chamada: /usuario/register
      expect(api.post).toHaveBeenNthCalledWith(
        1,
        '/usuario/register',
        {
          nome_completo: 'Maria da Silva',
          cpf: '11642276960', // Máscara de CPF limpa
          email: 'maria.silva@exemplo.com', // Normalizado em minúsculas
          telefone: '41999990000', // Máscara de Telefone limpa
          password: 'minhaSenhaForte123', // Campo 'password' no lugar de 'senha'
        },
        { signal: undefined }
      );

      // Validação estrita do 1º payload
      const userPayload = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>;
      expect(userPayload).toHaveProperty('nome_completo');
      expect(userPayload).toHaveProperty('cpf', '11642276960');
      expect(userPayload).toHaveProperty('email', 'maria.silva@exemplo.com');
      expect(userPayload).toHaveProperty('telefone', '41999990000');
      expect(userPayload).toHaveProperty('password', 'minhaSenhaForte123');
      expect(userPayload).not.toHaveProperty('senha');

      // 2ª Chamada: /endereco (com id_usuario vinculado da 1ª chamada)
      expect(api.post).toHaveBeenNthCalledWith(
        2,
        '/endereco',
        {
          id_usuario: 'user-uuid-999', // Vinculado ao usuário criado
          cep: '80000000', // Máscara de CEP limpa
          logradouro: 'Rua das Flores', // Mapeado de rua para logradouro
          numero: '123',
          cidade: 'Curitiba',
          uf: 'PR',
          complemento: 'Apto 4B',
        },
        { signal: undefined }
      );

      // Validação estrita do 2º payload
      const enderecoPayload = vi.mocked(api.post).mock.calls[1][1] as Record<string, unknown>;
      expect(enderecoPayload).toHaveProperty('id_usuario', 'user-uuid-999');
      expect(enderecoPayload).toHaveProperty('cep', '80000000');
      expect(enderecoPayload).toHaveProperty('logradouro', 'Rua das Flores');
      expect(enderecoPayload).toHaveProperty('numero', '123');
      expect(enderecoPayload).toHaveProperty('cidade', 'Curitiba');
      expect(enderecoPayload).toHaveProperty('uf', 'PR');
      expect(enderecoPayload).toHaveProperty('complemento', 'Apto 4B');
      expect(enderecoPayload).not.toHaveProperty('rua');

      // Retorno composto
      expect(result).toEqual({
        mensagem: 'Cadastro realizado com sucesso!',
        usuario: mockUsuarioCriado,
        endereco: mockEnderecoCriado,
      });
    });

    it('deve usar valores padrão para cidade (Curitiba) e uf (PR) caso não fornecidos', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          mensagem: 'OK',
          usuario: mockUsuarioCriado,
        },
      });

      vi.mocked(api.post).mockResolvedValueOnce({
        data: mockEnderecoCriado,
      });

      const { cidade: _cidade, uf: _uf, ...semCidadeUf } = mockFormData;
      void _cidade;
      void _uf;
      await usuarioService.registerWithAddress(semCidadeUf);

      const enderecoPayload = vi.mocked(api.post).mock.calls[1][1] as Record<string, unknown>;
      expect(enderecoPayload.cidade).toBe('Curitiba');
      expect(enderecoPayload.uf).toBe('PR');
    });

    it('deve repassar AbortSignal em ambas as requisições se fornecido', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { mensagem: 'OK', usuario: mockUsuarioCriado },
      });
      vi.mocked(api.post).mockResolvedValueOnce({
        data: mockEnderecoCriado,
      });

      const controller = new AbortController();
      await usuarioService.registerWithAddress(mockFormData, controller.signal);

      expect(api.post).toHaveBeenNthCalledWith(1, '/usuario/register', expect.any(Object), {
        signal: controller.signal,
      });
      expect(api.post).toHaveBeenNthCalledWith(2, '/endereco', expect.any(Object), {
        signal: controller.signal,
      });
    });

    it('deve interromper o fluxo e NÃO chamar /endereco caso ocorra erro de validação 400 no cadastro do usuário', async () => {
      const error400 = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { erros: ['nome_completo deve ter pelo menos 3 caracteres.', 'password deve ter no mínimo 6 caracteres'] },
        },
        message: 'Request failed with status code 400',
      };

      vi.mocked(api.post).mockRejectedValueOnce(error400);

      await expect(usuarioService.registerWithAddress(mockFormData)).rejects.toEqual(error400);

      // Garante que /endereco NUNCA foi chamado
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith('/usuario/register', expect.any(Object), expect.any(Object));
    });

    it('deve interromper o fluxo e NÃO chamar /endereco em caso de dados duplicados (400 com CPF ou E-mail já cadastrado)', async () => {
      const duplicateError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { erro: 'User already registered (E-mail ou CPF duplicado)' },
        },
        message: 'Request failed with status code 400',
      };

      vi.mocked(api.post).mockRejectedValueOnce(duplicateError);

      await expect(usuarioService.registerWithAddress(mockFormData)).rejects.toEqual(duplicateError);

      // Garante que a 2ª etapa foi prevenida
      expect(api.post).toHaveBeenCalledTimes(1);
    });

    it('deve interromper o fluxo e NÃO chamar /endereco em caso de erro interno 500 no back-end na 1ª etapa', async () => {
      const error500 = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { erro: 'Falha interna' },
        },
        message: 'Request failed with status code 500',
      };

      vi.mocked(api.post).mockRejectedValueOnce(error500);

      await expect(usuarioService.registerWithAddress(mockFormData)).rejects.toEqual(error500);
      expect(api.post).toHaveBeenCalledTimes(1);
    });

    it('deve tratar adequadamente a falha na 2ª etapa de endereço após usuário já criado com sucesso', async () => {
      // 1ª etapa: sucesso
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          mensagem: 'Usuário cadastrado com sucesso!',
          usuario: mockUsuarioCriado,
        },
      });

      // 2ª etapa: erro 400 no endereço
      const addressError400 = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { erros: ['cep deve conter 8 dígitos'] },
        },
        message: 'Request failed with status code 400',
      };
      vi.mocked(api.post).mockRejectedValueOnce(addressError400);

      const promise = usuarioService.registerWithAddress(mockFormData);

      await expect(promise).rejects.toThrow(/Falha no cadastro de endereço/);
      expect(api.post).toHaveBeenCalledTimes(2);

      // Verifica se o erro gerado contém os dados do usuário criado para permitir contingência
      try {
        await promise;
      } catch (err: unknown) {
        const customErr = err as { etapa?: string; usuarioCriado?: UsuarioResponse };
        expect(customErr.etapa).toBe('endereco');
        expect(customErr.usuarioCriado).toEqual(mockUsuarioCriado);
      }
    });

    it('deve tratar erro interno 500 no back-end na 2ª etapa (endereço) após criação do usuário', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          mensagem: 'Usuário cadastrado com sucesso!',
          usuario: mockUsuarioCriado,
        },
      });

      const serverError500 = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { erro: 'Falha interna' },
        },
        message: 'Request failed with status code 500',
      };
      vi.mocked(api.post).mockRejectedValueOnce(serverError500);

      await expect(usuarioService.registerWithAddress(mockFormData)).rejects.toThrow(
        /Falha no cadastro de endereço: Falha interna/
      );
      expect(api.post).toHaveBeenCalledTimes(2);
    });

    it('o alias cadastrarComEndereco deve ter o mesmo comportamento de registerWithAddress', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { mensagem: 'OK', usuario: mockUsuarioCriado },
      });
      vi.mocked(api.post).mockResolvedValueOnce({
        data: mockEnderecoCriado,
      });

      const result = await usuarioService.cadastrarComEndereco(mockFormData);
      expect(api.post).toHaveBeenCalledTimes(2);
      expect(result.usuario).toEqual(mockUsuarioCriado);
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
