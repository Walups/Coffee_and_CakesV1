import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export interface Categoria{

    id_categoria?: string,
    nome_categoria: string,
    deconto_categoria: number,
    url_categoria: string,

}

export const categoriaController = {

    async create (req: Request, res: Response){
        try{
            const novaCategoria = req.body as Categoria;
            const {data, error} = await supabase.from('categoria').insert([novaCategoria]).select();

            if(error) return res.status(400).json({ erro: error.message});
            return res.status(200).json(data)
        }catch{
            return res.status(500).json({erro: "Falha interna"})
        }
    },

    async listAll (req:Request, res: Response){
        try{
            const {data, error} = await supabase.from('categoria').select('*');

            if(error) return res.status(400).json({erro: error.message});
            return res.status(200).json(data);
        }catch{
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async searchID (req: Request, res: Response){
        try{
            
            const{id_categoria} = req.params;
            const{data, error} = await supabase.from('categoria').select('*').eq('id_categoria', id_categoria).single();

            if(error) return res.status(400).json({erro: "Categoria não encontrada"});
            return res.status(200).json(data)
        }catch{
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async delete(req: Request, res: Response){
        try{
            const{id_categoria} = req.params;
            const{error} = await supabase.from('categoria').delete().eq('id_categoria', id_categoria)

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "Categoria deletado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }

    },

    async update(req: Request, res: Response){
        try{
            const{id_categoria} = req.params;
            const dataUpdate = req.body as Partial<Categoria>;
            const {data, error} = await supabase.from('categoria').update(dataUpdate).eq('id_categoria', id_categoria).select()

            if(error) return res.status(400).json({erro: error.message})
            return res.status(200).json({mensagem:"Categoria atualizado", pedido: data})
        }catch{
            return res.status(500).json({erro: "Falha interna"})
        }
    }

}