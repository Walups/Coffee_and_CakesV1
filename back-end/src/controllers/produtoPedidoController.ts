import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import {produtoPedidoValidatorsPayload} from "../utils/produtoPedidoValidators";

export const produtoPedidoController = {

    async create ( req: Request, res: Response ){
        try{
            const {valido, erros, dadosLimpos} = produtoPedidoValidatorsPayload(req.body)
            if(!valido) return res.status(400).json({erros})

            const {data, error} = await supabase.from('produto_pedido').insert([dadosLimpos]).select();

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"})
        }
    },

    async searchID (req: Request, res: Response){
        try{
            const {id_produto_pedido} = req.params;
            const {data, error} = await supabase.from('produto_pedido').select('*').eq('id_produto_pedido', id_produto_pedido).single();

            if(error) return res.status(404).json({erro: error.message});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async listAll (req: Request, res: Response){
        try{
            const {data, error} = await supabase.from('produto_pedido').select('*');

            if(error) res.status(400).json({erro: error.message});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async update (req: Request, res: Response){
        try{
            const {id_produto_pedido} = req.params
            const {valido, erros, dadosLimpos} = produtoPedidoValidatorsPayload(req.body, true)
            if(!valido) return res.status(400).json({erros})
            
            const {data, error} = await supabase.from('produto_pedido').update(dadosLimpos).eq('id_produto_pedido', id_produto_pedido).select();

            if (error) res.status(400).json({erro: error.message});
            return res.status(201).json(data);
        }catch(erro){
            return res.status(500).json(({erro: "Falha interna"}))
        }
    },

    async delete(req: Request, res: Response){
        try{
            const {id_produto_pedido} = req.params;
            const {error} = await supabase.from('produto_pedido').delete().eq('id_produto_pedido', id_produto_pedido)

            if(error) res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "Produto pedido deletado!"});
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"})
        }
    }

}