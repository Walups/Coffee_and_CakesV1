import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  erro?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  erro,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`w-full flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label className="text-sm font-semibold text-zinc-800 ml-1">
          {label}
        </label>
      )}

      {/* ==========================================================================
          CUSTOMIZAÇÃO MANUAL (Padding e Sombra do Input):
          - Padding: 'px-8' (~2em laterais) e 'py-4' (~1em vertical)
          - Sombra: 'shadow-[0_13px_7px_rgba(0,0,0,0.15)]' (y = 13px, blur = 7px)
         ========================================================================== */}
      <input
        ref={ref}
        className={`w-full bg-white text-zinc-800 placeholder-zinc-500 rounded-xl px-8 py-4 text-base shadow-[0_13px_7px_rgba(0,0,0,0.15)] outline-none transition-all duration-200 focus:ring-2 focus:ring-[#5B2418]/40 border ${
          erro ? 'border-red-500 ring-1 ring-red-500' : 'border-transparent'
        } ${className}`}
        {...props}
      />

      {erro && (
        <span className="text-xs text-red-600 font-medium ml-1 mt-0.5">
          {erro}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
