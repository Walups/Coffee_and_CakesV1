import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export interface Cliente{

    id_cliente?: string;
    nome_completo: string;
    cpf: string;
    telefone: string;

}

export const clienteController = {

    async create(req: Request, res: Response){
        try{
            const novoCliente = req.body as Cliente;
            const {error, data} = await supabase.from('cliente').insert([novoCliente]).select();

            if(error) res.status(400).json({erro: error.message});
            return res.status(200).json(data);
        }catch{
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async listAll (req: Request, res: Response){
        try{
            const {data, error} = await supabase.from('cliente').select('*');

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna" });
        }

    },

    async searchID (req: Request, res: Response){
        try{
            const {id_cliente} = req.params;
            const {data, error} = await supabase.from('cliente').select('*').eq('id_cliente', id_cliente).single();

            if(error) return res.status(400).json({erro: "Pedido não encontrado"});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async update(req: Request, res: Response){
        try{
            const {id_cliente} = req.params;
            const dataUpdate = req.body as Partial<Cliente>;
            const {data, error} = await supabase.from('cliente').update(dataUpdate).eq('id_cliente', id_cliente).select();

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem:"Cliente atualizado", pedido: data});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async delete(req: Request, res: Response){
        try{
            const{id_cliente} = req.params;
            const{error} = await supabase.from('cliente').delete().eq('id_cliente', id_cliente);

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "cliente deletado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }

    }

};