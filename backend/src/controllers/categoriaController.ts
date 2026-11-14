import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { categoriaValidatorsPayload } from "../utils/categoriaValidators";

export const categoriaController = {

    async create (req: Request, res: Response){
        try{
            const {valido, erros, dadosLimpos} = categoriaValidatorsPayload(req.body)
            if(!valido) return res.status(400).json({erros})

            const {data, error} = await supabase.from('categoria').insert([dadosLimpos]).select();

            if(error) return res.status(400).json({ erro: error.message});
            return res.status(201).json(data);
        }catch{
            return res.status(500).json({erro: "Falha interna"});
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

            if(error) return res.status(404).json({erro: "Categoria não encontrada"});
            return res.status(200).json(data)
        }catch{
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async softDelete(req: Request, res: Response){
        try{
            const{id_categoria} = req.params;
            const{error} = await supabase.from('categoria').update({active: false}).eq('id_categoria', id_categoria)

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "Categoria desativado!!"});
        }catch(erro) {
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

            const {valido, erros, dadosLimpos} = categoriaValidatorsPayload(req.body, true)
            if(!valido) return res.status(400).json({erros})
            
            const {data, error} = await supabase.from('categoria').update(dadosLimpos).eq('id_categoria', id_categoria).select()

            if(error) return res.status(400).json({erro: error.message})
            return res.status(200).json({mensagem:"Categoria atualizada", categoria: data})
        }catch{
            return res.status(500).json({erro: "Falha interna"})
        }
    }

}