import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';

describe('API Interceptor (Header de Autorização)', () => {
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

  it('deve anexar o header Authorization no formato Bearer <token> quando o token existir no localStorage', async () => {
    mockStorage['token'] = 'meu-jwt-token-12345';

    // Dispara a cadeia de interceptors de request do Axios
    // Axios armazena interceptors em api.interceptors.request.handlers
    // Podemos invocar o interceptor diretamente com um config mock
    const requestHandlers = (api.interceptors.request as unknown as { handlers: Array<{ fulfilled: (config: Record<string, unknown>) => Record<string, unknown> }> }).handlers;
    const authInterceptor = requestHandlers.find((h) => typeof h?.fulfilled === 'function')?.fulfilled;

    expect(authInterceptor).toBeDefined();

    const config = { headers: {} };
    const modifiedConfig = authInterceptor!(config);

    expect(modifiedConfig.headers).toHaveProperty('Authorization', 'Bearer meu-jwt-token-12345');
  });

  it('não deve injetar Authorization se não houver token no localStorage', async () => {
    delete mockStorage['token'];

    const requestHandlers = (api.interceptors.request as unknown as { handlers: Array<{ fulfilled: (config: Record<string, unknown>) => Record<string, unknown> }> }).handlers;
    const authInterceptor = requestHandlers.find((h) => typeof h?.fulfilled === 'function')?.fulfilled;

    const config = { headers: {} };
    const modifiedConfig = authInterceptor!(config);

    expect(modifiedConfig.headers).not.toHaveProperty('Authorization');
  });
});
