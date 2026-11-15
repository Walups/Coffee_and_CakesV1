import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'white' | 'gray';
}

export function Button({
  children,
  loading,
  disabled,
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary: 'bg-[#5B2418] hover:bg-[#481c13] text-white shadow-[0_13px_7px_rgba(0,0,0,0.15)]',
    white: 'bg-white hover:bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200/40',
    gray: 'bg-[#E5E7EB] hover:bg-[#D1D5DB] text-zinc-900 shadow-xs',
  };

  const spinnerColor = variant === 'primary' ? 'text-white' : 'text-zinc-800';

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${variantStyles[variant]} font-semibold text-lg rounded-xl py-4 px-8 transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center select-none active:scale-[0.98] ${className}`}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <svg
            className={`animate-spin h-5 w-5 ${spinnerColor}`}
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
