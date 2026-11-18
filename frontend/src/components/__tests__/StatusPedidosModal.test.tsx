import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  StatusPedidosModal,
  formatarDataHora,
  formatarNumeroCurto,
  getStatusBadgeStyle,
} from '../StatusPedidosModal';

vi.mock('../../services/pedidoService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/pedidoService')>();
  return {
    ...actual,
    pedidoService: {
      ...actual.pedidoService,
      listarMeus: vi.fn().mockResolvedValue([]),
    },
  };
});

describe('StatusPedidosModal e Utilitários de Acompanhamento de Pedidos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatarDataHora', () => {
    it('deve formatar data ISO em padrão pt-BR legível', () => {
      const dataIso = '2026-11-17T15:30:00Z';
      const formatada = formatarDataHora(dataIso);
      expect(formatada).not.toBe('Data não informada');
      expect(formatada).toContain('2026');
    });

    it('deve retornar "Data não informada" se data for nula ou inválida', () => {
      expect(formatarDataHora(undefined)).toBe('Data não informada');
      expect(formatarDataHora('data-invalida')).toBe('Data não informada');
    });
  });

  describe('formatarNumeroCurto', () => {
    it('deve formatar ID UUID no padrão #CC-XXXX em caixa alta', () => {
      expect(formatarNumeroCurto('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')).toBe('#CC-A1B2');
      expect(formatarNumeroCurto('#CC-9999')).toBe('#CC-9999');
      expect(formatarNumeroCurto('')).toBe('#CC-0000');
    });
  });

  describe('getStatusBadgeStyle', () => {
    it('deve retornar cores e rótulo corretos para cada status de pedido', () => {
      const aguardando = getStatusBadgeStyle('aguardando');
      expect(aguardando.bg).toContain('amber');
      expect(aguardando.label).toBe('Aguardando');

      const emPreparo = getStatusBadgeStyle('em_preparo');
      expect(emPreparo.bg).toContain('blue');
      expect(emPreparo.label).toBe('Em preparo');

      const pronto = getStatusBadgeStyle('pronto');
      expect(pronto.bg).toContain('emerald');
      expect(pronto.label).toBe('Pronto');

      const entregue = getStatusBadgeStyle('entregue');
      expect(entregue.bg).toContain('teal');
      expect(entregue.label).toBe('Entregue');

      const cancelado = getStatusBadgeStyle('cancelado');
      expect(cancelado.bg).toContain('red');
      expect(cancelado.label).toBe('Cancelado');
    });
  });

  describe('StatusPedidosModal (Renderização)', () => {
    it('deve retornar null se isOpen for false', () => {
      const html = renderToString(
        <StatusPedidosModal isOpen={false} onClose={vi.fn()} />
      );
      expect(html).toBe('');
    });

    it('deve renderizar o modal com título "Status dos Pedidos", botão atualizar e fechar quando aberto', () => {
      const html = renderToString(
        <StatusPedidosModal isOpen={true} onClose={vi.fn()} />
      );

      expect(html).toContain('Status dos Pedidos');
      expect(html).toContain('aria-label="Atualizar status dos pedidos"');
      expect(html).toContain('aria-label="Fechar"');
      expect(html).toContain('bg-[#FDE5D7]');
    });
  });
});
