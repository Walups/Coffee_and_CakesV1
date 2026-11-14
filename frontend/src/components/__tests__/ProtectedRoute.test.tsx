import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { ProtectedRoute } from '../ProtectedRoute';
import { AdminRoute } from '../AdminRoute';

describe('Guarda de Rotas (ProtectedRoute e AdminRoute)', () => {
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

    // Mock do useEffect para executar a verificação de redirecionamento durante o teste
    vi.spyOn(React, 'useEffect').mockImplementation((cb) => {
      cb();
    });
  });

  describe('ProtectedRoute', () => {
    it('deve redirecionar para /login e retornar null quando não autenticado', () => {
      const onNavigateMock = vi.fn();
      const child = React.createElement('div', null, 'Área Protegida');

      const result = ProtectedRoute({
        children: child,
        onNavigate: onNavigateMock,
      });

      expect(onNavigateMock).toHaveBeenCalledTimes(1);
      expect(onNavigateMock).toHaveBeenCalledWith('/login');
      expect(result).toBeNull();
    });

    it('deve renderizar children quando o usuário estiver autenticado', () => {
      mockStorage['token'] = 'token-cliente-valido';
      mockStorage['usuario'] = JSON.stringify({
        id_usuario: 'user-1',
        nome_completo: 'Cliente Teste',
        email: 'cliente@teste.com',
        role: 'cliente',
        active: true,
      });

      const onNavigateMock = vi.fn();
      const child = React.createElement('div', null, 'Área Protegida');

      const result = ProtectedRoute({
        children: child,
        onNavigate: onNavigateMock,
      });

      expect(onNavigateMock).not.toHaveBeenCalled();
      expect(result).not.toBeNull();
    });
  });

  describe('AdminRoute', () => {
    it('deve redirecionar para /login se não houver token/usuario salvo', () => {
      const onNavigateMock = vi.fn();
      const child = React.createElement('div', null, 'Painel Administrativo Restrito');

      const result = AdminRoute({
        children: child,
        onNavigate: onNavigateMock,
      });

      expect(onNavigateMock).toHaveBeenCalledWith('/login');
      expect(result).toBeDefined();
    });

    it('deve redirecionar para / se o usuário estiver logado com role diferente de admin (ex: cliente)', () => {
      mockStorage['token'] = 'token-cliente-logado';
      mockStorage['usuario'] = JSON.stringify({
        id_usuario: 'user-2',
        nome_completo: 'Cliente Comum',
        email: 'cliente@teste.com',
        role: 'cliente',
        active: true,
      });

      const onNavigateMock = vi.fn();
      const child = React.createElement('div', null, 'Painel Administrativo Restrito');

      const result = ProtectedRoute({
        requireAdmin: true,
        children: child,
        onNavigate: onNavigateMock,
      });

      expect(onNavigateMock).toHaveBeenCalledTimes(1);
      expect(onNavigateMock).toHaveBeenCalledWith('/');
      expect(result).toBeNull();
    });

    it('deve renderizar o conteúdo administrativo quando o usuário for admin', () => {
      mockStorage['token'] = 'token-admin-logado';
      mockStorage['usuario'] = JSON.stringify({
        id_usuario: 'admin-1',
        nome_completo: 'Administrador Supremo',
        email: 'admin@coffeecakes.com',
        role: 'admin',
        active: true,
      });

      const onNavigateMock = vi.fn();
      const child = React.createElement('div', null, 'Painel Administrativo Restrito');

      const result = ProtectedRoute({
        requireAdmin: true,
        children: child,
        onNavigate: onNavigateMock,
      });

      expect(onNavigateMock).not.toHaveBeenCalled();
      expect(result).not.toBeNull();
    });
  });
});
