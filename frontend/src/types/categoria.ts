export interface Categoria {
  id_categoria: string;
  nome_categoria: string;
  desconto_categoria?: number | null;
  img_banner?: string | null;
  active?: boolean;
  criado_em?: string;
  created_at?: string;
}

export interface CategoriaPayload {
  nome_categoria: string;
  desconto_categoria?: number | null;
  img_banner?: string | null;
  active?: boolean;
}

export interface CategoriaUpdateResponse {
  mensagem: string;
  categoria: Categoria[] | Categoria;
}

export interface CategoriaDeleteResponse {
  mensagem: string;
}
