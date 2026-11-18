import {Request, Response} from 'express';
import {supabase} from '../config/supabase';
import { produtoValidatorsPayload } from '../utils/produtoValidators';

export const produtoController = {

    async create (req: Request, res: Response){
        try{
            const {valido, erros, dadosLimpos, id_categoria} = produtoValidatorsPayload(req.body);
            if(!valido) return res.status(400).json({erros});

            const {data, error} = await supabase.from('produto').insert([dadosLimpos]).select();

            if (error) return res.status(400).json({ erro: error.message});
            if (!data || data.length === 0) return res.status(400).json({ erro: "Erro ao criar produto" });

            const novoProduto = data[0];

            if (id_categoria) {
                await supabase.from('categoria_x_produto').insert([{
                    id_produto: novoProduto.id_produto,
                    id_categoria: id_categoria
                }]);
            }

            return res.status(201).json([{
                ...novoProduto,
                id_categoria: id_categoria || null
            }]);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async listAll (req: Request, res: Response){
        try{
            const {data, error} = await supabase.from('produto').select(`
                *,
                categoria_x_produto (
                    id_categoria
                )
            `);

            if (error) return res.status(400).json({erro: error.message});

            const produtosComCategoria = (data || []).map((p: Record<string, unknown>) => {
                const cxp = p.categoria_x_produto as Array<{ id_categoria: string }> | undefined;
                const id_categoria = cxp?.[0]?.id_categoria || null;
                return {
                    ...p,
                    id_categoria,
                    categoria_x_produto: cxp || []
                };
            });

            return res.status(200).json(produtosComCategoria);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna" });
        }
    },

    async searchID (req: Request, res: Response){
        try{
            const {id_produto} = req.params;
            const {data, error} = await supabase.from('produto').select(`
                *,
                categoria_x_produto (
                    id_categoria
                )
            `).eq('id_produto', id_produto).single();

            if(error || !data) return res.status(404).json({erro: "Produto não encontrado"});

            const cxp = data.categoria_x_produto as Array<{ id_categoria: string }> | undefined;
            const id_categoria = cxp?.[0]?.id_categoria || null;

            return res.status(200).json({
                ...data,
                id_categoria
            });
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async update(req: Request, res: Response){
        try{
            const {id_produto} = req.params;
            const {valido, erros, dadosLimpos, id_categoria} = produtoValidatorsPayload(req.body, true);
            if(!valido) return res.status(400).json({erros});

            let dataProduto: Record<string, unknown>[] = [];

            if (Object.keys(dadosLimpos).length > 0) {
                const {data, error} = await supabase.from('produto').update(dadosLimpos).eq('id_produto', id_produto).select();
                if (error) return res.status(400).json({erro: error.message});
                if (!data || data.length === 0) return res.status(404).json({erro: "Produto não encontrado"});
                dataProduto = data;
            } else {
                const {data, error} = await supabase.from('produto').select('*').eq('id_produto', id_produto);
                if (error) return res.status(400).json({erro: error.message});
                if (!data || data.length === 0) return res.status(404).json({erro: "Produto não encontrado"});
                dataProduto = data;
            }

            if (id_categoria !== undefined) {
                await supabase.from('categoria_x_produto').delete().eq('id_produto', id_produto);
                if (id_categoria) {
                    await supabase.from('categoria_x_produto').insert([{
                        id_produto,
                        id_categoria
                    }]);
                }
            }

            let catId = id_categoria;
            if (catId === undefined) {
                const { data: cxp } = await supabase.from('categoria_x_produto').select('id_categoria').eq('id_produto', id_produto).limit(1);
                catId = cxp?.[0]?.id_categoria || null;
            }

            const produtoAtualizado = {
                ...dataProduto[0],
                id_categoria: catId || null
            };

            return res.status(200).json({mensagem:"Produto atualizado", produto: [produtoAtualizado]});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async softdelete(req: Request, res: Response){
        try{
            const{id_produto} = req.params;
            const{error} = await supabase.from('produto').update({active: false}).eq('id_produto', id_produto);

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "Produto desativado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async delete(req: Request, res: Response){
        try{
            const{id_produto} = req.params;
            await supabase.from('categoria_x_produto').delete().eq('id_produto', id_produto);
            const{error} = await supabase.from('produto').delete().eq('id_produto', id_produto);

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "Produto deletado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }
    }

};