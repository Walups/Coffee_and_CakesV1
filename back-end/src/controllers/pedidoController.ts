import {Request, Response} from 'express';
import {supabase} from '../config/supabase';
import { pedidoValidatorsPayload } from '../utils/pedidoValidators';

export const pedidoController = {

    //corrigir o create
    async create (req: Request, res: Response){
        try{
            const {valido, erros, dadosLimpos} = pedidoValidatorsPayload(req.body)
            if(!valido) return res.status(400).json({erros})
           
            const {data, error} = await supabase.from('pedido').insert([dadosLimpos]).select();

            if (error) return res.status(400).json({ erro: error.message});
            return res.status(201).json(data)
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"})
        }
    },

    async listAll (req: Request, res: Response){
        try{
            const {data, error} = await supabase.from('pedido').select('*');

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna" });
        }

    },

    async searchID (req: Request, res: Response){
        try{
            const {id_pedido} = req.params;
            const {data, error} = await supabase.from('pedido').select(`
                *,
                usuario ( nome_completo, email, telefone ),
                endereco ( logradouro, numero, cep, cidade, uf ),
                produto_pedido (
                    id_produto_pedido,
                    quant,
                    valor_produto_p,
                    observacao,
                    produto ( nome_produto, img )
                )
            `).eq('id_pedido', id_pedido).single();

            if(error) return res.status(404).json({erro: "Pedido não encontrado"});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },
    // V2 lógica para validar que o UUID realmente exista antes de atualizar
    async update(req: Request, res: Response){
        try{
            const {id_pedido} = req.params;
            const {valido, erros, dadosLimpos} = pedidoValidatorsPayload(req.body, true)
            if(!valido) return res.status(400).json({erros});
                const {data, error} = await supabase.from('pedido').update(dadosLimpos).eq('id_pedido', id_pedido).select();

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem:"Pedido atualizado", pedido: data});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }
    },
    // V2 lógica para validar que o UUID realmente exista antes de deletar
    async delete(req: Request, res: Response){
        try{
            const{id_pedido} = req.params;
            const{error} = await supabase.from('pedido').delete().eq('id_pedido', id_pedido)

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "Pedido deletado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }

    },
    // V2 lógica para validar que o UUID realmente exista antes de atualizar
    async softDelete(req: Request, res: Response){
        try{
            const{id_pedido} = req.params;
            const{error} = await supabase.from('pedido').update({status: "cancelado" }).eq('id_pedido', id_pedido)

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "Pedido cancelado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }

    }

};