import type { FC, SyntheticEvent } from 'react';
import { Plus } from 'lucide-react';
import type { Produto } from '../types/produto';
import type { Categoria } from '../types/categoria';
import { formatMoeda } from '../services/produtoService';
import fallbackCategoriaImg from '../assets/group 30.png';

interface MaisVendidosCarouselProps {
  produtos: Produto[];
  categoriaMaisVendidos?: Categoria | null;
  onVerMais?: () => void;
  onAdicionarAoCarrinho?: (produto: Produto) => void;
  onSelectProduto?: (produto: Produto) => void;
}

export const MaisVendidosCarousel: FC<MaisVendidosCarouselProps> = ({
  produtos,
  categoriaMaisVendidos,
  onVerMais,
  onAdicionarAoCarrinho,
  onSelectProduto,
}) => {
  // Filtra apenas produtos ativos pertencentes à categoria "mais vendidos"
  const produtosMaisVendidos = produtos.filter((prod) => {
    if (prod.active === false) return false;
    if (!categoriaMaisVendidos) return false;
    return prod.id_categoria === categoriaMaisVendidos.id_categoria;
  });

  const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    if (target.src !== fallbackCategoriaImg) {
      target.src = fallbackCategoriaImg;
    }
  };

  if (produtosMaisVendidos.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-3">
      {/* Cabeçalho: Título à esquerda e 'Ver mais >' à direita */}
      <div className="flex items-center justify-between px-4 mb-2">
        <h2 className="text-lg font-bold text-[#5B2418]">Mais vendidos</h2>
        <button
          type="button"
          onClick={onVerMais}
          className="text-xs font-semibold text-[#5B2418] hover:underline cursor-pointer"
        >
          Ver mais &gt;
        </button>
      </div>

      {/* Fileira horizontal rolável com barra oculta e card cortado pela metade no limite da tela */}
      <div className="flex gap-3 overflow-x-auto px-4 py-1 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {produtosMaisVendidos.map((prod) => {
          const temDesconto =
            typeof prod.desconto_produto === 'number' &&
            prod.desconto_produto > 0;
          const precoFinal = temDesconto
            ? prod.preco * (1 - (prod.desconto_produto ?? 0))
            : prod.preco;

          const imgSrc =
            prod.imagem_produto && prod.imagem_produto.trim() !== ''
              ? prod.imagem_produto
              : fallbackCategoriaImg;

          return (
            <div
              key={prod.id_produto}
              className="w-[114px] shrink-0 flex flex-col cursor-pointer group"
              onClick={() => onSelectProduto && onSelectProduto(prod)}
            >
              {/* Imagem quadrada arredondada com ícone '+' no canto inferior direito */}
              <div className="relative w-[114px] aspect-square rounded-2xl overflow-hidden bg-white shadow-xs shrink-0">
                <img
                  src={imgSrc}
                  alt={prod.nome_produto}
                  onError={handleImageError}
                  className="w-full aspect-square object-cover rounded-2xl transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                <button
                  type="button"
                  aria-label={`Adicionar ${prod.nome_produto} ao carrinho`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAdicionarAoCarrinho) {
                      onAdicionarAoCarrinho(prod);
                    }
                  }}
                  className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#5B2418] text-white flex items-center justify-center shadow-md hover:bg-[#481c13] active:scale-95 transition-transform cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>

              {/* Linha de Preço */}
              <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
                <span className="font-bold text-xs sm:text-sm text-[#5B2418]">
                  {formatMoeda(precoFinal)}
                </span>
                {temDesconto && (
                  <span className="text-[10px] text-gray-400 line-through">
                    {formatMoeda(prod.preco)}
                  </span>
                )}
              </div>

              {/* Nome do Produto */}
              <span className="text-xs font-semibold text-zinc-800 line-clamp-2 mt-0.5 leading-snug">
                {prod.nome_produto}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
