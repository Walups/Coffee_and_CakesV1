import type { FC } from 'react';
import { CheckCircle2, Store } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmacaoPedidoModalProps {
  isOpen: boolean;
  numeroPedido: string;
  onConfirmar: () => void;
}

export const ConfirmacaoPedidoModal: FC<ConfirmacaoPedidoModalProps> = ({
  isOpen,
  numeroPedido,
  onConfirmar,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-confirmacao-pedido"
      data-testid="modal-confirmacao-pedido"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-sm bg-[#FCE8DC] rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative border border-[#5C2A14]/10">
        {/* Ícone de Sucesso */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 shadow-inner">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        {/* Título */}
        <h3
          id="titulo-confirmacao-pedido"
          className="text-xl font-extrabold text-[#5C2A14] mb-1"
        >
          Pedido enviado com sucesso!
        </h3>

        <p className="text-xs text-zinc-600 mb-4 max-w-xs">
          Seu pedido já foi recebido pela nossa equipe e começará a ser preparado em instantes.
        </p>

        {/* Card do Número do Pedido */}
        <div className="w-full bg-white/90 rounded-2xl p-3 shadow-xs border border-zinc-100/60 mb-3 text-center">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Número do Pedido
          </span>
          <span
            data-testid="numero-pedido-confirmado"
            className="text-lg font-extrabold text-[#5C2A14] tracking-wide"
          >
            {numeroPedido}
          </span>
        </div>

        {/* Aviso de Pagamento no Balcão */}
        <div className="w-full bg-amber-50/90 border border-amber-200/70 rounded-2xl p-3 text-xs text-amber-900 flex items-center gap-2.5 mb-6 text-left shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-[#5C2A14] shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-[#5C2A14]">
              Pagamento no balcão
            </span>
            <span className="text-[11px] text-amber-800">
              Pague diretamente na retirada
            </span>
          </div>
        </div>

        {/* Botão de Conclusão / Retorno à Vitrine */}
        <Button
          type="button"
          onClick={onConfirmar}
          className="w-full rounded-2xl bg-[#5C2A14] hover:bg-[#481c13] text-white font-bold py-3.5 text-sm shadow-md active:scale-98 transition-all cursor-pointer"
        >
          Voltar à vitrine
        </Button>
      </div>
    </div>
  );
};

export default ConfirmacaoPedidoModal;
