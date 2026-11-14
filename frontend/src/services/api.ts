import axios, { AxiosError } from 'axios';

export interface ApiErrorResponse {
  erro?: string;
  erros?: string[];
  mensagem?: string;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Interceptor para injetar automaticamente o token de sessão nas requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const isApiError = (error: unknown): error is AxiosError<ApiErrorResponse> => {
  return axios.isAxiosError(error);
};

export function getApiErrorMessage(error: unknown, fallbackMessage = 'Erro inesperado ao realizar operação.'): string {
  if (isApiError(error)) {
    const data = error.response?.data;
    const msg = data?.erro || data?.erros?.[0] || data?.mensagem;
    if (msg) return msg;
    if (error.message === 'Network Error') {
      return 'Não foi possível conectar ao servidor. Verifique se a API está rodando.';
    }
    return fallbackMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
}
