import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export interface CategoriaXProduto{

    id_categoria?: string;
    id_produto?: string;

}