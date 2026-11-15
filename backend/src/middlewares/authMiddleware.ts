import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ erro: "Token de acesso não fornecido ou formato inválido" });
        }

        const token = authHeader.split(' ')[1];
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({ erro: "Token inválido ou expirado" });
        }

        // Busca o perfil na tabela 'usuario' (onde a role e o status active são persistidos)
        const { data: perfil } = await supabase
            .from('usuario')
            .select('role, active')
            .eq('id_usuario', data.user.id)
            .single();

        if (perfil && perfil.active === false) {
            return res.status(403).json({ erro: "Conta de usuário desativada. Entre em contato com o suporte." });
        }

        const role =
            perfil?.role ||
            (data.user.user_metadata?.role as string) ||
            (data.user.app_metadata?.role as string) ||
            'cliente';

        req.user = {
            id: data.user.id,
            email: data.user.email,
            role,
        };
        return next();
    } catch (erro) {
        return res.status(500).json({ erro: "Falha interna na autenticação" });
    }
};
