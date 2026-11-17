import type { FC, SyntheticEvent } from 'react';
import type { Categoria } from '../types/categoria';
import fallbackCategoriaImg from '../assets/group 30.png';

interface CategoriasCarouselProps {
  categorias: Categoria[];
  categoriaSelecionadaId?: string | null;
  onSelectCategoria?: (categoria: Categoria) => void;
}

export const CategoriasCarousel: FC<CategoriasCarouselProps> = ({
  categorias,
  categoriaSelecionadaId,
  onSelectCategoria,
}) => {
  // Mostra todas as categorias ativas do banco
  const categoriasFiltradas = categorias.filter(
    (cat) => cat.active !== false
  );

  const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    if (target.src !== fallbackCategoriaImg) {
      target.onerror = null;
      target.src = fallbackCategoriaImg;
    }
  };

  if (categoriasFiltradas.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-2">
      <div className="flex flex-nowrap overflow-x-auto gap-4 px-4 py-2 scroll-smooth scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {categoriasFiltradas.map((cat) => {
          const isSelected = categoriaSelecionadaId === cat.id_categoria;
          const imgBannerLimpa = cat.img_banner?.trim();
          const imgSrc =
            imgBannerLimpa && imgBannerLimpa.length > 0
              ? imgBannerLimpa
              : fallbackCategoriaImg;

          return (
            <button
              key={cat.id_categoria}
              type="button"
              onClick={() => onSelectCategoria && onSelectCategoria(cat)}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none"
            >
              {/* Item circular */}
              <div
                className={`w-16 h-16 rounded-full overflow-hidden bg-white shadow-xs border-2 transition-transform duration-150 group-hover:scale-105 group-active:scale-95 ${
                  isSelected
                    ? 'border-[#5B2418] ring-2 ring-[#5B2418]/30'
                    : 'border-transparent'
                }`}
              >
                <img
                  src={imgSrc}
                  alt={cat.nome_categoria}
                  onError={handleImageError}
                  className="w-16 h-16 rounded-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Nome centralizado abaixo */}
              <span className="text-xs font-semibold text-[#5B2418] text-center max-w-[72px] truncate">
                {cat.nome_categoria}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
