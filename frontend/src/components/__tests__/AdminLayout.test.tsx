import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { AdminLayout } from '../AdminLayout';

describe('AdminLayout (Layout Administrativo)', () => {
  it('deve renderizar o layout com navegação e conteúdo filho', () => {
    const onNavigateMock = vi.fn();
    const onLogoutMock = vi.fn();

    const element = AdminLayout({
      activeItem: 'categorias',
      onNavigate: onNavigateMock,
      onLogout: onLogoutMock,
      children: React.createElement('div', { id: 'conteudo-filho' }, 'Conteúdo de Teste'),
    });

    expect(element).toBeDefined();
    expect(React.isValidElement(element)).toBe(true);
    if (React.isValidElement<{ className?: string }>(element)) {
      expect(element.props.className).toContain('bg-[#F1BEC5]');
    }
  });
});
