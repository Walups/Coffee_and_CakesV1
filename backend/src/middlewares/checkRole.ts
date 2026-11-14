import { Request, Response, NextFunction } from "express";

export const checkRole = (rolesPermitidas: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user;

            if (!user) return res.status(401).json({ erro: "usuário não autenticado" });
            const userRole = user.role;

            if (!userRole || !rolesPermitidas.includes(userRole)) {
                return res.status(403).json({ erro: "acesso negado, permissão insuficiente" });
            }
            return next();
        } catch (erro) {
            return res.status(500).json({ erro: "Falha interna de autenticação" });
        }
    };
};
