import { api } from './api';

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
  async login(payload: LoginPayload, signal?: AbortSignal): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/usuario/login', payload, { signal });
    return response.data;
  },

  async register(payload: RegisterPayload, signal?: AbortSignal): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/usuario/register', payload, { signal });
    return response.data;
  },
};
