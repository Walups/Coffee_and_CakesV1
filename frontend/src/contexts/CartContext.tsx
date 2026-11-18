/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type FC,
  type ReactNode,
} from 'react';

export interface CartItem {
  produtoId: number | string;
  nome: string;
  imagem: string;
  precoOriginal: number;
  precoUnitario: number;
  quantidade: number;
  observacoes: string;
}

export interface AddCartItemInput {
  produtoId: number | string;
  nome: string;
  imagem: string;
  precoOriginal: number;
  precoUnitario: number;
  quantidade?: number;
  observacoes?: string;
}

export interface CartContextType {
  items: CartItem[];
  totalItens: number;
  subtotalSemDesconto: number;
  totalDescontos: number;
  subtotalComDesconto: number;
  addItem: (item: AddCartItemInput) => void;
  updateQuantity: (index: number, quantidade: number) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
}

export const CART_STORAGE_KEY = '@coffee-cakes:cart';

/**
 * Adiciona item ao carrinho respeitando as regras de negócio:
 * - Quantidade padrão: 1
 * - Observações padrão: ""
 * - Normalização de observações com .trim()
 * - Se produtoId e observações normalizadas forem iguais, soma a quantidade;
 * - Caso contrário, adiciona como novo item.
 */
export function addItemToCart(
  items: CartItem[],
  item: AddCartItemInput
): CartItem[] {
  const quantidade = item.quantidade ?? 1;
  if (quantidade <= 0) return items;

  const observacoes = (item.observacoes ?? '').trim();

  const existingIndex = items.findIndex(
    (i) =>
      String(i.produtoId) === String(item.produtoId) &&
      i.observacoes === observacoes
  );

  if (existingIndex !== -1) {
    const updated = [...items];
    const existing = updated[existingIndex];
    updated[existingIndex] = {
      ...existing,
      quantidade: existing.quantidade + quantidade,
    };
    return updated;
  }

  const newItem: CartItem = {
    produtoId: item.produtoId,
    nome: item.nome,
    imagem: item.imagem,
    precoOriginal: item.precoOriginal,
    precoUnitario: item.precoUnitario,
    quantidade,
    observacoes,
  };

  return [...items, newItem];
}

/**
 * Atualiza a quantidade do item no índice fornecido.
 * Se a nova quantidade for <= 0, remove o item.
 */
export function updateItemQuantity(
  items: CartItem[],
  index: number,
  quantidade: number
): CartItem[] {
  if (index < 0 || index >= items.length) return items;
  if (quantidade <= 0) {
    return items.filter((_, i) => i !== index);
  }
  const updated = [...items];
  updated[index] = {
    ...updated[index],
    quantidade,
  };
  return updated;
}

/**
 * Remove o item no índice fornecido.
 */
export function removeItemFromCart(
  items: CartItem[],
  index: number
): CartItem[] {
  if (index < 0 || index >= items.length) return items;
  return items.filter((_, i) => i !== index);
}

/**
 * Calcula os totais acumulados do carrinho com precisão monetária.
 */
export function calculateCartTotals(items: CartItem[]) {
  const totalItens = items.reduce((acc, item) => acc + item.quantidade, 0);

  const subtotalSemDesconto = Number(
    items
      .reduce((acc, item) => acc + item.precoOriginal * item.quantidade, 0)
      .toFixed(2)
  );

  const totalDescontos = Number(
    items
      .reduce(
        (acc, item) =>
          acc + (item.precoOriginal - item.precoUnitario) * item.quantidade,
        0
      )
      .toFixed(2)
  );

  const subtotalComDesconto = Number(
    items
      .reduce((acc, item) => acc + item.precoUnitario * item.quantidade, 0)
      .toFixed(2)
  );

  return {
    totalItens,
    subtotalSemDesconto,
    totalDescontos,
    subtotalComDesconto,
  };
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined' && typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const storage =
        typeof window !== 'undefined' ? window.localStorage : globalThis.localStorage;
      const stored = storage?.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Erro ao ler carrinho do localStorage:', error);
    }
    return [];
  });

  useEffect(() => {
    try {
      const storage =
        typeof window !== 'undefined' ? window.localStorage : globalThis.localStorage;
      storage?.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Erro ao salvar carrinho no localStorage:', error);
    }
  }, [items]);

  const addItem = (item: AddCartItemInput) => {
    setItems((prev) => addItemToCart(prev, item));
  };

  const updateQuantity = (index: number, quantidade: number) => {
    setItems((prev) => updateItemQuantity(prev, index, quantidade));
  };

  const removeItem = (index: number) => {
    setItems((prev) => removeItemFromCart(prev, index));
  };

  const clearCart = () => {
    setItems([]);
  };

  const { totalItens, subtotalSemDesconto, totalDescontos, subtotalComDesconto } =
    useMemo(() => calculateCartTotals(items), [items]);

  const value: CartContextType = {
    items,
    totalItens,
    subtotalSemDesconto,
    totalDescontos,
    subtotalComDesconto,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}
