import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FormaPagamentoCard } from '../FormaPagamentoCard';
import { ConfirmacaoPedidoModal } from '../ConfirmacaoPedidoModal';
import { CarrinhoCliente, gerarCodigoPedidoPadrao } from '../CarrinhoCliente';
import { CartProvider, CART_STORAGE_KEY, type CartItem } from '../../contexts/CartContext';

describe('Tela do Carrinho e Subcomponentes', () => {
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

  describe('FormaPagamentoCard', () => {
    it('deve renderizar o título em marrom, texto de pagamento no balcão e subtítulo', () => {
      const html = renderToString(<FormaPagamentoCard />);

      expect(html).toContain('Forma de pagamento');
      expect(html).toContain('Pagamento no balcão');
      expect(html).toContain('Pague diretamente na retirada');
      expect(html).toContain('rounded-2xl');
      expect(html).toContain('text-[#5C2A14]');
    });

    it('deve aceitar classes customizadas adicionais via className', () => {
      const html = renderToString(<FormaPagamentoCard className="minha-classe-teste" />);
      expect(html).toContain('minha-classe-teste');
    });
  });

  describe('ConfirmacaoPedidoModal', () => {
    it('deve retornar null quando isOpen for false', () => {
      const html = renderToString(
        <ConfirmacaoPedidoModal
          isOpen={false}
          numeroPedido="#CC-1042"
          onConfirmar={vi.fn()}
        />
      );
      expect(html).toBe('');
    });

    it('deve renderizar o modal com o número do pedido gerado, aviso de pagamento no balcão e botão voltar à vitrine quando isOpen for true', () => {
      const onConfirmarMock = vi.fn();
      const html = renderToString(
        <ConfirmacaoPedidoModal
          isOpen={true}
          numeroPedido="#CC-1042"
          onConfirmar={onConfirmarMock}
        />
      );

      expect(html).toContain('Pedido enviado com sucesso!');
      expect(html).toContain('#CC-1042');
      expect(html).toContain('Pagamento no balcão');
      expect(html).toContain('Pague diretamente na retirada');
      expect(html).toContain('Voltar à vitrine');
      expect(html).toContain('bg-[#5C2A14]');
    });
  });

  describe('gerarCodigoPedidoPadrao', () => {
    it('deve gerar um código no formato #CC-XXXX com 4 dígitos numéricos', () => {
      const codigo = gerarCodigoPedidoPadrao();
      expect(codigo).toMatch(/^#CC-\d{4}$/);
    });
  });

  describe('CarrinhoCliente', () => {
    it('deve exibir estado vazio e NÃO renderizar o botão "Finalizar pedido" nem o card de pagamento quando o carrinho estiver vazio', () => {
      mockStorage[CART_STORAGE_KEY] = JSON.stringify([]);

      const html = renderToString(
        <CartProvider>
          <CarrinhoCliente onVoltar={vi.fn()} />
        </CartProvider>
      );

      expect(html).toContain('Seu carrinho está vazio no momento');
      expect(html).toContain('Voltar à vitrine');
      expect(html).not.toContain('Finalizar pedido');
      expect(html).not.toContain('Forma de pagamento');
    });

    it('deve renderizar itens, FormaPagamentoCard e o botão "Finalizar pedido" com cor #5C2A14 quando houver itens', () => {
      const itensCarrinho: CartItem[] = [
        {
          produtoId: 'prod-1',
          nome: 'Café Caramelo',
          imagem: 'http://img.com/cafe.jpg',
          precoOriginal: 18.0,
          precoUnitario: 15.0,
          quantidade: 2,
          observacoes: 'Sem canela',
        },
      ];
      mockStorage[CART_STORAGE_KEY] = JSON.stringify(itensCarrinho);

      const html = renderToString(
        <CartProvider>
          <CarrinhoCliente onVoltar={vi.fn()} />
        </CartProvider>
      );

      expect(html).toContain('Café Caramelo');
      expect(html).toContain('Sem canela');
      // Subcomponente Forma de Pagamento
      expect(html).toContain('Forma de pagamento');
      expect(html).toContain('Pagamento no balcão');
      expect(html).toContain('Pague diretamente na retirada');
      // Totais
      expect(html).toContain('Subtotal');
      expect(html).toContain('Total');
      // Botão Finalizar Pedido
      expect(html).toContain('Finalizar pedido');
      expect(html).toContain('bg-[#5C2A14]');
      expect(html).toContain('w-full');
      expect(html).toContain('rounded-2xl');
    });

    it('deve posicionar o card de forma de pagamento logo acima do subtotal e o botão logo abaixo', () => {
      const itensCarrinho: CartItem[] = [
        {
          produtoId: 'prod-1',
          nome: 'Bolo de Chocolate',
          imagem: '',
          precoOriginal: 20.0,
          precoUnitario: 20.0,
          quantidade: 1,
          observacoes: '',
        },
      ];
      mockStorage[CART_STORAGE_KEY] = JSON.stringify(itensCarrinho);

      const html = renderToString(
        <CartProvider>
          <CarrinhoCliente onVoltar={vi.fn()} />
        </CartProvider>
      );

      const idxFormaPagamento = html.indexOf('Forma de pagamento');
      const idxSubtotal = html.indexOf('Subtotal');
      const idxFinalizar = html.indexOf('Finalizar pedido');

      expect(idxFormaPagamento).toBeGreaterThan(-1);
      expect(idxSubtotal).toBeGreaterThan(-1);
      expect(idxFinalizar).toBeGreaterThan(-1);

      // Forma de pagamento deve vir antes de Subtotal
      expect(idxFormaPagamento).toBeLessThan(idxSubtotal);
      // Finalizar pedido deve vir depois de Subtotal
      expect(idxFinalizar).toBeGreaterThan(idxSubtotal);
    });

    it('deve ter o data-testid="btn-finalizar-pedido" no botão de finalizar pedido', () => {
      const itensCarrinho: CartItem[] = [
        {
          produtoId: 'prod-1',
          nome: 'Torta de Limão',
          imagem: '',
          precoOriginal: 15.0,
          precoUnitario: 15.0,
          quantidade: 1,
          observacoes: '',
        },
      ];
      mockStorage[CART_STORAGE_KEY] = JSON.stringify(itensCarrinho);

      const html = renderToString(
        <CartProvider>
          <CarrinhoCliente onVoltar={vi.fn()} />
        </CartProvider>
      );

      expect(html).toContain('data-testid="btn-finalizar-pedido"');
    });
  });
});
