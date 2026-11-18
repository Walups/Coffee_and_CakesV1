import type { FC, SyntheticEvent } from 'react';
import { Plus } from 'lucide-react';
import type { Produto } from '../types/produto';
import { formatMoeda } from '../services/produtoService';
import fallbackCategoriaImg from '../assets/group 30.png';

interface ListaProdutosClienteProps {
  produtos: Produto[];
  titulo?: string;
  onSelectProduto?: (produto: Produto) => void;
  onAdicionarAoCarrinho?: (produto: Produto) => void;
  onLimparFiltro?: () => void;
}

export const ListaProdutosCliente: FC<ListaProdutosClienteProps> = ({
  produtos,
  titulo = 'Nosso Cardápio',
  onSelectProduto,
  onAdicionarAoCarrinho,
  onLimparFiltro,
}) => {
  // Filtra produtos ativos
  const produtosAtivos = produtos.filter((prod) => prod.active !== false);

  const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    if (target.src !== fallbackCategoriaImg) {
      target.onerror = null;
      target.src = fallbackCategoriaImg;
    }
  };

  if (produtosAtivos.length === 0) {
    return (
      <section className="w-full px-4 py-3">
        {titulo && (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[#5B2418]">{titulo}</h2>
            {onLimparFiltro && (
              <button
                type="button"
                onClick={onLimparFiltro}
                className="text-xs font-semibold text-[#5B2418] underline hover:text-[#481c13] cursor-pointer"
              >
                Ver todos
              </button>
            )}
          </div>
        )}
        <div className="w-full py-8 text-center text-zinc-500 text-sm">
          Nenhum produto disponível nesta categoria.
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 py-3">
      {titulo && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#5B2418]">{titulo}</h2>
          {onLimparFiltro && (
            <button
              type="button"
              onClick={onLimparFiltro}
              className="text-xs font-semibold text-[#5B2418] underline hover:text-[#481c13] cursor-pointer"
            >
              Ver todos
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {produtosAtivos.map((prod) => {
          const temDesconto =
            typeof prod.desconto_produto === 'number' &&
            prod.desconto_produto > 0;
          const precoFinal = temDesconto
            ? prod.preco * (1 - (prod.desconto_produto ?? 0))
            : prod.preco;

          const imgSrc =
            prod.imagem_produto && prod.imagem_produto.trim() !== ''
              ? prod.imagem_produto.trim()
              : fallbackCategoriaImg;

          return (
            <div
              key={prod.id_produto}
              onClick={() => onSelectProduto && onSelectProduto(prod)}
              className="bg-transparent flex items-center gap-3.5 cursor-pointer transition-all active:scale-[0.99] group relative py-1"
            >
              {/* Imagem quadrada arredondada à esquerda */}
              <img
                src={imgSrc}
                alt={prod.nome_produto}
                onError={handleImageError}
                className="w-24 h-24 aspect-square shrink-0 object-cover rounded-2xl bg-transparent"
                loading="lazy"
              />

              {/* Informações à direita */}
              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-[#5B2418] transition-colors">
                    {prod.nome_produto}
                  </h3>
                  {prod.descricao && (
                    <p className="text-xs text-zinc-600 line-clamp-2 mt-1 leading-relaxed">
                      {prod.descricao}
                    </p>
                  )}
                </div>

                {/* Linha de Preço e botão de adicionar */}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-bold text-sm sm:text-base text-[#5B2418]">
                      {formatMoeda(precoFinal)}
                    </span>
                    {temDesconto && (
                      <span className="text-xs text-zinc-500 line-through">
                        {formatMoeda(prod.preco)}
                      </span>
                    )}
                  </div>

                  {onAdicionarAoCarrinho && (
                    <button
                      type="button"
                      aria-label={`Adicionar ${prod.nome_produto} ao carrinho`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdicionarAoCarrinho(prod);
                      }}
                      className="w-8 h-8 rounded-full bg-[#5B2418] text-white flex items-center justify-center shadow-xs hover:bg-[#481c13] active:scale-95 transition-transform cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
