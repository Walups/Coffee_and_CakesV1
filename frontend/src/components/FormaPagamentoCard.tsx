import type { FC } from 'react';
import { Store } from 'lucide-react';

export interface FormaPagamentoCardProps {
  className?: string;
}

export const FormaPagamentoCard: FC<FormaPagamentoCardProps> = ({ className = '' }) => {
  return (
    <div
      data-testid="forma-pagamento-card"
      className={`bg-white/90 p-4 rounded-2xl shadow-xs border border-zinc-100/60 ${className}`}
    >
      <h3 className="font-bold text-xs sm:text-sm text-[#5C2A14]">
        Forma de pagamento
      </h3>
      <div className="flex items-center gap-3 mt-2.5">
        <div className="w-9 h-9 rounded-xl bg-[#F8C8CE]/60 flex items-center justify-center text-[#5C2A14] shrink-0">
          <Store className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-zinc-900">
            Pagamento no balcão
          </span>
          <span className="text-[11px] text-zinc-500">
            Pague diretamente na retirada
          </span>
        </div>
      </div>
    </div>
  );
};

export default FormaPagamentoCard;
