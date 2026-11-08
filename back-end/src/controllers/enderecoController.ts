import {Request, Response} from "express";
import { supabase } from "../config/supabase";
import { enderecoValidatorsPayload } from "../utils/enderecoValidators";

export const enderecoController = {

    async create (req: Request, res: Response){
        try{
            const userId = (req as any).user.id
            const {valido, erros, dadosLimpos} = enderecoValidatorsPayload(req.body)
            if(!valido) return res.status(400).json({erros});
            const payloadFinal = {
                ...dadosLimpos,
                id_usuario: userId
            }
            
            const {data, error} = await supabase.from('endereco').insert([payloadFinal]).select();

            if (error) return res.status(400).json({ erro: error.message});
            return res.status(201).json(data)
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"})
        }
    },

    async listMine (req: Request, res: Response){
        try{
        
            const userId = (req as any).user.id
            const {data, error} = await supabase.from('endereco').select('*').eq('id_usuario', userId);

            if(error) return res.status(400).json({erro: "Sem endereços cadastarados"});
            return res.status(200).json(data[0]);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    // V2 lógica para validar que o UUID realmente exista antes de atualizar
    async update(req: Request, res: Response){
        try{
            const {id_endereco} = req.params;
            const userID = (req as any).user.id;
            const {valido, erros, dadosLimpos} = enderecoValidatorsPayload(req.body, true);
            
            if(!valido) return res.status(400).json({erros});
            delete dadosLimpos.id_usuario;

            const {data, error} = await supabase.from('endereco').update(dadosLimpos).eq('id_endereco', id_endereco).eq('id_usuario', userID).select();

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem:"Endereço atualizado", endereco: data});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }
    },
    // V2 lógica para validar que o UUID realmente exista antes de deletar
    async delete(req: Request, res: Response){
        try{
            const{id_endereco} = req.params;
            const userId = (req as any).user.id
            const{error} = await supabase.from('endereco').delete().eq('id_endereco', id_endereco).eq("id_usuario", userId)

            if (error) return res.status(404).json({erro: error.message});
            return res.status(200).json({mensagem: "Endereço deletado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }

    }

}