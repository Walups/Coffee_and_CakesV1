import {Request, Response} from "express";
import { supabase } from "../config/supabase";

export interface Endereco{

    id_encereco?: string;
    id_cliente?: string;
    cep: string;
    lograndouro: string;
    cidade: string;
    uf: string;
    numero: number;
    complemento: string;

}