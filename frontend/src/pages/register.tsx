import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '../components/Input';
import { InputPassword } from '../components/InputPassword';
import { Button } from '../components/Button';

interface RegisterProps {
  onBackToLogin?: () => void;
}

interface RegisterFormData {
  nome: string;
  email: string;
  rua: string;
  numero: string;
  cep: string;
  complemento?: string;
  senha: string;
  confirmarSenha: string;
  termos: boolean;
}

export const Register: FC<RegisterProps> = ({ onBackToLogin }) => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: {
      nome: '',
      email: '',
      rua: '',
      numero: '',
      cep: '',
      complemento: '',
      senha: '',
      confirmarSenha: '',
      termos: false,
    },
    mode: 'onBlur',
  });

  const senha = watch('senha');

  // Prevenção de vazamento de memória (Memory Leak) ao desmontar tela
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  async function onSubmit(data: RegisterFormData) {
    abortControllerRef.current = new AbortController();

    try {
      console.log('Dados do formulário de cadastro:', data);

      // Simulação de requisição assíncrona com suporte a AbortController
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => resolve(), 1200);
        abortControllerRef.current?.signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });

      alert('Cadastro realizado com sucesso!');
      if (onBackToLogin) onBackToLogin();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log('Requisição cancelada devido à desmontagem do componente.');
        return;
      }
      console.error('Erro no cadastro:', err);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F1BEC5] flex flex-col items-center justify-center p-4 py-8">
      {/* ========================================================================
          [MANUAL] LARGURA DO CONJUNTO:
          'w-[90%]' para telas pequenas / mobile e 'sm:w-full max-w-[360px]'
         ======================================================================== */}
      <div className="w-[90%] sm:w-full max-w-[360px] flex flex-col items-center">
        {/* Título: Cadastro */}
        <h1 className="text-3xl font-extrabold text-black self-start mb-6 tracking-tight">
          Cadastro
        </h1>

        {/* Formulário de Cadastro */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="w-full flex flex-col gap-3.5"
        >
          {/* Grupo 1: Informações Pessoais */}
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Nome completo"
              disabled={isSubmitting}
              erro={errors.nome?.message}
              {...register('nome', {
                required: 'Nome completo é obrigatório',
              })}
            />

            <Input
              type="email"
              placeholder="E-mail"
              autoComplete="email"
              disabled={isSubmitting}
              erro={errors.email?.message}
              {...register('email', {
                required: 'E-mail é obrigatório',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'E-mail inválido',
                },
              })}
            />
          </div>

          {/* Grupo 2: Endereço */}
          <div className="flex flex-col gap-3 pt-1">
            <Input
              placeholder="Rua"
              disabled={isSubmitting}
              erro={errors.rua?.message}
              {...register('rua', {
                required: 'Rua é obrigatória',
              })}
            />

            {/* Linha com Número e CEP lado a lado */}
            <div className="grid grid-cols-[1fr_1.3fr] gap-3">
              <Input
                placeholder="Número"
                disabled={isSubmitting}
                erro={errors.numero?.message}
                {...register('numero', {
                  required: 'Número é obrigatório',
                })}
              />

              <Input
                placeholder="CEP"
                disabled={isSubmitting}
                erro={errors.cep?.message}
                {...register('cep', {
                  required: 'CEP é obrigatório',
                })}
              />
            </div>

            <Input
              placeholder="Complemento"
              disabled={isSubmitting}
              erro={errors.complemento?.message}
              {...register('complemento')}
            />
          </div>

          {/* Grupo 3: Senhas */}
          <div className="flex flex-col gap-3 pt-1">
            <InputPassword
              placeholder="Senha"
              autoComplete="new-password"
              disabled={isSubmitting}
              erro={errors.senha?.message}
              {...register('senha', {
                required: 'Senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'A senha deve conter no mínimo 6 dígitos',
                },
              })}
            />

            <InputPassword
              placeholder="Confirmar senha"
              autoComplete="new-password"
              disabled={isSubmitting}
              erro={errors.confirmarSenha?.message}
              {...register('confirmarSenha', {
                required: 'Confirmação de senha é obrigatória',
                validate: (value) =>
                  value === senha || 'As senhas não coincidem',
              })}
            />
          </div>

          {/* Checkbox Termos e Políticas */}
          <div className="flex flex-col gap-1 mt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={isSubmitting}
                className="w-5 h-5 rounded-xs bg-white text-[#5B2418] border-none shadow-[0_2px_4px_rgba(0,0,0,0.1)] accent-[#5B2418] cursor-pointer"
                {...register('termos', {
                  required: 'Você deve concordar com os termos e políticas',
                })}
              />
              <span className="text-sm font-medium text-zinc-900">
                Termos e politicas
              </span>
            </label>
            {errors.termos && (
              <span className="text-xs text-red-600 font-medium ml-1">
                {errors.termos.message}
              </span>
            )}
          </div>

          {/* Botão de Envio */}
          <div className="flex justify-center w-full mt-4">
            <Button
              type="submit"
              loading={isSubmitting}
              className="w-56 py-3.5 text-xl font-bold shadow-[0_13px_7px_rgba(0,0,0,0.18)]"
            >
              Cadastrar-se
            </Button>
          </div>

          {/* Link para voltar ao Login */}
          {onBackToLogin && (
            <div className="flex flex-col items-center mt-3 text-center">
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-sm font-medium text-zinc-900 underline hover:text-[#5B2418] transition-colors cursor-pointer"
              >
                Já possui conta? Faça login
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Register;
