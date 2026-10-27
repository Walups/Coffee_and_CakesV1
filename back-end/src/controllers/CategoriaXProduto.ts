import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export interface CategoriaXProduto{

    id_categoria?: string;
    id_produto?: string;

}

export const categoriaXProdutoController = {

    async create (req: Request, res: Response){
        try{
            const novoCategoriaXProduto = req.body as CategoriaXProduto;
            const {data, error} = await supabase.from('categoria_X_produto').insert([novoCategoriaXProduto]).select();

            if (error) return res.status(400).json({ erro: error.message});
            return res.status(201).json(data)
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"})
        }
    },

    async listByProduto (req: Request, res: Response){
        try{
            const {id_produto} = req.params;
            const {data, error} = await supabase.from('categoria_X_produto').select('*').eq('id_produto', id_produto);

            if(error) return res.status(400).json({erro: "Categoria por produto não encontrado"});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async listByCategoria (req: Request, res: Response){
        try{
            const {id_categoria} = req.params;
            const {data, error} = await supabase.from('categoria_X_produto').select('*').eq('id_categoria', id_categoria);

            if(error) return res.status(400).json({erro: "Categoria por produto não encontrado"});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async searchID (req: Request, res: Response){
        try{
            const {id_categoria, id_produto} = req.params;
            const {data, error} = await supabase.from('categoria_X_produto').select('*').match({id_categoria, id_produto}).single();

            if(error) return res.status(400).json({erro: "Categoria por produto não encontrado"});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async delete(req: Request, res: Response){
        try{
            const {id_produto, id_categoria} = req.params;
            const{error} = await supabase.from('pedido').delete().match({id_produto , id_categoria});

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "Pedido deletado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }

    }
};