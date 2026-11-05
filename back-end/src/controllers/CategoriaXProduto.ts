import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import {categoriaXProdutoValidatorsPayload} from "../utils/categoriaXProdutoValidator"

export const categoriaXProdutoController = {

    async create (req: Request, res: Response){
        try{
            const {valido, erros, dadosLimpos} = categoriaXProdutoValidatorsPayload(req.body)
            if(!valido) return res.status(400).json({erros});
            const {data, error} = await supabase.from('categoria_x_produto').insert([dadosLimpos]).select();

            if (error) return res.status(400).json({ erro: error.message});
            return res.status(201).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async listByProduto (req: Request, res: Response){
        try{
            const {id_produto} = req.params;
            const {data, error} = await supabase.from('categoria_x_produto').select('*').eq('id_produto', id_produto);

            if(error) return res.status(400).json({erro: "Produto por produto não encontrado"});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async listByCategoria (req: Request, res: Response){
        try{
            const {id_categoria} = req.params;
            const {data, error} = await supabase.from('categoria_x_produto').select('*').eq('id_categoria', id_categoria);

            if(error) return res.status(400).json({erro: "Categoria por produto não encontrado"});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async searchID (req: Request, res: Response){
        try{
            const {id_categoria, id_produto} = req.params;
            const {data, error} = await supabase.from('categoria_x_produto').select('*').match({id_categoria, id_produto}).single();

            if(error) return res.status(404).json({erro: "Categoria por produto não encontrado"});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async delete(req: Request, res: Response){
        try{
            const {id_produto, id_categoria} = req.params;
            const{error} = await supabase.from('categoria_X_produto').delete().match({id_produto , id_categoria});

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "categoria_x_Produto deletado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }

    }
};