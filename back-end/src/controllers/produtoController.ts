import {Request, Response} from 'express';
import {supabase} from '../config/supabase';
import { produtoValidators } from '../utils/produtoValidators';


export interface Produto{

    id_produto?: string;
    nome_produto: string;
    preco: number;
    desconto_preco: number;
    descricao?: string;
    imagem_produto: string;
}

export const produtoController = {

    async create (req: Request, res: Response){
        try{

            const{nome_produto, preco, img} = req.body;
            if(!nome_produto || preco === undefined || !img){
                return res.status(400).json({erro: "Nome, preço e imagem são obrigatórios"})
            }

            const erroValidacao = produtoValidators(req.body)
            if(erroValidacao){return res.status(400).json({erro: erroValidacao})};

            const novoProduto = req.body as Produto;
            const {data, error} = await supabase.from('produto').insert([novoProduto]).select();

            if (error) return res.status(400).json({ erro: error.message});
            return res.status(201).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"})
        }
    },

    async listAll (req: Request, res: Response){
        try{
            const {data, error} = await supabase.from('produto').select('*');

            if (error) return res.status(200).json({erro: error.message});
            return res.status(201).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna" });
        }

    },

    async searchID (req: Request, res: Response){
        try{
            const {id_produto} = req.params;
            const {data, error} = await supabase.from('produtto').select('*').eq('id_produto', id_produto).single();

            if(error) return res.status(404).json({erro: "Produro não encontrado"});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async update(req: Request, res: Response){
        try{
            const erroValidacao = produtoValidators(req.body)
            if(erroValidacao) return res.status(400).json({erro: erroValidacao});

            const {id_produto} = req.params;
            const dataUpdate = req.body as Partial<Produto>;
            const {data, error} = await supabase.from('produto').update(dataUpdate).eq('id_produto', id_produto).select();

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
            return res.status(200).json({mensagem: "Produto deletado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }

    }

};