import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export interface ProdutoPedido{

    id_produto_pedido?: string;
    id_pedido?: string;
    id_produto?: string;
    quant: number;
    valor_produto_pedido: number;
    observacao: string;
        
}