/**
 * Remove todos os caracteres não numéricos de uma string
 */
export function cleanDigits(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Aplica máscara de formatação de CPF: 000.000.000-00
 */
export function maskCPF(value: string | null | undefined): string {
  const digits = cleanDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Aplica máscara de formatação de Telefone: (00) 0000-0000 ou (00) 00000-0000
 */
export function maskPhone(value: string | null | undefined): string {
  const digits = cleanDigits(value).slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Aplica máscara de formatação de CEP: 00000-000
 */
export function maskCEP(value: string | null | undefined): string {
  const digits = cleanDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

/**
 * Validação dos dígitos verificadores do CPF de acordo com a regra oficial
 */
export function validarCPF(cpf: string | null | undefined): boolean {
  if (!cpf) return false;

  const cpfLimpo = cleanDigits(cpf);

  // Deve ter exatamente 11 dígitos numéricos
  if (cpfLimpo.length !== 11) {
    return false;
  }

  // Bloqueia CPFs com todos os dígitos iguais (ex: 00000000000, 11111111111, etc.)
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }

  // 1º dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(9), 10)) {
    return false;
  }

  // 2º dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(10), 10)) {
    return false;
  }

  return true;
}
