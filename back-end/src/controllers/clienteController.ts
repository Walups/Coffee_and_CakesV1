import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export interface Cliente{

    id_cliente?: string;
    nome_completo: string;
    cpf: string;
    telefone: string;

}