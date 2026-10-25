import {Request, Response} from 'express';
import {supabase} from '../config/supabase';


export interface Pedido {

    id_pedido?: string,
    id_endereco?: string,
    id_cliente?: string,
    nfe: string,
    valor_total: number

}

export const pedidoController = {

    async create (req: Request, res: Response){
        try{
            const novoPedido = req.body as Pedido;
            const {data, error} = await supabase.from('pedido').insert([novoPedido]).select();

            if (error) return res.status(400).json({ erro: error.message});
            return res.status(201).json(data)
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"})
        }
    },

    async listAll (req: Request, res: Response){
        try{
            const {data, error} = await supabase.from('pedido').select('*');

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna" });
        }

    },

    async searchID (req: Request, res: Response){
        try{
            const {id_pedido} = req.params;
            const {data, error} = await supabase.from('pedido').select('*').eq('id_pedido', id_pedido).single();

            if(error) return res.status(400).json({erro: "Pedido não encontrado"});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async update(req: Request, res: Response){
        try{
            const {id_pedido} = req.params;
            const dataUpdate = req.body as Partial<Pedido>;
            const {data, error} = await supabase.from('pedido').update(dataUpdate).eq('id_pedido', id_pedido).select();

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem:"Pedido atualizado", pedido: data});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async delete(req: Request, res: Response){
        try{
            const{id_pedido} = req.params;
            const{error} = await supabase.from('pedido').delete().eq('id_pedido', id_pedido)

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "Pedido deletado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }

    }

};