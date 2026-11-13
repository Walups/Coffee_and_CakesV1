import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function Button({
  children,
  loading,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  // PARA EDITAR O PADDING OU SHADOW DEPOIS, ALTERE AS CLASSES AQUI
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`bg-[#5B2418] hover:bg-[#481c13] text-white font-semibold text-lg rounded-xl shadow-[0_13px_7px_rgba(0,0,0,0.1)] py-4 px-6 transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center select-none active:scale-[0.98] ${className}`}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span>Carregando...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
