import {Request, Response} from "express";
import { supabase } from "../config/supabase";
import { enderecoValidators } from "../utils/enderecoValidators";

export interface Endereco{

    id_encereco?: string;
    id_cliente?: string;
    cep: string;
    lograndouro: string;
    cidade: string;
    uf: string;
    numero: number;
    complemento?: string;

}

export const enderecoController = {

    async create (req: Request, res: Response){
        try{

            const {cep, lograndouro, cidade, uf, numero} = req.body
            if(!cep || !lograndouro || !cidade || !uf || !numero){
                return res.status(400).json({erro: "Endereço imcompleto"});
            };

            const erroValidacao = enderecoValidators(req.body);
            if(erroValidacao){return res.status(400).json({erro: erroValidacao})};

            const novoEndereco = req.body as Endereco;
            const {data, error} = await supabase.from('endereco').insert([novoEndereco]).select();

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
            const erroValidacao = enderecoValidators(req.body);
            if(erroValidacao){return res.status(400).json({erro: erroValidacao})};

            const {id_endereco} = req.params;
            const dataUpdate = req.body as Partial<Endereco>;
            const {data, error} = await supabase.from('endereco').update(dataUpdate).eq('id_endereco', id_endereco).select();

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