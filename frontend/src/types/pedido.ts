export type StatusPedido = 'aguardando' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado';

export interface ProdutoPedidoItem {
  id_produto_pedido?: string;
  id_produto?: string;
  quant: number;
  valor_produto_pedido?: number;
  observacao: string | null;
  produto?: {
    nome_produto: string;
    img?: string;
  };
}

export interface UsuarioPedido {
  nome_completo: string;
  email?: string;
  telefone?: string;
}

export interface Pedido {
  id_pedido: string;
  id_usuario?: string;
  id_endereco?: string;
  status: StatusPedido;
  valor_total?: number;
  forma_pagamento?: string;
  created_at?: string;
  criado_em?: string;
  usuario?: UsuarioPedido;
  produto_pedido: ProdutoPedidoItem[];
}

export interface PedidoUpdateResponse {
  mensagem: string;
  pedido?: Pedido;
}

export interface CriarPedidoItemPayload {
  id_produto: string;
  quant: number;
  valor_produto_pedido: number;
  observacao: string | null;
}

export interface CriarPedidoPayload {
  id_endereco: string;
  status: StatusPedido;
  valor_total: number;
  forma_pagamento: string;
  itens: CriarPedidoItemPayload[];
}

export interface CriarPedidoResponse {
  mensagem: string;
  pedido: Pedido;
}
