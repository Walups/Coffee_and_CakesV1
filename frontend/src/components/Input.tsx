import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  erro?: string;
}

export function Input({ label, erro, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
      <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
        {label}
      </label>
      
      <input
        {...props}
        style={{
          padding: '10px 12px',
          borderRadius: 6,
          border: erro ? '1px solid #dc2626' : '1px solid #ccc',
          fontSize: 14,
          outline: 'none',
          ...props.style,
        }}
      />

      {erro && <span style={{ color: '#dc2626', fontSize: 12 }}>{erro}</span>}
    </div>
  );
}