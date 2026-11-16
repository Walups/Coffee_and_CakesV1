export type StatusPedido = 'aguardando' | 'em_preparo' | 'pronto' | 'cancelado';

export interface ProdutoPedidoItem {
  id_produto_pedido: string;
  quant: number;
  valor_produto_pedido?: number;
  observacao: string | null;
  produto: {
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
  status: StatusPedido;
  valor_total?: number;
  created_at?: string;
  usuario: UsuarioPedido;
  produto_pedido: ProdutoPedidoItem[];
}

export interface PedidoUpdateResponse {
  mensagem: string;
  pedido?: Pedido;
}
