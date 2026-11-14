import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { useForm } from 'react-hook-form';
import logoImg from '../assets/Logo.png';
import { Input } from '../components/Input';
import { InputPassword } from '../components/InputPassword';
import { Button } from '../components/Button';
import { isApiError, getApiErrorMessage } from '../services/api';
import { usuarioService } from '../services/usuarioService';

interface LoginProps {
  onNavigateRegister?: () => void;
  onNavigateForgotPassword?: () => void;
  onNavigate?: (path: string) => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

export const Login: FC<LoginProps> = ({
  onNavigateRegister,
  onNavigateForgotPassword,
  onNavigate,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  // Prevenção de vazamento de memória (Memory Leak) ao desmontar tela
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  async function onSubmit(formData: LoginFormData) {
    setLoading(true);
    setErrorMessage(null);
    abortControllerRef.current = new AbortController();

    try {
      // 1. Enviar no body JSON exatamente { email, password } para /usuario/login
      const data = await usuarioService.login(
        {
          email: formData.email,
          password: formData.password,
        },
        abortControllerRef.current.signal
      );

      // 2. Em caso de sucesso (200), salvar data.token e JSON.stringify(data.usuario) no localStorage
      if (data?.token && data?.usuario) {
        usuarioService.setSession(data.token, data.usuario);
      } else {
        if (data?.token) {
          localStorage.setItem('token', data.token);
        }
        if (data?.usuario) {
          localStorage.setItem('usuario', JSON.stringify(data.usuario));
        }
      }

      // 3. Redirecionar com base em data.usuario.role: se for 'admin' -> /admin; se for 'cliente' (ou outro) -> /cliente
      const role = data?.usuario?.role;
      const targetPath = role === 'admin' ? '/admin' : '/cliente';

      if (onNavigate) {
        onNavigate(targetPath);
      } else {
        window.history.pushState({}, '', targetPath);
        window.location.assign(targetPath);
      }
    } catch (error: unknown) {
      if (isApiError(error)) {
        if (error.name === 'CanceledError' || error.name === 'AbortError') {
          return;
        }

        // Caso a API retorne erro, exibir apenas a mensagem retornada no JSON (data.erro || data.erros?.[0]), sem código HTTP
        setErrorMessage(getApiErrorMessage(error, 'Erro ao realizar login. Tente novamente.'));
      } else if (error instanceof Error) {
        if (error.name !== 'AbortError') {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage('Erro inesperado ao realizar login.');
      }
    } finally {
      // 4. Garantindo setLoading(false) no finally
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F1BEC5] flex flex-col items-center justify-center p-4">
      {/* ==========================================================================
          [MANUAL] LARGURA DO CONJUNTO:
          'w-[90%]' define a largura máxima de 90% em telas menores (mobile).
          Para alterar manualmente, modifique a classe 'w-[90%]' abaixo.
         ========================================================================== */}
      <div className="w-[90%] sm:w-full max-w-[360px] flex flex-col items-center">
        {/* ========================================================================
            [MANUAL] TAMANHO DA LOGO:
            'scale-90' reduz a logo em 10% (0.9x) em qualquer tamanho de tela.
            Para alterar manualmente, modifique 'scale-90' abaixo.
           ======================================================================== */}
        <div className="mb-8 flex justify-center">
          <img
            src={logoImg}
            alt="Coffee & Cakes"
            className="w-64 sm:w-72 object-contain drop-shadow-xs pointer-events-none scale-90"
          />
        </div>

        {/* Formulário de Login */}
        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e);
          }}
          noValidate
          className="w-full flex flex-col items-center gap-4"
        >
          {/* Mensagem de Erro da API */}
          {errorMessage && (
            <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm font-medium text-center shadow-xs">
              {errorMessage}
            </div>
          )}

          <Input
            type="email"
            placeholder="E-mail"
            autoComplete="email"
            disabled={loading}
            erro={errors.email?.message}
            {...register('email', {
              required: 'E-mail é obrigatório',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'E-mail inválido',
              },
            })}
          />

          <InputPassword
            placeholder="Senha"
            autoComplete="current-password"
            disabled={loading}
            erro={errors.password?.message}
            {...register('password', {
              required: 'Senha é obrigatória',
            })}
          />

          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="w-48 sm:w-52 mt-2"
          >
            Login
          </Button>

          {/* Links inferiores */}
          <div className="flex flex-col items-center gap-1.5 mt-3 text-center">
            <button
              type="button"
              disabled={loading}
              onClick={onNavigateRegister}
              className="text-sm font-medium text-zinc-900 underline hover:text-[#5B2418] transition-colors cursor-pointer disabled:opacity-60"
            >
              Cadastre-se
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onNavigateForgotPassword}
              className="text-sm font-medium text-zinc-900 underline hover:text-[#5B2418] transition-colors cursor-pointer disabled:opacity-60"
            >
              Esqueci a senha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
