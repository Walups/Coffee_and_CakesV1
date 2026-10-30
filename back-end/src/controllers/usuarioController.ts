import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export interface Usuario{

    id_usuario?: string;
    nome_completo: string;
    cpf: string;
    telefone: string;
    email: string;
    active?: boolean;
    role?: string;
    criado_em?: string

}

export const usuarioController = {

    async create(req: Request, res: Response){
        try{
            const novoUsuario = req.body as Usuario;
            const {error, data} = await supabase.from('usuario').insert([novoUsuario]).select();

            if(error) res.status(400).json({erro: error.message});
            return res.status(200).json(data);
        }catch{
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async listAll (req: Request, res: Response){
        try{
            const {data, error} = await supabase.from('usuario').select('*');

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna" });
        }

    },

    async searchID (req: Request, res: Response){
        try{
            const {id_usuario} = req.params;
            const {data, error} = await supabase.from('usuario').select('*').eq('id_usuario', id_usuario).single();

            if(error) return res.status(400).json({erro: "Pedido não encontrado"});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async update(req: Request, res: Response){
        try{
            const {id_usuario} = req.params;
            const dataUpdate = req.body as Partial<Usuario>;
            const {data, error} = await supabase.from('usuario').update(dataUpdate).eq('id_usuario', id_usuario).select();

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem:"usuario atualizado", pedido: data});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async softDelete(req: Request, res: Response){
        try{
            const{id_usuario} = req.params;
            const{error} = await supabase.from('usuario').update({active: "false"}).eq('id_usuario', id_usuario);

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "Usuario deletado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }

    }

};