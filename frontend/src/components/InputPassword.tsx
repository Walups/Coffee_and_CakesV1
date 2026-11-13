import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputPasswordProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  erro?: string;
  containerClassName?: string;
}

export function InputPassword({
  label,
  erro,
  className = '',
  containerClassName = '',
  ...props
}: InputPasswordProps) {
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <div className={`w-full flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label className="text-sm font-semibold text-zinc-800 ml-1">
          {label}
        </label>
      )}

      <div className="relative w-full flex items-center">
        {/* // PARA EDITAR O PADDING OU SHADOW DEPOIS, ALTERE AS CLASSES AQUI */}
        <input
          {...props}
          type={mostrarSenha ? 'text' : 'password'}
          className={`w-full bg-white text-zinc-800 placeholder-zinc-500 rounded-xl px-8 pr-12 py-4 text-base shadow-[0_13px_7px_rgba(0,0,0,0.1)] outline-none transition-all duration-200 focus:ring-2 focus:ring-[#5B2418]/40 border ${
            erro ? 'border-red-500 ring-1 ring-red-500' : 'border-transparent'
          } ${className}`}
        />

        <button
          type="button"
          onClick={() => setMostrarSenha((prev) => !prev)}
          className="absolute right-3 text-zinc-500 hover:text-[#5B2418] transition-colors p-1 cursor-pointer focus:outline-none flex items-center justify-center"
          title={mostrarSenha ? 'Esconder senha' : 'Ver senha'}
          aria-label={mostrarSenha ? 'Esconder senha' : 'Ver senha'}
        >
          {mostrarSenha ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>

      {erro && (
        <span className="text-xs text-red-600 font-medium ml-1 mt-0.5">
          {erro}
        </span>
      )}
    </div>
  );
}

export default InputPassword;
