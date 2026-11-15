import { describe, it, expect } from 'vitest';
import {
  cleanDigits,
  maskCPF,
  maskPhone,
  maskCEP,
  validarCPF,
} from '../validators';

describe('Utilitários de Validação e Formatação (validators.ts)', () => {
  describe('cleanDigits', () => {
    it('deve extrair somente números removendo caracteres especiais e letras', () => {
      expect(cleanDigits('123.456.789-00')).toBe('12345678900');
      expect(cleanDigits('(41) 99999-8888')).toBe('41999998888');
      expect(cleanDigits('80000-000')).toBe('80000000');
      expect(cleanDigits('abc-123.xyz')).toBe('123');
    });

    it('deve retornar string vazia para valores nulos, indefinidos ou vazios', () => {
      expect(cleanDigits('')).toBe('');
      expect(cleanDigits(null)).toBe('');
      expect(cleanDigits(undefined)).toBe('');
    });
  });

  describe('maskCPF', () => {
    it('deve formatar CPF progressivamente com pontos e traço', () => {
      expect(maskCPF('123')).toBe('123');
      expect(maskCPF('1234')).toBe('123.4');
      expect(maskCPF('1234567')).toBe('123.456.7');
      expect(maskCPF('12345678901')).toBe('123.456.789-01');
    });

    it('deve truncar em 11 dígitos numéricos', () => {
      expect(maskCPF('123456789019999')).toBe('123.456.789-01');
    });
  });

  describe('maskPhone', () => {
    it('deve formatar telefone de 10 dígitos (fixo/móvel antigo): (XX) XXXX-XXXX', () => {
      expect(maskPhone('4133334444')).toBe('(41) 3333-4444');
    });

    it('deve formatar telefone de 11 dígitos (celular atual): (XX) XXXXX-XXXX', () => {
      expect(maskPhone('41999998888')).toBe('(41) 99999-8888');
    });

    it('deve formatar progressivamente enquanto o usuário digita', () => {
      expect(maskPhone('4')).toBe('(4');
      expect(maskPhone('41')).toBe('(41');
      expect(maskPhone('419')).toBe('(41) 9');
      expect(maskPhone('419999')).toBe('(41) 9999');
      expect(maskPhone('41999998')).toBe('(41) 9999-98');
    });
  });

  describe('maskCEP', () => {
    it('deve formatar CEP com 8 dígitos no padrão XXXXX-XXX', () => {
      expect(maskCEP('80000000')).toBe('80000-000');
      expect(maskCEP('80000')).toBe('80000');
      expect(maskCEP('80000123999')).toBe('80000-123');
    });
  });

  describe('validarCPF (Checagem dos dígitos do CPF no front-end)', () => {
    it('deve aprovar CPFs válidos conhecidos com e sem máscara', () => {
      // CPFs válidos matematicamente (dígitos verificadores corretos)
      expect(validarCPF('52998224725')).toBe(true);
      expect(validarCPF('529.982.247-25')).toBe(true);
      expect(validarCPF('11642276960')).toBe(true);
      expect(validarCPF('116.422.769-60')).toBe(true);
    });

    it('deve rejeitar CPFs com número incorreto de dígitos', () => {
      expect(validarCPF('')).toBe(false);
      expect(validarCPF('123')).toBe(false);
      expect(validarCPF('1234567890')).toBe(false); // 10 dígitos
      expect(validarCPF('123456789012')).toBe(false); // 12 dígitos
    });

    it('deve rejeitar CPFs com todos os dígitos repetidos', () => {
      expect(validarCPF('000.000.000-00')).toBe(false);
      expect(validarCPF('111.111.111-11')).toBe(false);
      expect(validarCPF('22222222222')).toBe(false);
      expect(validarCPF('33333333333')).toBe(false);
      expect(validarCPF('44444444444')).toBe(false);
      expect(validarCPF('55555555555')).toBe(false);
      expect(validarCPF('66666666666')).toBe(false);
      expect(validarCPF('77777777777')).toBe(false);
      expect(validarCPF('88888888888')).toBe(false);
      expect(validarCPF('99999999999')).toBe(false);
    });

    it('deve rejeitar CPF quando o 1º dígito verificador for inválido', () => {
      // Base: 529982247-25 (d1 = 2, d2 = 5). Alterando d1 para 8: 529982247-85
      expect(validarCPF('52998224785')).toBe(false);
    });

    it('deve rejeitar CPF quando o 2º dígito verificador for inválido', () => {
      // Base: 529982247-25. Alterando d2 para 9: 529982247-29
      expect(validarCPF('52998224729')).toBe(false);
    });
  });
});
