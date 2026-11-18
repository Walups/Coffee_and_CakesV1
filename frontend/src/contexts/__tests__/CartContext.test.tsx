import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  CartProvider,
  useCart,
  CART_STORAGE_KEY,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  calculateCartTotals,
  type AddCartItemInput,
  type CartItem,
  type CartContextType,
} from '../CartContext';

describe('CartContext & Funções Puras de Negócio do Carrinho', () => {
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

  describe('addItemToCart (Regras de Adição)', () => {
    it('deve adicionar item rápido com quantidade padrão 1 e observações padrão ""', () => {
      const items: CartItem[] = [];
      const input: AddCartItemInput = {
        produtoId: 'prod-1',
        nome: 'Cappuccino Italiano',
        imagem: 'http://img.com/cap.jpg',
        precoOriginal: 15.0,
        precoUnitario: 12.0,
      };

      const resultado = addItemToCart(items, input);

      expect(resultado).toHaveLength(1);
      expect(resultado[0]).toEqual({
        produtoId: 'prod-1',
        nome: 'Cappuccino Italiano',
        imagem: 'http://img.com/cap.jpg',
        precoOriginal: 15.0,
        precoUnitario: 12.0,
        quantidade: 1,
        observacoes: '',
      });
    });

    it('deve normalizar observações com .trim() e somar quantidade ao adicionar mesmo produtoId com as mesmas observações', () => {
      const items: CartItem[] = [
        {
          produtoId: 'prod-1',
          nome: 'Café Espresso',
          imagem: '',
          precoOriginal: 8.0,
          precoUnitario: 8.0,
          quantidade: 2,
          observacoes: 'sem açúcar',
        },
      ];

      // Entrada com espaços ao redor das observações
      const input: AddCartItemInput = {
        produtoId: 'prod-1',
        nome: 'Café Espresso',
        imagem: '',
        precoOriginal: 8.0,
        precoUnitario: 8.0,
        quantidade: 3,
        observacoes: '   sem açúcar   ',
      };

      const resultado = addItemToCart(items, input);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].quantidade).toBe(5);
      expect(resultado[0].observacoes).toBe('sem açúcar');
    });

    it('deve criar itens separados se as observações forem diferentes mesmo para o mesmo produtoId', () => {
      const items: CartItem[] = [
        {
          produtoId: 'prod-1',
          nome: 'Café Espresso',
          imagem: '',
          precoOriginal: 8.0,
          precoUnitario: 8.0,
          quantidade: 1,
          observacoes: 'Sem açúcar',
        },
      ];

      const input: AddCartItemInput = {
        produtoId: 'prod-1',
        nome: 'Café Espresso',
        imagem: '',
        precoOriginal: 8.0,
        precoUnitario: 8.0,
        quantidade: 2,
        observacoes: 'Com leite vegetal',
      };

      const resultado = addItemToCart(items, input);

      expect(resultado).toHaveLength(2);
      expect(resultado[0].observacoes).toBe('Sem açúcar');
      expect(resultado[0].quantidade).toBe(1);
      expect(resultado[1].observacoes).toBe('Com leite vegetal');
      expect(resultado[1].quantidade).toBe(2);
    });

    it('deve casar produtoId seja ele número ou string', () => {
      const items: CartItem[] = [
        {
          produtoId: 42,
          nome: 'Torta Holandesa',
          imagem: '',
          precoOriginal: 18.0,
          precoUnitario: 18.0,
          quantidade: 1,
          observacoes: '',
        },
      ];

      const input: AddCartItemInput = {
        produtoId: '42',
        nome: 'Torta Holandesa',
        imagem: '',
        precoOriginal: 18.0,
        precoUnitario: 18.0,
        quantidade: 2,
      };

      const resultado = addItemToCart(items, input);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].quantidade).toBe(3);
    });

    it('não deve alterar a lista se quantidade fornecida for <= 0', () => {
      const items: CartItem[] = [
        {
          produtoId: 'p1',
          nome: 'Item',
          imagem: '',
          precoOriginal: 10,
          precoUnitario: 10,
          quantidade: 1,
          observacoes: '',
        },
      ];

      const resultado = addItemToCart(items, {
        produtoId: 'p1',
        nome: 'Item',
        imagem: '',
        precoOriginal: 10,
        precoUnitario: 10,
        quantidade: 0,
      });

      expect(resultado).toBe(items);
      expect(resultado[0].quantidade).toBe(1);
    });
  });

  describe('updateItemQuantity (Atualização de Quantidade)', () => {
    const itemsIniciais: CartItem[] = [
      {
        produtoId: 'p1',
        nome: 'Item 1',
        imagem: '',
        precoOriginal: 10,
        precoUnitario: 10,
        quantidade: 2,
        observacoes: '',
      },
      {
        produtoId: 'p2',
        nome: 'Item 2',
        imagem: '',
        precoOriginal: 20,
        precoUnitario: 20,
        quantidade: 1,
        observacoes: '',
      },
    ];

    it('deve atualizar a quantidade do item especificado', () => {
      const resultado = updateItemQuantity(itemsIniciais, 0, 5);
      expect(resultado[0].quantidade).toBe(5);
      expect(resultado[1].quantidade).toBe(1);
    });

    it('deve remover o item se a nova quantidade for <= 0', () => {
      const resultado = updateItemQuantity(itemsIniciais, 0, 0);
      expect(resultado).toHaveLength(1);
      expect(resultado[0].produtoId).toBe('p2');

      const resultadoNegativo = updateItemQuantity(itemsIniciais, 1, -1);
      expect(resultadoNegativo).toHaveLength(1);
      expect(resultadoNegativo[0].produtoId).toBe('p1');
    });

    it('deve ignorar índices inválidos fora dos limites', () => {
      const resMenor = updateItemQuantity(itemsIniciais, -1, 3);
      expect(resMenor).toBe(itemsIniciais);

      const resMaior = updateItemQuantity(itemsIniciais, 10, 3);
      expect(resMaior).toBe(itemsIniciais);
    });
  });

  describe('removeItemFromCart (Remoção de Item)', () => {
    const itemsIniciais: CartItem[] = [
      {
        produtoId: 'p1',
        nome: 'Item 1',
        imagem: '',
        precoOriginal: 10,
        precoUnitario: 10,
        quantidade: 1,
        observacoes: '',
      },
      {
        produtoId: 'p2',
        nome: 'Item 2',
        imagem: '',
        precoOriginal: 20,
        precoUnitario: 20,
        quantidade: 1,
        observacoes: '',
      },
    ];

    it('deve remover o item no índice especificado', () => {
      const resultado = removeItemFromCart(itemsIniciais, 0);
      expect(resultado).toHaveLength(1);
      expect(resultado[0].produtoId).toBe('p2');
    });

    it('deve ignorar índices inexistentes', () => {
      const resultado = removeItemFromCart(itemsIniciais, 99);
      expect(resultado).toBe(itemsIniciais);
    });
  });

  describe('calculateCartTotals (Cálculos de Subtotais e Descontos)', () => {
    it('deve retornar zeros quando o carrinho estiver vazio', () => {
      const totais = calculateCartTotals([]);
      expect(totais).toEqual({
        totalItens: 0,
        subtotalSemDesconto: 0,
        totalDescontos: 0,
        subtotalComDesconto: 0,
      });
    });

    it('deve calcular corretamente totais com itens com e sem desconto', () => {
      const items: CartItem[] = [
        {
          produtoId: 'prod-1',
          nome: 'Cappuccino com Desconto',
          imagem: '',
          precoOriginal: 15.0,
          precoUnitario: 12.0, // Desconto de 3.00 cada
          quantidade: 2,
          observacoes: '',
        },
        {
          produtoId: 'prod-2',
          nome: 'Bolo sem Desconto',
          imagem: '',
          precoOriginal: 10.5,
          precoUnitario: 10.5, // Sem desconto
          quantidade: 3,
          observacoes: '',
        },
      ];

      const totais = calculateCartTotals(items);

      // totalItens: 2 + 3 = 5
      expect(totais.totalItens).toBe(5);

      // subtotalSemDesconto: (15.00 * 2) + (10.50 * 3) = 30 + 31.5 = 61.50
      expect(totais.subtotalSemDesconto).toBe(61.5);

      // totalDescontos: ((15.00 - 12.00) * 2) + 0 = 6.00
      expect(totais.totalDescontos).toBe(6.0);

      // subtotalComDesconto: (12.00 * 2) + (10.50 * 3) = 24 + 31.5 = 55.50
      expect(totais.subtotalComDesconto).toBe(55.5);
    });
  });

  describe('CartProvider & useCart (Integração React e LocalStorage)', () => {
    it('deve lançar erro explicativo se useCart for chamado fora de CartProvider', () => {
      function ComponenteFora() {
        useCart();
        return <div>Fora</div>;
      }

      expect(() => {
        renderToString(<ComponenteFora />);
      }).toThrow('useCart deve ser usado dentro de um CartProvider');
    });

    it('deve carregar dados salvos no localStorage sob a chave @coffee-cakes:cart', () => {
      const itensSalvos: CartItem[] = [
        {
          produtoId: 'saved-1',
          nome: 'Croissant Recheado',
          imagem: 'http://img.com/croissant.jpg',
          precoOriginal: 14.0,
          precoUnitario: 11.2,
          quantidade: 3,
          observacoes: 'Aquecido',
        },
      ];
      mockStorage[CART_STORAGE_KEY] = JSON.stringify(itensSalvos);

      let contextCapturado: CartContextType | null = null;
      function TestConsumer() {
        contextCapturado = useCart();
        return <div>{contextCapturado.totalItens}</div>;
      }

      renderToString(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      expect(contextCapturado).not.toBeNull();
      expect(contextCapturado!.items).toEqual(itensSalvos);
      expect(contextCapturado!.totalItens).toBe(3);
      expect(contextCapturado!.subtotalSemDesconto).toBe(42.0);
      expect(contextCapturado!.totalDescontos).toBe(8.4);
      expect(contextCapturado!.subtotalComDesconto).toBe(33.6);
    });

    it('deve lidar graciosamente com JSON inválido no localStorage sem quebrar a aplicação', () => {
      mockStorage[CART_STORAGE_KEY] = 'invalido-json{[';

      let contextCapturado: CartContextType | null = null;
      function TestConsumer() {
        contextCapturado = useCart();
        return <div>{contextCapturado.totalItens}</div>;
      }

      renderToString(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      expect(contextCapturado).not.toBeNull();
      expect(contextCapturado!.items).toEqual([]);
      expect(contextCapturado!.totalItens).toBe(0);
    });
  });
});
