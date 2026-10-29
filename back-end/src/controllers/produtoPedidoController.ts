import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { produtoPedidoValidators } from "../utils/produtoPedidoValidators";

export interface ProdutoPedido{

    id_produto_pedido?: string;
    id_pedido?: string;
    id_produto?: string;
    quant: number;
    valor_produto_pedido: number;
    observacao: string;
        
}

export const produtoPedidoController = {

    async create (res: Response, req: Request){
        try{
            const {quant} = req.body;
            if(!quant){return res.status(400).json({erro: "quantidade obrigatória"})}

            const erroValidacao = produtoPedidoValidators(req.body);
            if (erroValidacao){return res.status(400).json({erro: erroValidacao})}

            const novoProdutoPedido = req.body as ProdutoPedido;
            const {data, error} = await supabase.from('produto_pedido').insert([novoProdutoPedido]).select();

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json(data);
        }catch{
            return res.status(500).json({erro: "Falha interna"})
        }
    },

    async searchID (res: Response, req: Request){
        try{
            const {id_produto_pedido} = req.params;
            const {data, error} = await supabase.from('produto_pedido').select('*').eq('id_produto_pedido', id_produto_pedido).single();

            if(error) return res.status(400).json({erro: error.message});
            return res.status(200).json(data);
        }catch{
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async listAll (req: Request, res: Response){
        try{
            const {data, error} = await supabase.from('produto_pedido').select('*');

            if(error) res.status(400).json({erro: error.message});
            return res.status(200).json(data);
        }catch{
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async update (req: Request, res: Response){
        try{
            const erroValidacao = produtoPedidoValidators(req.body);
            if (erroValidacao){return res.status(400).json({erro: erroValidacao})}

            const {id_produto_pedido} = req.params
            const dataUpdate = req.body as Partial<ProdutoPedido>;
            const {data, error} = await supabase.from('produto_pedido').update(dataUpdate).eq('id_produto_pedido', id_produto_pedido).select();

            if (error) res.status(400).json({erro: error.message});
            return res.status(200).json(data);
        }catch{
            return res.status(500).json(({erro: "Falha interna"}))
        }
    },

    async delete(req: Request, res: Response){
        try{
            const {id_produto_pedido} = req.params;
            const {error} = await supabase.from('produto_pedido').delete().eq('id_produto_pedido', id_produto_pedido)

            if(error) res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "Produto pedido deletado!"});
        }catch{
            return res.status(500).json({erro: "Falha interna"})
        }
    }

}