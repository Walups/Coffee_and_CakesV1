import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { categoriaService, parseDesconto } from '../services/categoriaService';
import { getApiErrorMessage, isApiError } from '../services/api';
import type { Categoria, CategoriaPayload } from '../types/categoria';

export interface CategoriaModalProps {
  isOpen: boolean;
  categoriaParaEditar: Categoria | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface CategoriaFormData {
  nome_categoria: string;
  img_banner: string;
  desconto_categoria: string;
}

export const CategoriaModal: FC<CategoriaModalProps> = ({
  isOpen,
  categoriaParaEditar,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoriaFormData>({
    defaultValues: {
      nome_categoria: '',
      img_banner: '',
      desconto_categoria: '',
    },
    mode: 'onBlur',
  });

  // Atualiza valores do formulário quando categoriaParaEditar muda ou modal abre
  useEffect(() => {
    if (isOpen) {
      if (categoriaParaEditar) {
        let descontoStr = '';
        if (
          categoriaParaEditar.desconto_categoria !== undefined &&
          categoriaParaEditar.desconto_categoria !== null
        ) {
          const num = categoriaParaEditar.desconto_categoria;
          const perc = num >= 1 ? Math.round(num) : Math.round(num * 100);
          descontoStr = `${perc}%`;
        }

        reset({
          nome_categoria: categoriaParaEditar.nome_categoria || '',
          img_banner: categoriaParaEditar.img_banner || '',
          desconto_categoria: descontoStr,
        });
      } else {
        reset({
          nome_categoria: '',
          img_banner: '',
          desconto_categoria: '',
        });
      }
    }
  }, [isOpen, categoriaParaEditar, reset]);

  // Limpeza de AbortController no unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (!isOpen) return null;

  const isEditing = Boolean(categoriaParaEditar);

  const handleClose = () => {
    if (loading) return;
    setErrorMessage(null);
    reset({
      nome_categoria: '',
      img_banner: '',
      desconto_categoria: '',
    });
    onClose();
  };

  const onSubmit = async (data: CategoriaFormData) => {
    setLoading(true);
    setErrorMessage(null);
    abortControllerRef.current = new AbortController();

    try {
      const parsedDesconto = parseDesconto(data.desconto_categoria);

      const payload: Partial<CategoriaPayload> = {
        nome_categoria: data.nome_categoria.trim(),
      };

      if (data.img_banner && data.img_banner.trim()) {
        payload.img_banner = data.img_banner.trim();
      } else if (isEditing) {
        payload.img_banner = '';
      }

      if (parsedDesconto !== undefined) {
        payload.desconto_categoria = parsedDesconto;
      } else if (isEditing) {
        payload.desconto_categoria = 0;
      }

      if (isEditing && categoriaParaEditar) {
        await categoriaService.atualizar(
          categoriaParaEditar.id_categoria,
          payload,
          abortControllerRef.current.signal
        );
      } else {
        await categoriaService.criar(
          payload as CategoriaPayload,
          abortControllerRef.current.signal
        );
      }

      // Garante que onSuccess() e onClose() sejam chamados somente após a resposta de sucesso da API
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        setErrorMessage(
          getApiErrorMessage(
            err,
            isEditing ? 'Erro ao atualizar categoria.' : 'Erro ao cadastrar categoria.'
          )
        );
      } else if (err instanceof Error) {
        if (err.name !== 'AbortError') {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Erro inesperado ao processar a categoria.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-categoria-title"
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div className="bg-[#D9D9D9] rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 max-w-lg w-full relative shadow-2xl">
        {/* Botão X de fechar no canto superior direito */}
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          aria-label="Fechar modal"
          className="absolute top-5 right-5 sm:top-6 sm:right-6 bg-white rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-black hover:bg-zinc-100 shadow transition-transform hover:scale-105 cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5 text-black stroke-[2.5]" />
        </button>

        {/* Título do Modal */}
        <h2
          id="modal-categoria-title"
          className="text-2xl sm:text-3xl font-extrabold text-black mb-6 pr-10"
        >
          {isEditing ? 'Editar categoria' : 'Nova categoria'}
        </h2>

        {/* Feedback de erro */}
        {errorMessage && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2.5 rounded-xl text-sm font-medium text-center shadow-xs">
            {errorMessage}
          </div>
        )}

        {/* Formulário com react-hook-form */}
        <form
          onSubmit={(e) => {
            void handleSubmit(
              onSubmit,
              (formErrors) => {
                const firstErrorMessage =
                  formErrors.nome_categoria?.message ||
                  formErrors.img_banner?.message ||
                  formErrors.desconto_categoria?.message;
                if (firstErrorMessage) {
                  setErrorMessage(firstErrorMessage);
                }
              }
            )(e);
          }}
          noValidate
          className="flex flex-col gap-4"
        >
          {/* Nome Categoria */}
          <Input
            placeholder="Nome Categoria"
            disabled={loading}
            erro={errors.nome_categoria?.message}
            className="!px-5 !py-3.5 shadow-none rounded-xl text-base text-black placeholder-zinc-500 border-none"
            containerClassName="w-full"
            {...register('nome_categoria', {
              required: 'Nome da categoria é obrigatório',
              minLength: {
                value: 3,
                message: 'Nome da categoria deve ter no mínimo 3 caracteres',
              },
              maxLength: {
                value: 32,
                message: 'Nome da categoria deve ter no máximo 32 caracteres',
              },
            })}
          />

          {/* Link da imagem da categoria */}
          <Input
            placeholder="Link da imagem da categoria"
            disabled={loading}
            erro={errors.img_banner?.message}
            className="!px-5 !py-3.5 shadow-none rounded-xl text-base text-black placeholder-zinc-500 border-none"
            containerClassName="w-full"
            {...register('img_banner', {
              maxLength: {
                value: 500,
                message: 'Link da imagem deve ter no máximo 500 caracteres',
              },
            })}
          />

          {/* Desconto */}
          <Input
            placeholder="Desconto"
            disabled={loading}
            erro={errors.desconto_categoria?.message}
            className="!px-5 !py-3.5 shadow-none rounded-xl text-base text-black placeholder-zinc-500 border-none"
            containerClassName="w-36 max-w-[150px]"
            {...register('desconto_categoria', {
              validate: (val) => {
                const str = val !== undefined && val !== null ? String(val).trim() : '';
                if (!str) return true;
                const clean = str.replace('%', '').trim().replace(',', '.');
                const num = parseFloat(clean);
                if (isNaN(num)) return 'Desconto inválido';
                if (num < 0 || num >= 100) return 'Entre 0% e 99%';
                return true;
              },
            })}
          />

          {/* Botões Salvar e Cancelar */}
          <div className="flex items-center justify-center gap-5 mt-6">
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              variant="white"
              className="!py-2.5 !px-8 !rounded-xl !text-base sm:!text-lg font-semibold !text-black shadow min-w-[120px]"
            >
              Salvar
            </Button>

            <button
              type="button"
              disabled={loading}
              onClick={handleClose}
              className="bg-white hover:bg-zinc-100 text-black font-semibold text-base sm:text-lg py-2.5 px-8 rounded-xl shadow transition-all cursor-pointer min-w-[120px] active:scale-[0.98] disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoriaModal;
