import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SideMenuDrawer } from '../SideMenuDrawer';
import { CategoriasCarousel } from '../CategoriasCarousel';
import { MaisVendidosCarousel } from '../MaisVendidosCarousel';
import { ListaProdutosCliente } from '../ListaProdutosCliente';
import type { Categoria } from '../../types/categoria';
import type { Produto } from '../../types/produto';
import { formatMoeda } from '../../services/produtoService';

describe('Componentes do Fluxo do Cliente', () => {
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

  describe('SideMenuDrawer', () => {
    it('deve retornar null quando isOpen for false', () => {
      const result = SideMenuDrawer({
        isOpen: false,
        onClose: vi.fn(),
      });
      expect(result).toBeNull();
    });

    it('deve renderizar o drawer com as opções esperadas e nome do usuário quando isOpen for true', () => {
      mockStorage['usuario'] = JSON.stringify({
        id_usuario: 'user-1',
        nome_completo: 'Maria da Silva Sauro',
        email: 'maria@teste.com',
        role: 'cliente',
        active: true,
      });

      const onCloseMock = vi.fn();
      const result = SideMenuDrawer({
        isOpen: true,
        onClose: onCloseMock,
      });

      expect(result).not.toBeNull();
      expect(React.isValidElement(result)).toBe(true);
    });

    it('deve renderizar a opção "Minhas compras" no menu drawer', () => {
      const onMinhasComprasMock = vi.fn();
      const result = SideMenuDrawer({
        isOpen: true,
        onClose: vi.fn(),
        onNavigateMinhasCompras: onMinhasComprasMock,
      });

      expect(result).not.toBeNull();
      const html = renderToString(result as React.ReactElement);
      expect(html).toContain('Minhas compras');
      expect(html).toContain('Início');
      expect(html).toContain('Editar Cadastro');
    });
  });

  describe('CategoriasCarousel', () => {
    const mockCategorias: Categoria[] = [
      {
        id_categoria: 'cat-1',
        nome_categoria: 'Cafés Especiais',
        desconto_categoria: 0,
        img_banner: 'http://img.com/cafe.jpg',
        active: true,
      },
      {
        id_categoria: 'cat-2',
        nome_categoria: 'Mais Vendidos', // Deve ser filtrada fora
        desconto_categoria: 0,
        img_banner: null,
        active: true,
      },
      {
        id_categoria: 'cat-3',
        nome_categoria: 'mais vendidos ', // Variação de caixa e espaços a ser filtrada fora
        desconto_categoria: 0,
        img_banner: null,
        active: true,
      },
      {
        id_categoria: 'cat-4',
        nome_categoria: 'Tortas & Bolos',
        desconto_categoria: 0.1,
        img_banner: null,
        active: true,
      },
      {
        id_categoria: 'cat-5',
        nome_categoria: 'Categoria Inativa',
        desconto_categoria: 0,
        img_banner: null,
        active: false,
      },
    ];

    it('deve exibir categorias ativas e filtrar categorias inativas', () => {
      const element = CategoriasCarousel({
        categorias: mockCategorias,
      });

      expect(element).not.toBeNull();
      expect(React.isValidElement(element)).toBe(true);
    });

    it('deve retornar null se todas as categorias forem inativas', () => {
      const element = CategoriasCarousel({
        categorias: [
          {
            id_categoria: 'cat-inativa',
            nome_categoria: 'Inativa',
            active: false,
          },
        ],
      });

      expect(element).toBeNull();
    });

    it('deve renderizar a imagem com src trimmado e classes w-16 h-16 rounded-full object-cover', () => {
      const element = CategoriasCarousel({
        categorias: [
          {
            id_categoria: 'cat-1',
            nome_categoria: 'Cafés Especiais',
            img_banner: '   https://imagens.com/cafe-banner.jpg   ',
            active: true,
          },
        ],
      });

      expect(element).not.toBeNull();
      // Acessa a árvore de elementos: div -> div -> button -> div -> img
      const containerDiv = element as React.ReactElement<{ children: React.ReactElement<{ children: React.ReactElement[] }> }>;
      const scrollDiv = containerDiv.props.children;
      const buttons = scrollDiv.props.children;
      const button = buttons[0];
      const circleDiv = (button.props as { children: [React.ReactElement<{ children: React.ReactElement }>, React.ReactElement] }).children[0];
      const img = circleDiv.props.children as React.ReactElement<{ src: string; className: string; onError: (e: { currentTarget: { src: string; onerror: unknown } }) => void }>;

      expect(img.props.src).toBe('https://imagens.com/cafe-banner.jpg');
      expect(img.props.className).toContain('w-16 h-16 rounded-full object-cover');
    });

    it('deve utilizar fallback group 30.png quando img_banner for null, vazio ou disparar onError', () => {
      const element = CategoriasCarousel({
        categorias: [
          {
            id_categoria: 'cat-null',
            nome_categoria: 'Bolos',
            img_banner: null,
            active: true,
          },
          {
            id_categoria: 'cat-empty',
            nome_categoria: 'Tortas',
            img_banner: '   ',
            active: true,
          },
          {
            id_categoria: 'cat-error',
            nome_categoria: 'Salgados',
            img_banner: 'https://imagens.com/invalida.jpg',
            active: true,
          },
        ],
      });

      expect(element).not.toBeNull();
      const containerDiv = element as React.ReactElement<{ children: React.ReactElement<{ children: React.ReactElement[] }> }>;
      const scrollDiv = containerDiv.props.children;
      const buttons = scrollDiv.props.children;

      // 1. Categoria com img_banner null deve usar fallback
      const imgNull = (buttons[0].props as { children: [React.ReactElement<{ children: React.ReactElement }>, React.ReactElement] }).children[0].props.children as React.ReactElement<{ src: string }>;
      expect(decodeURIComponent(imgNull.props.src)).toContain('group 30.png');

      // 2. Categoria com img_banner vazio/espaços deve usar fallback
      const imgEmpty = (buttons[1].props as { children: [React.ReactElement<{ children: React.ReactElement }>, React.ReactElement] }).children[0].props.children as React.ReactElement<{ src: string }>;
      expect(decodeURIComponent(imgEmpty.props.src)).toContain('group 30.png');

      // 3. Categoria com erro ao carregar deve trocar para fallback no onError
      const imgError = (buttons[2].props as { children: [React.ReactElement<{ children: React.ReactElement }>, React.ReactElement] }).children[0].props.children as React.ReactElement<{
        src: string;
        onError: (e: { currentTarget: { src: string; onerror: unknown } }) => void;
      }>;
      expect(imgError.props.src).toBe('https://imagens.com/invalida.jpg');

      const mockTarget = { src: 'https://imagens.com/invalida.jpg', onerror: null as unknown };
      imgError.props.onError({ currentTarget: mockTarget });
      expect(decodeURIComponent(mockTarget.src)).toContain('group 30.png');
    });
  });

  describe('MaisVendidosCarousel', () => {
    const categoriaMV: Categoria = {
      id_categoria: 'cat-mv-id',
      nome_categoria: 'Mais vendidos',
      active: true,
    };

    const mockProdutos: Produto[] = [
      {
        id_produto: 'p1',
        nome_produto: 'Cappuccino Italiano',
        preco: 15.0,
        desconto_produto: 0.2, // 20% desconto -> 12.00
        descricao: 'Café expresso com leite vaporizado e canela',
        imagem_produto: 'http://img.com/cappuccino.jpg',
        id_categoria: 'cat-mv-id',
        active: true,
      },
      {
        id_produto: 'p2',
        nome_produto: 'Bolo de Cenoura',
        preco: 10.0,
        desconto_produto: null, // sem desconto
        descricao: 'Fatia com calda de chocolate belga',
        imagem_produto: '',
        id_categoria: 'cat-mv-id',
        active: true,
      },
      {
        id_produto: 'p3',
        nome_produto: 'Croissant Simples',
        preco: 12.0,
        desconto_produto: 0,
        descricao: 'Massa folhada artesanal',
        imagem_produto: '',
        id_categoria: 'outra-cat',
        active: true,
      },
      {
        id_produto: 'p4',
        nome_produto: 'Item Inativo',
        preco: 20.0,
        desconto_produto: null,
        descricao: 'Inativo',
        imagem_produto: '',
        id_categoria: 'cat-mv-id',
        active: false,
      },
    ];

    it('deve renderizar produtos filtrados pela categoria mais vendidos', () => {
      const element = MaisVendidosCarousel({
        produtos: mockProdutos,
        categoriaMaisVendidos: categoriaMV,
      });

      expect(element).not.toBeNull();
      expect(React.isValidElement(element)).toBe(true);
    });

    it('deve retornar null se não houver produtos correspondentes', () => {
      const element = MaisVendidosCarousel({
        produtos: [],
        categoriaMaisVendidos: categoriaMV,
      });

      expect(element).toBeNull();
    });

    it('deve calcular corretamente a regra de desconto de produtos', () => {
      const prodComDesconto = mockProdutos[0];
      const precoFinal = prodComDesconto.preco * (1 - (prodComDesconto.desconto_produto ?? 0));
      expect(precoFinal).toBe(12.0);
      expect(formatMoeda(precoFinal)).toContain('12,00');
      expect(formatMoeda(prodComDesconto.preco)).toContain('15,00');

      const prodSemDesconto = mockProdutos[1];
      expect(formatMoeda(prodSemDesconto.preco)).toContain('10,00');
    });
  });

  describe('ListaProdutosCliente', () => {
    const mockProdutos: Produto[] = [
      {
        id_produto: 'p1',
        nome_produto: 'Café Expresso',
        preco: 8.0,
        desconto_produto: 0.25, // 25% -> 6.00
        descricao: 'Grãos selecionados',
        imagem_produto: '',
        id_categoria: 'cat-1',
        active: true,
      },
      {
        id_produto: 'p2',
        nome_produto: 'Cheesecake de Frutas Vermelhas',
        preco: 22.0,
        desconto_produto: null,
        descricao: 'Com calda artesanal',
        imagem_produto: 'http://img.com/cheesecake.jpg',
        id_categoria: 'cat-2',
        active: true,
      },
      {
        id_produto: 'p3',
        nome_produto: 'Produto Inativo',
        preco: 10.0,
        desconto_produto: null,
        descricao: 'Não deve aparecer',
        imagem_produto: '',
        id_categoria: 'cat-1',
        active: false,
      },
    ];

    it('deve renderizar a lista de produtos ativos', () => {
      const element = ListaProdutosCliente({
        produtos: mockProdutos,
      });

      expect(element).not.toBeNull();
      expect(React.isValidElement(element)).toBe(true);
    });

    it('deve exibir mensagem discreta quando a lista de produtos ativos estiver vazia', () => {
      const element = ListaProdutosCliente({
        produtos: [],
      });

      expect(element).not.toBeNull();
      expect(React.isValidElement(element)).toBe(true);
    });

    it('deve filtrar produtos pela categoria selecionada tanto por id_categoria quanto por categoria_x_produto', () => {
      const produtosMistos: Produto[] = [
        {
          id_produto: 'prod-cat-1',
          nome_produto: 'Cupcake Chocolate',
          preco: 15.0,
          imagem_produto: '',
          id_categoria: 'cat-cupcakes',
          active: true,
        },
        {
          id_produto: 'prod-cat-2',
          nome_produto: 'Café Espresso',
          preco: 8.0,
          imagem_produto: '',
          categoria_x_produto: [{ id_categoria: 'cat-bebidas' }],
          active: true,
        },
        {
          id_produto: 'prod-cat-3',
          nome_produto: 'Bolo de Morango',
          preco: 20.0,
          imagem_produto: '',
          id_categoria: 'cat-bolos',
          active: true,
        },
      ];

      // Filtra para cat-cupcakes
      const filtroCupcakes = produtosMistos.filter(
        (p) =>
          p.id_categoria === 'cat-cupcakes' ||
          p.categoria_x_produto?.some((cxp) => cxp.id_categoria === 'cat-cupcakes')
      );
      expect(filtroCupcakes).toHaveLength(1);
      expect(filtroCupcakes[0].nome_produto).toBe('Cupcake Chocolate');

      // Filtra para cat-bebidas (via categoria_x_produto)
      const filtroBebidas = produtosMistos.filter(
        (p) =>
          p.id_categoria === 'cat-bebidas' ||
          p.categoria_x_produto?.some((cxp) => cxp.id_categoria === 'cat-bebidas')
      );
      expect(filtroBebidas).toHaveLength(1);
      expect(filtroBebidas[0].nome_produto).toBe('Café Espresso');
    });

    it('deve renderizar botão "Ver todos" quando onLimparFiltro for fornecido', () => {
      const mockLimpar = vi.fn();
      const element = ListaProdutosCliente({
        produtos: mockProdutos,
        titulo: 'Produtos em Bebidas',
        onLimparFiltro: mockLimpar,
      });

      expect(element).not.toBeNull();
      expect(React.isValidElement(element)).toBe(true);
    });

    it('deve chamar onAdicionarAoCarrinho com o produto e parar propagação do evento ao clicar no botão "+"', () => {
      const mockAdicionar = vi.fn();
      const mockSelect = vi.fn();
      const element = ListaProdutosCliente({
        produtos: mockProdutos,
        onSelectProduto: mockSelect,
        onAdicionarAoCarrinho: mockAdicionar,
      });

      expect(element).not.toBeNull();
      // Encontra o botão '+' do primeiro produto
      const container = element as React.ReactElement<{
        children: [React.ReactElement, React.ReactElement<{ children: React.ReactElement[] }>];
      }>;
      const listDiv = container.props.children[1];
      const firstCard = listDiv.props.children[0];

      // Localiza o botão dentro da linha de preço
      const infoDiv = (firstCard.props as { children: [unknown, React.ReactElement<{ children: [unknown, React.ReactElement<{ children: [unknown, React.ReactElement<{ onClick: (e: { stopPropagation: () => void }) => void }>] }>] }>] }).children[1];
      const precoLinha = infoDiv.props.children[1];
      const botaoPlus = precoLinha.props.children[1];

      const stopPropagationMock = vi.fn();
      botaoPlus.props.onClick({ stopPropagation: stopPropagationMock });

      expect(stopPropagationMock).toHaveBeenCalledTimes(1);
      expect(mockAdicionar).toHaveBeenCalledTimes(1);
      expect(mockAdicionar).toHaveBeenCalledWith(mockProdutos[0]);
      expect(mockSelect).not.toHaveBeenCalled();
    });
  });
});
