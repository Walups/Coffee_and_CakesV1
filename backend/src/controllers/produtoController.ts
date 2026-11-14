import {Request, Response} from 'express';
import {supabase} from '../config/supabase';
import { produtoValidatorsPayload } from '../utils/produtoValidators';

export const produtoController = {

    async create (req: Request, res: Response){
        try{

            const {valido, erros, dadosLimpos} = produtoValidatorsPayload(req.body);
            if(!valido) return res.status(400).json({erros});

            const {data, error} = await supabase.from('produto').insert([dadosLimpos]).select();

            if (error) return res.status(400).json({ erro: error.message});
            return res.status(201).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"})
        }
    },

    async listAll (req: Request, res: Response){
        try{
            const {data, error} = await supabase.from('produto').select('*');

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna" });
        }

    },

    async searchID (req: Request, res: Response){
        try{
            const {id_produto} = req.params;
            const {data, error} = await supabase.from('produto').select('*').eq('id_produto', id_produto).single();

            if(error) return res.status(404).json({erro: "Produto não encontrado"});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async update(req: Request, res: Response){
        try{
            const {id_produto} = req.params;
            const {valido, erros, dadosLimpos} = produtoValidatorsPayload(req.body, true);
            if(!valido) return res.status(400).json({erros});

            const {data, error} = await supabase.from('produto').update(dadosLimpos).eq('id_produto', id_produto).select();

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem:"Produto atualizado", produto: data});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async softdelete(req: Request, res: Response){
        try{
            const{id_produto} = req.params;
            const{error} = await supabase.from('produto').update({active: false}).eq('id_produto', id_produto)

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "Produto desativado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }

    },

    async delete(req: Request, res: Response){
        try{
            const{id_produto} = req.params;
            const{error} = await supabase.from('produto').delete().eq('id_produto', id_produto)

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "Produto deletado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }

    }

};