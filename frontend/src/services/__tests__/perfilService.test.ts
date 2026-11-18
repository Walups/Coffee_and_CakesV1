import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  usuarioService,
  getUserProfileStorageKey,
  getStoredUserProfile,
  setStoredUserProfile,
} from '../usuarioService';
import { enderecoService } from '../enderecoService';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
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

describe('Serviços de Perfil e Atualização de Cadastro', () => {
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

  describe('getUserProfileStorageKey, getStoredUserProfile e setStoredUserProfile', () => {
    it('deve gerar a chave no padrão exato @coffee-cakes:user-profile-${userId}', () => {
      expect(getUserProfileStorageKey('user-123')).toBe('@coffee-cakes:user-profile-user-123');
      expect(getUserProfileStorageKey()).toBe('@coffee-cakes:user-profile-default');
    });

    it('deve salvar e recuperar os dados de perfil no localStorage', () => {
      const profileData = {
        nome_completo: 'Carlos Eduardo',
        email: 'carlos@exemplo.com',
        rua: 'Rua XV de Novembro',
        numero: '150',
        cep: '80000000',
        complemento: 'Bloco A',
      };

      setStoredUserProfile('user-456', profileData);

      const recovered = getStoredUserProfile('user-456');
      expect(recovered).toEqual(profileData);
      expect(mockStorage['@coffee-cakes:user-profile-user-456']).toBe(JSON.stringify(profileData));
    });

    it('deve retornar null se não houver dados salvos ou se o JSON for inválido', () => {
      expect(getStoredUserProfile('inexistente')).toBeNull();

      mockStorage['@coffee-cakes:user-profile-erro'] = '{invalido json';
      expect(getStoredUserProfile('erro')).toBeNull();
    });
  });

  describe('usuarioService.updateProfile e getMe', () => {
    it('deve enviar PATCH /usuario/:id_usuario com payload correto e atualizar a sessão local', async () => {
      mockStorage['usuario'] = JSON.stringify({
        id_usuario: 'user-789',
        nome_completo: 'Nome Antigo',
        email: 'user@teste.com',
        role: 'cliente',
        active: true,
      });

      const mockResponse = {
        data: {
          mensagem: 'Usuário atualizado com sucesso',
          usuario: {
            id_usuario: 'user-789',
            nome_completo: 'Nome Atualizado',
            email: 'user@teste.com',
            role: 'cliente',
            active: true,
          },
        },
      };

      vi.mocked(api.patch).mockResolvedValueOnce(mockResponse);

      const res = await usuarioService.updateProfile('user-789', { nome_completo: 'Nome Atualizado' });

      expect(api.patch).toHaveBeenCalledWith(
        '/usuario/user-789',
        { nome_completo: 'Nome Atualizado' },
        { signal: undefined }
      );
      expect(res.usuario.nome_completo).toBe('Nome Atualizado');

      const sessaoAtualizada = JSON.parse(mockStorage['usuario']);
      expect(sessaoAtualizada.nome_completo).toBe('Nome Atualizado');
    });

    it('deve enviar GET /usuario/me e retornar os dados do usuário autenticado', async () => {
      const mockUser = {
        id_usuario: 'user-me-123',
        nome_completo: 'Cliente Autenticado',
        email: 'auth@teste.com',
        role: 'cliente',
        active: true,
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockUser });

      const res = await usuarioService.getMe();

      expect(api.get).toHaveBeenCalledWith('/usuario/me', { signal: undefined });
      expect(res.id_usuario).toBe('user-me-123');
      expect(res.nome_completo).toBe('Cliente Autenticado');
    });
  });

  describe('enderecoService.getMine, update e saveOrUpdateMine', () => {
    it('deve chamar GET /endereco/me para buscar endereço do cliente autenticado', async () => {
      const mockEndereco = {
        id_endereco: 'end-1',
        id_usuario: 'user-1',
        logradouro: 'Rua das Flores',
        numero: '10',
        cep: '80000000',
        cidade: 'Curitiba',
        uf: 'PR',
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockEndereco });

      const res = await enderecoService.getMine();

      expect(api.get).toHaveBeenCalledWith('/endereco/me', { signal: undefined });
      expect(res?.logradouro).toBe('Rua das Flores');
    });

    it('deve chamar PATCH /endereco/:id_endereco para atualizar endereço existente', async () => {
      const mockEnderecoAtualizado = {
        id_endereco: 'end-1',
        id_usuario: 'user-1',
        logradouro: 'Rua Nova',
        numero: '20',
        cep: '80000000',
        cidade: 'Curitiba',
        uf: 'PR',
      };

      vi.mocked(api.patch).mockResolvedValueOnce({
        data: {
          mensagem: 'Endereço atualizado',
          endereco: mockEnderecoAtualizado,
        },
      });

      const res = await enderecoService.update('end-1', { logradouro: 'Rua Nova', numero: '20' });

      expect(api.patch).toHaveBeenCalledWith(
        '/endereco/end-1',
        { logradouro: 'Rua Nova', numero: '20' },
        { signal: undefined }
      );
      expect(res.mensagem).toBe('Endereço atualizado');
    });

    it('deve atualizar o endereço existente quando saveOrUpdateMine encontrar endereço via getMine', async () => {
      const existing = {
        id_endereco: 'end-99',
        id_usuario: 'user-99',
        logradouro: 'Rua Antiga',
        numero: '1',
        cep: '80000000',
        cidade: 'Curitiba',
        uf: 'PR',
      };

      vi.mocked(api.get).mockResolvedValueOnce({ data: existing });
      vi.mocked(api.patch).mockResolvedValueOnce({
        data: {
          mensagem: 'Endereço atualizado',
          endereco: { ...existing, logradouro: 'Rua Salva' },
        },
      });

      await enderecoService.saveOrUpdateMine({
        id_usuario: 'user-99',
        cep: '80000000',
        logradouro: 'Rua Salva',
        numero: '1',
        cidade: 'Curitiba',
        uf: 'PR',
      });

      expect(api.get).toHaveBeenCalledWith('/endereco/me', { signal: undefined });
      expect(api.patch).toHaveBeenCalledWith(
        '/endereco/end-99',
        expect.objectContaining({ logradouro: 'Rua Salva' }),
        { signal: undefined }
      );
    });

    it('deve criar novo endereço via POST /endereco quando saveOrUpdateMine não encontrar endereço existente', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Nenhum endereço'));
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          id_endereco: 'end-novo',
          id_usuario: 'user-99',
          logradouro: 'Rua Criada',
          numero: '50',
          cep: '80000000',
          cidade: 'Curitiba',
          uf: 'PR',
        },
      });

      await enderecoService.saveOrUpdateMine({
        id_usuario: 'user-99',
        cep: '80000000',
        logradouro: 'Rua Criada',
        numero: '50',
        cidade: 'Curitiba',
        uf: 'PR',
      });

      expect(api.post).toHaveBeenCalledWith(
        '/endereco',
        expect.objectContaining({ logradouro: 'Rua Criada' }),
        { signal: undefined }
      );
    });
  });
});
