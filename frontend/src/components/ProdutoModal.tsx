import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { produtoService, parseMoeda, formatMoeda } from '../services/produtoService';
import { categoriaService } from '../services/categoriaService';
import { getApiErrorMessage, isApiError } from '../services/api';
import type { Produto, ProdutoPayload } from '../types/produto';
import type { Categoria } from '../types/categoria';

export interface ProdutoModalProps {
  isOpen: boolean;
  produtoParaEditar: Produto | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProdutoFormData {
  nome_produto: string;
  imagem_produto: string;
  preco: string;
  desconto_produto: string;
  id_categoria: string;
  descricao: string;
}

export const ProdutoModal: FC<ProdutoModalProps> = ({
  isOpen,
  produtoParaEditar,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const categoriesAbortControllerRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<ProdutoFormData>({
    defaultValues: {
      nome_produto: '',
      imagem_produto: '',
      preco: '',
      desconto_produto: '',
      id_categoria: '',
      descricao: '',
    },
    mode: 'onBlur',
  });

  const isEditing = Boolean(produtoParaEditar);

  // Carrega categorias dinâmicas da API quando o modal abre
  useEffect(() => {
    if (isOpen) {
      categoriesAbortControllerRef.current = new AbortController();

      categoriaService
        .listar(categoriesAbortControllerRef.current.signal)
        .then((cats) => {
          const ativas = Array.isArray(cats)
            ? cats.filter((c) => c.active !== false)
            : [];
          setCategorias(ativas);
        })
        .catch((err: unknown) => {
          if (isApiError(err) && (err.name === 'CanceledError' || err.name === 'AbortError')) {
            return;
          }
        });

      return () => {
        if (categoriesAbortControllerRef.current) {
          categoriesAbortControllerRef.current.abort();
        }
      };
    }
  }, [isOpen]);

  // Atualiza valores do formulário quando produtoParaEditar muda ou modal abre
  useEffect(() => {
    if (isOpen) {
      if (produtoParaEditar) {
        reset({
          nome_produto: produtoParaEditar.nome_produto || '',
          imagem_produto: produtoParaEditar.imagem_produto || '',
          preco:
            produtoParaEditar.preco !== undefined && produtoParaEditar.preco !== null
              ? formatMoeda(produtoParaEditar.preco)
              : '',
          desconto_produto:
            produtoParaEditar.desconto_produto !== undefined &&
            produtoParaEditar.desconto_produto !== null &&
            produtoParaEditar.desconto_produto > 0
              ? formatMoeda(produtoParaEditar.desconto_produto)
              : '',
          id_categoria:
            produtoParaEditar.id_categoria ||
            produtoParaEditar.categoria_x_produto?.[0]?.id_categoria ||
            '',
          descricao: produtoParaEditar.descricao || '',
        });
      } else {
        reset({
          nome_produto: '',
          imagem_produto: '',
          preco: '',
          desconto_produto: '',
          id_categoria: '',
          descricao: '',
        });
      }
    }
  }, [isOpen, produtoParaEditar, reset]);

  // Limpeza de AbortController no unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (categoriesAbortControllerRef.current) {
        categoriesAbortControllerRef.current.abort();
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    setErrorMessage(null);
    reset({
      nome_produto: '',
      imagem_produto: '',
      preco: '',
      desconto_produto: '',
      id_categoria: '',
      descricao: '',
    });
    onClose();
  };

  const onSubmit = async (data: ProdutoFormData) => {
    setLoading(true);
    setErrorMessage(null);
    abortControllerRef.current = new AbortController();

    try {
      const parsedPreco = parseMoeda(data.preco);
      const parsedDesconto = parseMoeda(data.desconto_produto);

      if (parsedPreco === undefined || parsedPreco <= 0) {
        setErrorMessage('Preço deve ser um valor numérico maior que zero.');
        setLoading(false);
        return;
      }

      if (parsedDesconto !== undefined && parsedDesconto >= parsedPreco) {
        setErrorMessage('O desconto deve ser menor que o preço do produto.');
        setLoading(false);
        return;
      }

      const payload: Partial<ProdutoPayload> = {
        nome_produto: data.nome_produto.trim(),
        preco: parsedPreco,
      };

      if (data.imagem_produto && data.imagem_produto.trim()) {
        payload.imagem_produto = data.imagem_produto.trim();
      } else if (isEditing) {
        payload.imagem_produto = '';
      }

      if (parsedDesconto !== undefined) {
        payload.desconto_produto = parsedDesconto;
      } else if (isEditing) {
        payload.desconto_produto = 0;
      }

      if (data.descricao && data.descricao.trim()) {
        payload.descricao = data.descricao.trim();
      } else if (isEditing) {
        payload.descricao = '';
      }

      if (data.id_categoria && data.id_categoria.trim() !== '') {
        payload.id_categoria = data.id_categoria.trim();
      } else if (isEditing) {
        payload.id_categoria = null;
      }

      if (isEditing && produtoParaEditar) {
        await produtoService.atualizar(
          produtoParaEditar.id_produto,
          payload,
          abortControllerRef.current.signal
        );
      } else {
        await produtoService.criar(
          payload as ProdutoPayload,
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
            isEditing ? 'Erro ao atualizar produto.' : 'Erro ao cadastrar produto.'
          )
        );
      } else if (err instanceof Error) {
        if (err.name !== 'AbortError') {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Erro inesperado ao processar o produto.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-produto-title"
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div className="bg-[#D9D9D9] rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 max-w-lg w-full relative shadow-2xl max-h-[90vh] overflow-y-auto">
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
          id="modal-produto-title"
          className="text-2xl sm:text-3xl font-extrabold text-black mb-6 pr-10"
        >
          {isEditing ? 'Editar Produto' : 'Novo Produto'}
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
                const firstError = Object.values(formErrors)[0]?.message;
                if (firstError) {
                  setErrorMessage(firstError);
                }
              }
            )(e);
          }}
          noValidate
          className="flex flex-col gap-4"
        >
          {/* Nome Produto */}
          <Input
            placeholder="Nome Produto"
            disabled={loading}
            erro={errors.nome_produto?.message}
            className="!px-5 !py-3.5 shadow-none rounded-xl text-base text-black placeholder-zinc-500 border-none bg-white"
            containerClassName="w-full"
            {...register('nome_produto', {
              required: 'Nome do produto é obrigatório',
              minLength: {
                value: 3,
                message: 'Nome do produto deve ter no mínimo 3 caracteres',
              },
              maxLength: {
                value: 50,
                message: 'Nome do produto deve ter no máximo 50 caracteres',
              },
            })}
          />

