export interface Produto {
  id_produto: string;
  nome_produto: string;
  preco: number;
  desconto_produto?: number | null;
  descricao?: string | null;
  imagem_produto: string;
  id_categoria?: string | null;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProdutoPayload {
  nome_produto: string;
  preco: number;
  imagem_produto: string;
  desconto_produto?: number | null;
  descricao?: string | null;
  id_categoria?: string | null;
  active?: boolean;
}

export interface ProdutoUpdateResponse {
  mensagem: string;
  produto?: Produto[];
}

export interface ProdutoDeleteResponse {
  mensagem: string;
}
