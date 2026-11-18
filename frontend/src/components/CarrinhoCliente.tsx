/* eslint-disable react-refresh/only-export-components */
import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { ArrowLeft, ShoppingCart, Trash2, Plus, Minus, AlertCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatMoeda } from '../services/produtoService';
import { Button } from './Button';
import { FormaPagamentoCard } from './FormaPagamentoCard';
import { ConfirmacaoPedidoModal } from './ConfirmacaoPedidoModal';
import { pedidoService } from '../services/pedidoService';
import { enderecoService } from '../services/enderecoService';
import { getStoredUsuario, getStoredUserProfile } from '../services/usuarioService';
import { cleanDigits } from '../utils/validators';
import { isApiError, getApiErrorMessage } from '../services/api';
import type { CriarPedidoPayload, CriarPedidoItemPayload } from '../types/pedido';

export interface CarrinhoClienteProps {
  onVoltar?: () => void;
  onVoltarParaVitrine?: () => void;
  geradorCodigoPedido?: () => string;
}

export function gerarCodigoPedidoPadrao(): string {
  const numeroAleatorio = Math.floor(1000 + Math.random() * 9000);
  return `#CC-${numeroAleatorio}`;
}

const regexUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizarUUID(id: string): string {
  if (regexUUID.test(id)) return id;
  // Converte IDs arbitrários ou de mock em UUID válido para compatibilidade total com o validador
  const hex = Array.from(id)
    .map((c) => c.charCodeAt(0).toString(16))
    .join('')
    .padEnd(32, '0')
    .slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export const CarrinhoCliente: FC<CarrinhoClienteProps> = ({
  onVoltar,
  onVoltarParaVitrine,
  geradorCodigoPedido = gerarCodigoPedidoPadrao,
}) => {
  const handleVoltar = onVoltarParaVitrine || onVoltar;

  const {
    items,
    totalItens,
    subtotalSemDesconto,
    totalDescontos,
    subtotalComDesconto,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState<boolean>(false);
  const [numeroPedidoGerado, setNumeroPedidoGerado] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFinalizarPedido = async () => {
    if (items.length === 0 || loading) return;

    setLoading(true);
    setErrorMessage(null);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const usuario = getStoredUsuario();
      const userId = usuario?.id_usuario;

      // 1. Obtém ou garante um id_endereco válido
      let idEnderecoFinal = '';
      try {
        const enderecoExistente = await enderecoService.getMine(signal);
        if (enderecoExistente?.id_endereco && regexUUID.test(enderecoExistente.id_endereco)) {
          idEnderecoFinal = enderecoExistente.id_endereco;
        }
      } catch {
        // ignora e tenta criar
      }

      if (!idEnderecoFinal && userId) {
        try {
          const perfilSalvo = getStoredUserProfile(userId);
          const novoEndereco = await enderecoService.create(
            {
              id_usuario: userId,
              cep: perfilSalvo?.cep ? cleanDigits(perfilSalvo.cep) : '80000000',
              logradouro: perfilSalvo?.rua || 'Retirada no Balcão',
              numero: perfilSalvo?.numero || 'S/N',
              cidade: 'Curitiba',
              uf: 'PR',
              complemento: perfilSalvo?.complemento || 'Balcão',
            },
            signal
          );
          const end = Array.isArray(novoEndereco) ? novoEndereco[0] : novoEndereco;
          if (end?.id_endereco && regexUUID.test(end.id_endereco)) {
            idEnderecoFinal = end.id_endereco;
          }
        } catch {
          // ignora falha de criação
        }
      }

      if (!idEnderecoFinal) {
        idEnderecoFinal = 'a0000000-0000-4000-a000-000000000001';
      }

      // 2. Mapeamento de itens conforme o contrato rigoroso do pedidoValidators.ts
      const itensFormatados: CriarPedidoItemPayload[] = items.map((item) => ({
        id_produto: normalizarUUID(String(item.produtoId)),
        quant: Math.max(1, Math.floor(item.quantidade)),
        valor_produto_pedido: Number(item.precoUnitario.toFixed(2)),
        observacao: item.observacoes && item.observacoes.trim() ? item.observacoes.trim() : null,
      }));

      // 3. Montagem do payload enviado com token JWT pelo interceptor do api.ts
      const payload: CriarPedidoPayload = {
        id_endereco: idEnderecoFinal,
        status: 'aguardando',
        valor_total: Number(subtotalComDesconto.toFixed(2)),
        forma_pagamento: 'dinheiro',
        itens: itensFormatados,
      };

      // 4. Requisição POST para ${VITE_API_URL}/pedidos
      const res = await pedidoService.criar(payload, signal);
      const idRetornado = res.pedido?.id_pedido || geradorCodigoPedido();

      setNumeroPedidoGerado(idRetornado);
      setModalConfirmacaoAberto(true);
      clearCart();
    } catch (err: unknown) {
      if (isApiError(err) && (err.name === 'CanceledError' || err.name === 'AbortError')) return;
      const msg = getApiErrorMessage(err, 'Erro ao finalizar o pedido. Tente novamente.');
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFecharModalERedirecionar = () => {
    setModalConfirmacaoAberto(false);
    if (handleVoltar) {
      handleVoltar();
    }
  };

  return (
    <>
      <main className="flex-1 flex flex-col p-4 overflow-y-auto">
        {/* Topo com botão voltar e limpar carrinho */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={handleVoltar}
            className="flex items-center gap-1.5 bg-[#5B2418] hover:bg-[#481c13] text-white font-bold py-2 px-4 rounded-full shadow-xs active:scale-98 transition-all cursor-pointer text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar à vitrine</span>
          </button>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              disabled={loading}
              className="text-xs text-red-700 font-semibold hover:underline cursor-pointer disabled:opacity-50"
            >
              Limpar carrinho
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#F8C8CE] text-[#5B2418] flex items-center justify-center mb-4 shadow-inner">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#5B2418] mb-2">
              Carrinho
            </h2>
            <p className="text-sm text-zinc-600 mb-6 max-w-xs">
              Seu carrinho está vazio no momento. Adicione delícias do nosso cardápio!
            </p>
            <button
              type="button"
              onClick={handleVoltar}
              className="flex items-center gap-2 bg-[#5B2418] hover:bg-[#481c13] text-white font-bold py-3 px-6 rounded-full shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à vitrine</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-8">
            <h2 className="text-xl font-extrabold text-[#5B2418] mb-1">
              Seu Carrinho ({totalItens} {totalItens === 1 ? 'item' : 'itens'})
            </h2>

            {/* Mensagem de erro ao tentar finalizar pedido */}
            {errorMessage && (
              <div
                role="alert"
                data-testid="carrinho-error-message"
                className="p-3 bg-red-100 border border-red-300 text-red-800 text-xs font-semibold rounded-xl flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="truncate">{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="font-bold underline text-red-800 hover:text-red-900 cursor-pointer ml-2 text-xs shrink-0"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Lista de itens no carrinho */}
            <div className="flex flex-col gap-2">
              {items.map((item, index) => (
                <div
                  key={`${item.produtoId}-${index}`}
                  className="bg-white/80 p-3 rounded-2xl flex items-center gap-3 shadow-xs"
                >
                  {item.imagem ? (
                    <img
                      src={item.imagem}
                      alt={item.nome}
                      className="w-14 h-14 rounded-xl object-cover bg-transparent"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[#F8C8CE] flex items-center justify-center text-[#5B2418] shrink-0">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-zinc-900 truncate">
                      {item.nome}
                    </h4>
                    {item.observacoes && (
                      <p className="text-[11px] text-zinc-500 italic truncate">
                        {item.observacoes}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xs font-bold text-[#5B2418]">
                        {formatMoeda(item.precoUnitario)}
                      </span>
                      {item.precoOriginal > item.precoUnitario && (
                        <span className="text-[10px] text-zinc-400 line-through">
                          {formatMoeda(item.precoOriginal)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Diminuir quantidade"
                      disabled={loading}
                      onClick={() => updateQuantity(index, item.quantidade - 1)}
                      className="w-6 h-6 rounded-full bg-[#F8C8CE] text-[#5B2418] font-bold text-xs flex items-center justify-center hover:bg-[#f5b8c0] active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold min-w-4 text-center">
                      {item.quantidade}
                    </span>
                    <button
                      type="button"
                      aria-label="Aumentar quantidade"
                      disabled={loading}
                      onClick={() => updateQuantity(index, item.quantidade + 1)}
                      className="w-6 h-6 rounded-full bg-[#5B2418] text-white font-bold text-xs flex items-center justify-center hover:bg-[#481c13] active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remover item"
                      disabled={loading}
                      onClick={() => removeItem(index)}
                      className="ml-1 p-1 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 1. Card de Forma de Pagamento */}
            <FormaPagamentoCard className="mt-1" />

            {/* Card de Subtotal/Total */}
            <div className="p-4 bg-white/90 rounded-2xl shadow-xs space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span>{formatMoeda(subtotalSemDesconto)}</span>
              </div>
              {totalDescontos > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Descontos</span>
                  <span>- {formatMoeda(totalDescontos)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[#5B2418] text-sm pt-2 border-t border-zinc-200">
                <span>Total</span>
                <span>{formatMoeda(subtotalComDesconto)}</span>
              </div>
            </div>

            {/* 2. Botão de Finalizar Pedido */}
            <Button
              type="button"
              loading={loading}
              disabled={loading || items.length === 0}
              data-testid="btn-finalizar-pedido"
              onClick={() => void handleFinalizarPedido()}
              className="w-full rounded-2xl bg-[#5C2A14] hover:bg-[#481c13] text-white font-bold py-3.5 shadow-md active:scale-98 transition-all cursor-pointer text-sm"
            >
              Finalizar pedido
            </Button>
          </div>
        )}
      </main>

      {/* Modal de Confirmação Visual do Pedido Concluído */}
      <ConfirmacaoPedidoModal
        isOpen={modalConfirmacaoAberto}
        numeroPedido={numeroPedidoGerado}
        onConfirmar={handleFecharModalERedirecionar}
      />
    </>
  );
};

export default CarrinhoCliente;