          {/* Link da imagem do produto */}
          <Input
            placeholder="Link da imagem do produto"
            disabled={loading}
            erro={errors.imagem_produto?.message}
            className="!px-5 !py-3.5 shadow-none rounded-xl text-base text-black placeholder-zinc-500 border-none bg-white"
            containerClassName="w-full"
            {...register('imagem_produto', {
              required: !isEditing ? 'Link da imagem é obrigatório' : false,
              maxLength: {
                value: 255,
                message: 'Link da imagem deve ter no máximo 255 caracteres',
              },
            })}
          />

          {/* Preço e Desconto lado a lado */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Input
              placeholder="Preço"
              disabled={loading}
              erro={errors.preco?.message}
              className="!px-5 !py-3.5 shadow-none rounded-xl text-base text-black placeholder-zinc-500 border-none bg-white"
              containerClassName="w-full"
              {...register('preco', {
                required: 'Preço é obrigatório',
                validate: (val) => {
                  const str = val !== undefined && val !== null ? String(val).trim() : '';
                  if (!str) return 'Preço é obrigatório';
                  const parsed = parseMoeda(str);
                  if (parsed === undefined || isNaN(parsed)) return 'Preço inválido';
                  if (parsed <= 0) return 'Deve ser maior que 0';
                  return true;
                },
              })}
            />

            <Input
              placeholder="Desconto"
              disabled={loading}
              erro={errors.desconto_produto?.message}
              className="!px-5 !py-3.5 shadow-none rounded-xl text-base text-black placeholder-zinc-500 border-none bg-white"
              containerClassName="w-full"
              {...register('desconto_produto', {
                validate: (val) => {
                  const str = val !== undefined && val !== null ? String(val).trim() : '';
                  if (!str) return true;
                  const parsed = parseMoeda(str);
                  if (parsed === undefined || isNaN(parsed)) return 'Desconto inválido';
                  if (parsed < 0) return 'Não pode ser negativo';
                  const precoAtual = parseMoeda(getValues('preco'));
                  if (precoAtual !== undefined && parsed >= precoAtual) {
                    return 'Menor que preço';
                  }
                  return true;
                },
              })}
            />
          </div>

          {/* Seletor de Categorias dinâmico */}
          <div className="flex flex-col w-full">
            <select
              disabled={loading}
              className="w-full bg-white rounded-xl px-5 py-3.5 text-base text-black border-none shadow-none outline-none focus:ring-2 focus:ring-[#5B2418] cursor-pointer disabled:opacity-50"
              {...register('id_categoria')}
            >
              <option value="">Categorias</option>
              {categorias.map((cat) => (
                <option key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.nome_categoria}
                </option>
              ))}
            </select>
            {errors.id_categoria?.message && (
              <span className="text-xs text-red-600 mt-1 font-medium">
                {errors.id_categoria.message}
              </span>
            )}
          </div>

          {/* Observações */}
          <div className="flex flex-col w-full">
            <textarea
              rows={4}
              placeholder="Observações"
              disabled={loading}
              className="w-full bg-white rounded-xl px-5 py-3.5 text-base text-black placeholder-zinc-500 border-none shadow-none outline-none focus:ring-2 focus:ring-[#5B2418] resize-none disabled:opacity-50"
              {...register('descricao', {
                maxLength: {
                  value: 255,
                  message: 'Observações deve ter no máximo 255 caracteres',
                },
              })}
            />
            {errors.descricao?.message && (
              <span className="text-xs text-red-600 mt-1 font-medium">
                {errors.descricao.message}
              </span>
            )}
          </div>

          {/* Botões Salvar e Cancelar */}
          <div className="flex items-center justify-center gap-5 mt-6">
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              variant="white"
              className="!py-2.5 !px-8 !rounded-xl !text-base sm:!text-lg font-semibold !text-black shadow min-w-[120px] bg-white hover:bg-zinc-100"
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

export default ProdutoModal;
