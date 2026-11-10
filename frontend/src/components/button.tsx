import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function Button({ children, loading, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        padding: '10px 16px',
        borderRadius: 6,
        border: 'none',
        backgroundColor: disabled || loading ? '#9ca3af' : '#2563eb',
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        width: '100%',
        transition: 'background-color 0.2s',
        ...props.style,
      }}
    >
      {loading ? 'Carregando...' : children}
    </button>
  );
}