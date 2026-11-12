import { useState } from 'react';
import type { FormEvent, FC } from 'react';
import logoImg from '../assets/Logo.png';
import { Input } from '../components/Input';
import { InputPassword } from '../components/InputPassword';
import { Button } from '../components/Button';

interface RegisterProps {
  onBackToLogin?: () => void;
}

export const Register: FC<RegisterProps> = ({ onBackToLogin }) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem!');
      return;
    }

    setLoading(true);
    console.log('Register:', { nome, email, senha });

    setTimeout(() => {
      setLoading(false);
      alert('Cadastro realizado com sucesso!');
      if (onBackToLogin) onBackToLogin();
    }, 1000);
  }

  return (
    <div className="min-h-screen w-full bg-[#F1BEC5] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[360px] flex flex-col items-center">
        {/* Logo */}
        <img
          src={logoImg}
          alt="Coffee & Cakes"
          className="w-56 mb-6 object-contain drop-shadow-sm pointer-events-none"
        />

        {/* Formulário de Cadastro */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-3">
          <Input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />

          <Input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <InputPassword
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          <InputPassword
            placeholder="Confirmar Senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            erro={erro}
            required
          />

          {/* Botão de Cadastrar */}
          <Button
            type="submit"
            loading={loading}
            className="w-48 mt-2 py-2.5"
          >
            Cadastrar
          </Button>

          {/* Link para voltar ao Login */}
          <div className="flex flex-col items-center mt-3">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-sm font-medium text-zinc-900 underline hover:text-[#5B2418] transition-colors cursor-pointer"
            >
              Já possui conta? Faça login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

