import type { FC } from 'react';
import logoImg from '../assets/Logo.png';
import { Button } from '../components/Button';

interface EmConstrucaoProps {
  onBackToLogin?: () => void;
}

export const EmConstrucao: FC<EmConstrucaoProps> = ({ onBackToLogin }) => {
  return (
    <div className="min-h-screen w-full bg-[#F1BEC5] flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Logo */}
        <img
          src={logoImg}
          alt="Coffee & Cakes"
          className="w-56 mb-8 object-contain drop-shadow-sm pointer-events-none"
        />

        {/* Title centralizado */}
        <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-8 shadow-md border border-white/60 w-full mb-6">
          <h1 className="text-2xl font-bold text-[#5B2418] mb-3">
            Em Construção
          </h1>
          <p className="text-zinc-700 text-sm leading-relaxed">
            Esta funcionalidade (Recuperação de Senha) ainda está sendo desenvolvida. Em breve estará disponível!
          </p>
        </div>

        {/* Botão de retorno */}
        {onBackToLogin && (
          <Button
            type="button"
            onClick={onBackToLogin}
            className="w-48 text-base py-2"
          >
            Voltar ao Login
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmConstrucao;

