import { Request, Response, NextFunction } from "express";
import { error } from "node:console";

export const checkRole = (rolesPermitidas: string[]) =>{
    return (req: Request, res: Response, next: NextFunction) =>{
        try{
            const user = (req as any).user

            if(!user) return res.status(401).json({erro: "usuário não autenticado"});
            const userRole = user.user_metadata?.role || user.app_metadata?.role

            if(!userRole || !rolesPermitidas.includes(userRole)) return res.status(403).json({erro: "acesso negado, permissão insuficiente"})
            return next()
        }catch(erro){
            return res.status(500).json({erro: "Falha interna de autenticação"})
        }
    }
}