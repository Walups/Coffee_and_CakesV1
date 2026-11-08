import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { usuarioValidatorsPayload } from "../utils/usuarioValidators";

export const usuarioController = {

    async create(req: Request, res: Response){
        try{

            const userId = (req as any).user.id;
            const userRole = (req as any).user.role;

            const{valido, erros, dadosSanitizados} = usuarioValidatorsPayload(req.body);
            if(!valido){
                return res.status(400).json({erros})
            }

            const payloadFinal ={
                ...dadosSanitizados,
                id_usuario: userId,
                role: userRole === 'admin' ? (dadosSanitizados.role || 'cliente'): 'cliente',
                active: true
            };

            const {error, data} = await supabase.from('usuario').insert([payloadFinal]).select();

            if(error) return res.status(400).json({erro: error.message});
            return res.status(201).json(data);
        }catch (erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async getMe(req: Request, res: Response){
        try{
            const userID = (req as any).user.id;
            const {data, error} = await supabase.from('usuário').select('*').eq('id_usuario', userID).single()

            if(error) return res.status(404).json({erro: "Usuário não encontrado"});
            return res.status(200).json(data);
        }catch(erro){
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

            if(error) return res.status(404).json({erro: "usuário não encontrado"});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    // V2 lógica para validar que o UUID realmente exista antes de atualizar
    async update(req: Request, res: Response){
        try{
            const targetId = (req as any).user.role === 'admin' ? req.params.id_usuario : (req as any).user.id;
            
            const {valido, erros, dadosSanitizados} = usuarioValidatorsPayload(req.body, true);
            if(!valido) return res.status(400).json({erros});

            if((req as any).user.role !== 'admin'){
                delete dadosSanitizados.role;
                delete dadosSanitizados.active;
            }

            const {data, error} = await supabase.from('usuario').update(dadosSanitizados).eq('id_usuario', targetId).select();

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem:"usuario atualizado", usuario: data});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    // V2 lógica para validar que o UUID realmente exista antes de atualizar
    async softDelete(req: Request, res: Response){
        try{
            const targetId = (req as any).user.role === 'admin' ? req.params.id_usuario : (req as any).user.id;
            const{error} = await supabase.from('usuario').update({active: false}).eq('id_usuario', targetId);

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "Usuario deletado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }

    },

    // V2 lógica para validar que o UUID realmente exista antes de deletar
    async delete(req: Request, res: Response){
        try{
            const{id_usuario} = req.params;
            const{error} = await supabase.from('usuario').delete().eq('id_usuario', id_usuario);

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "Usuario deletado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }

    }

};