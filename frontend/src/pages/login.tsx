import { useState } from 'react';
import type { FormEvent, FC } from 'react';
import logoImg from '../assets/Logo.png';
import { Input } from '../components/Input';
import { InputPassword } from '../components/InputPassword';
import { Button } from '../components/Button';

interface LoginProps {
  onNavigateRegister?: () => void;
  onNavigateForgotPassword?: () => void;
}

export const Login: FC<LoginProps> = ({
  onNavigateRegister,
  onNavigateForgotPassword,
}) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    console.log('Login:', { email, senha });

    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }

  return (
    <div className="min-h-screen w-full bg-[#F1BEC5] flex flex-col items-center justify-center p-4">
      {/* Container principal centralizado */}
      <div className="w-full max-w-[360px] flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src={logoImg}
            alt="Coffee & Cakes"
            className="w-64 sm:w-72 object-contain drop-shadow-xs pointer-events-none"
          />
        </div>

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
          <Input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <InputPassword
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="current-password"
          />

          {/* Botão Login */}
          <Button
            type="submit"
            loading={loading}
            className="w-48 sm:w-52 mt-2 py-2.5"
          >
            Login
          </Button>

          {/* Links inferiores */}
          <div className="flex flex-col items-center gap-1.5 mt-3 text-center">
            <button
              type="button"
              onClick={onNavigateRegister}
              className="text-sm font-medium text-zinc-900 underline hover:text-[#5B2418] transition-colors cursor-pointer"
            >
              Cadastre-se
            </button>
            <button
              type="button"
              onClick={onNavigateForgotPassword}
              className="text-sm font-medium text-zinc-900 underline hover:text-[#5B2418] transition-colors cursor-pointer"
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
