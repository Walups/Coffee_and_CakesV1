import {Request, Response} from "express";
import { supabase } from "../config/supabase";
import { enderecoValidatorsPayload } from "../utils/enderecoValidators";


export interface Endereco{

    id_encereco?: string;
    id_usuario?: string;
    cep: string;
    logradouro: string;
    cidade: string;
    uf: string;
    numero: number;
    complemento?: string;

}

export const enderecoController = {

    async create (req: Request, res: Response){
        try{

            const {valido, erros, dadosLimpos} = enderecoValidatorsPayload(req.body)
            if(!valido){
                return res.status(400).json({erros});
            };
            const {data, error} = await supabase.from('endereco').insert([dadosLimpos]).select();

            if (error) return res.status(400).json({ erro: error.message});
            return res.status(201).json(data)
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"})
        }
    },

    async listAll (req: Request, res: Response){
        try{
            const {data, error} = await supabase.from('endereco').select('*');

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna" });
        }

    },

    async searchID (req: Request, res: Response){
        try{
            const {id_endereco} = req.params;
            const {data, error} = await supabase.from('endereco').select('*').eq('id_endereco', id_endereco).single();

            if(error) return res.status(400).json({erro: "Pedido não encontrado"});
            return res.status(200).json(data);
        }catch(erro){
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async update(req: Request, res: Response){
        try{
            const {id_endereco} = req.params;
            const {valido, erros, dadosLimpos} = enderecoValidatorsPayload(req.body, true);
            
            if(!valido) return res.status(400).json({erros});

            const {data, error} = await supabase.from('endereco').update(dadosLimpos).eq('id_endereco', id_endereco).select();

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem:"Endereço atualizado", endereco: data});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }
    },

    async delete(req: Request, res: Response){
        try{
            const{id_endereco} = req.params;
            const{error} = await supabase.from('endereco').delete().eq('id_endereco', id_endereco)

            if (error) return res.status(400).json({erro: error.message});
            return res.status(200).json({mensagem: "Endereço deletado!!"});
        }catch(erro) {
            return res.status(500).json({erro: "Falha interna"});
        }

    }

}