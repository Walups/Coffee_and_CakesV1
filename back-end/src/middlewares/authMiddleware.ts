import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction)=>{
    try{
        const authHeader = req.headers.authorization;
        if ( !authHeader|| !authHeader.startsWith('Bearer ')) return res.status(401).json({erro: "Token de acesso não fornecido ou formato inválido"});

        const token = authHeader.split(' ')[1];
        const {data, error} = await supabase.auth.getUser(token)

        if(error || !data.user) return res.status(401).json({erro: "Token inválido ou expirado"});
        (req as any).user = data.user;
        return next()
    }catch (erro){
        return res.status(500).json({erro: "Falha interna na autenticação"})
    }
}