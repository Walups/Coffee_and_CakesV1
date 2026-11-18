import { api, getApiErrorMessage } from './api';
import { enderecoService } from './enderecoService';
import type { EnderecoPayload, EnderecoResponse } from './enderecoService';
import { cleanDigits } from '../utils/validators';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nome_completo: string;
  cpf: string;
  email: string;
  telefone: string;
  password: string;
}

export interface UsuarioResponse {
  id_usuario: string;
  nome_completo: string;
  cpf: string;
  email: string;
  telefone: string;
  role: string;
  active: boolean;
  criado_em?: string;
}

export interface LoginResponse {
  mensagem: string;
  token: string;
  usuario: UsuarioResponse;
}

export interface RegisterResponse {
  mensagem: string;
  usuario: UsuarioResponse;
}

export interface CadastroCompletoInput {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
  rua: string;
  numero: string;
  cep: string;
  complemento?: string;
  cidade?: string;
  uf?: string;
}

export interface CadastroCompletoResponse {
  mensagem: string;
  usuario: UsuarioResponse;
  endereco: EnderecoResponse[] | EnderecoResponse;
}

export interface UserProfileData {
  nome_completo: string;
  email: string;
  rua?: string;
  numero?: string;
  cep?: string;
  complemento?: string;
}

export function getUserProfileStorageKey(userId?: string): string {
  return `@coffee-cakes:user-profile-${userId || 'default'}`;
}

export function getStoredUserProfile(userId?: string): UserProfileData | null {
  try {
    const key = getUserProfileStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfileData;
  } catch {
    return null;
  }
}

export function setStoredUserProfile(userId: string | undefined, data: UserProfileData): void {
  try {
    const key = getUserProfileStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // fallback se localStorage estiver indisponível
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

export function getStoredUsuario(): UsuarioResponse | null {
  try {
    const raw = localStorage.getItem('usuario');
    if (!raw) return null;
    return JSON.parse(raw) as UsuarioResponse;
  } catch {
    return null;
  }
}

export function setSession(token: string, usuario: UsuarioResponse): void {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

export function clearSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}

export function isAuthenticated(): boolean {
  return Boolean(getStoredToken() && getStoredUsuario());
}

export function isAdmin(): boolean {
  const usuario = getStoredUsuario();
  return Boolean(getStoredToken() && usuario?.role === 'admin');
}

export function logout(onNavigate?: (path: string) => void): void {
  clearSession();
  if (onNavigate) {
    onNavigate('/login');
  } else if (typeof window !== 'undefined') {
    window.history.pushState({}, '', '/login');
    if (typeof PopStateEvent !== 'undefined') {
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else if (typeof Event !== 'undefined') {
      window.dispatchEvent(new Event('popstate'));
    }
  }
}

export const usuarioService = {
  getStoredToken,
  getStoredUsuario,
  setSession,
  clearSession,
  isAuthenticated,
  isAdmin,
  logout,
  getUserProfileStorageKey,
  getStoredUserProfile,
  setStoredUserProfile,

  async getMe(signal?: AbortSignal): Promise<UsuarioResponse> {
    const response = await api.get<UsuarioResponse>('/usuario/me', { signal });
    return response.data;
  },

  async updateProfile(
    id_usuario: string,
    payload: { nome_completo?: string },
    signal?: AbortSignal
  ): Promise<{ mensagem: string; usuario: UsuarioResponse }> {
    const response = await api.patch<{ mensagem: string; usuario: UsuarioResponse }>(
      `/usuario/${id_usuario}`,
      payload,
      { signal }
    );
    if (response.data?.usuario) {
      const current = getStoredUsuario();
      if (current) {
        localStorage.setItem('usuario', JSON.stringify({ ...current, ...response.data.usuario }));
      }
    }
    return response.data;
  },

  async login(payload: LoginPayload, signal?: AbortSignal): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/usuario/login', payload, { signal });
    return response.data;
  },

  async register(payload: RegisterPayload, signal?: AbortSignal): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/usuario/register', payload, { signal });
    return response.data;
  },

  /**
   * Orquestra o cadastro completo:
   * 1º Cria o usuário via POST /usuario/register (limpando máscaras de CPF e telefone)
   * 2º Cria o endereço vinculado ao usuário via POST /endereco (limpando máscara de CEP)
   */
  async registerWithAddress(
    data: CadastroCompletoInput,
    signal?: AbortSignal
  ): Promise<CadastroCompletoResponse> {
    const cpfLimpo = cleanDigits(data.cpf);
    const telefoneLimpo = cleanDigits(data.telefone);
    const cepLimpo = cleanDigits(data.cep);

    // 1ª etapa: Criação do usuário
    const usuarioPayload: RegisterPayload = {
      nome_completo: data.nome.trim(),
      cpf: cpfLimpo,
      email: data.email.trim().toLowerCase(),
      telefone: telefoneLimpo,
      password: data.senha,
    };

    const userRes = await usuarioService.register(usuarioPayload, signal);
    const usuarioCriado = userRes.usuario;

    if (!usuarioCriado?.id_usuario) {
      throw new Error('Falha ao registrar usuário: ID do usuário não retornado.');
    }

    // 2ª etapa: Criação do endereço vinculado
    const enderecoPayload: EnderecoPayload = {
      id_usuario: usuarioCriado.id_usuario,
      cep: cepLimpo,
      logradouro: data.rua.trim(),
      numero: data.numero.trim(),
      cidade: (data.cidade || 'Curitiba').trim(),
      uf: (data.uf || 'PR').trim().toUpperCase(),
    };

    if (data.complemento && data.complemento.trim()) {
      enderecoPayload.complemento = data.complemento.trim();
    }

    try {
      const enderecoRes = await enderecoService.create(enderecoPayload, signal);
      return {
        mensagem: 'Cadastro realizado com sucesso!',
        usuario: usuarioCriado,
        endereco: enderecoRes,
      };
    } catch (err: unknown) {
      const detalheErro = getApiErrorMessage(err, 'Erro ao cadastrar endereço do usuário.');
      const erroComposto = new Error(`Falha no cadastro de endereço: ${detalheErro}`);
      Object.assign(erroComposto, {
        etapa: 'endereco',
        usuarioCriado,
        cause: err,
      });
      throw erroComposto;
    }
  },

  cadastrarComEndereco(data: CadastroCompletoInput, signal?: AbortSignal): Promise<CadastroCompletoResponse> {
    return this.registerWithAddress(data, signal);
  },
};
