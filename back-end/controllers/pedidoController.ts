import {Request, Response} from 'express';
import {supabase} from '../config/supabase';

export interface produto {

    id_produto?: string;
    nome_procuro: string;
    preco: number;
    desconto_produto: number;
    descricao: string;
    imagem_produto: string;

}

export const pedidoController = {

    async create(req: Request, res: Response){
        try{
            const novoProduto = req.body as produto;
            const {data, error} = await supabase.from('pedidos').insert([novoPedido]).select();

            if(error) return res.status(400).json({erro: error.message});
            return res.status(201).json(data);
        }catch (erro) {
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async list(req: Request, res: Response){

        try{

            const {data, error} = await supabase.from(pedido)

        }

    }

}