import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PerfilCliente } from '../../pages/PerfilCliente';

describe('Tela PerfilCliente (Atualizar cadastro do cliente)', () => {
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

  it('deve renderizar o cabeçalho padrão com botão de voltar para vitrine, logo e botão de menu', () => {
    const html = renderToString(<PerfilCliente onNavigate={vi.fn()} onLogout={vi.fn()} />);

    // Cabeçalho rosado padrão (#F8C8CE)
    expect(html).toContain('bg-[#F8C8CE]');
    // Botão de voltar para vitrine
    expect(html).toContain('aria-label="Voltar para a vitrine"');
    // Alt da logo do projeto (renderizado como &amp; no SSR)
    expect(html).toContain('alt="Coffee &amp; Cakes"');
    // Botão de abrir menu lateral
    expect(html).toContain('aria-label="Abrir menu"');
  });

  it('deve renderizar o título em negrito "Atualizar cadastro" e fundo creme #FDE5D7', () => {
    const html = renderToString(<PerfilCliente />);

    expect(html).toContain('Atualizar cadastro');
    expect(html).toContain('bg-[#FDE5D7]');
    expect(html).toContain('text-[#5B2418]');
  });

  it('deve renderizar o Bloco 1 (Dados Pessoais) com Nome completo e E-mail', () => {
    mockStorage['usuario'] = JSON.stringify({
      id_usuario: 'user-001',
      nome_completo: 'Fernanda Montenegro',
      email: 'fernanda@globo.com',
      role: 'cliente',
      active: true,
    });

    const html = renderToString(<PerfilCliente />);

    expect(html).toContain('placeholder="Nome completo"');
    expect(html).toContain('placeholder="E-mail"');
    expect(html.toLowerCase()).toContain('readonly');
  });

  it('deve renderizar o Bloco 2 (Endereço) com Rua, grid com Número e CEP, e Complemento', () => {
    const html = renderToString(<PerfilCliente />);

    expect(html).toContain('placeholder="Rua"');
    expect(html).toContain('placeholder="Número"');
    expect(html).toContain('placeholder="CEP"');
    expect(html).toContain('placeholder="Complemento"');
    // Duas colunas com gap-4 especificado no layout
    expect(html).toContain('grid grid-cols-2 gap-4');
  });

  it('deve renderizar o botão principal centralizado com fundo marrom café #5C2A14 e texto "Salvar alterações"', () => {
    const html = renderToString(<PerfilCliente />);

    expect(html).toContain('Salvar alterações');
    expect(html).toContain('bg-[#5C2A14]');
    expect(html).toContain('justify-center');
  });

  it('deve pré-carregar os dados salvos no localStorage com a chave @coffee-cakes:user-profile-${userId}', () => {
    mockStorage['usuario'] = JSON.stringify({
      id_usuario: 'user-vip',
      nome_completo: 'Usuario Original',
      email: 'vip@teste.com',
      role: 'cliente',
      active: true,
    });

    mockStorage['@coffee-cakes:user-profile-user-vip'] = JSON.stringify({
      nome_completo: 'Usuario Salvo Localmente',
      email: 'vip@teste.com',
      rua: 'Avenida Paulista',
      numero: '1000',
      cep: '01310100',
      complemento: 'Conjunto 50',
    });

    const html = renderToString(<PerfilCliente />);

    expect(html).toContain('value="Usuario Salvo Localmente"');
    expect(html).toContain('value="vip@teste.com"');
    expect(html).toContain('value="Avenida Paulista"');
    expect(html).toContain('value="1000"');
    expect(html).toContain('value="Conjunto 50"');
  });
});
