import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { usuarioValidatorsPayload } from "../utils/usuarioValidators";

export const usuarioController = {

    //criação de conta
    async register(req: Request, res: Response) {
        try {
            const { email, senha, ...restoBody } = req.body;
            const { valido, erros, dadosSanitizados } = usuarioValidatorsPayload({ email, senha, ...restoBody });
            if (!valido) return res.status(400).json({ erros });

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: dadosSanitizados.email,
                password: senha,
            });

            if (authError) return res.status(400).json({ erro: authError.message });
            if (!authData.user) return res.status(400).json({ erro: "Falha ao registrar credenciais" });

            const payloadPerfil = {
                ...dadosSanitizados,
                id_usuario: authData.user.id,
                role: 'cliente', 
                active: true
            };

            const { data: perfilCriado, error: profileError } = await supabase.from('usuario').insert([payloadPerfil]).select().single();

            if (profileError) {
                await supabase.auth.admin.deleteUser(authData.user.id);
                return res.status(400).json({ erro: profileError.message });
            }

            return res.status(201).json({
                mensagem: "Usuário cadastrado com sucesso!",
                usuario: perfilCriado
            });
        } catch (erro) {
            return res.status(500).json({ erro: "Falha interna" });
        }
    },

    async login(req: Request, res: Response) {
        try {
            const { email, senha } = req.body;

            if (!email || !senha) {
                return res.status(400).json({ erros: ["E-mail e senha são obrigatórios"] });
            }

            const { data: authSession, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password: senha,
            });

            if (authError) return res.status(401).json({ erro: "E-mail ou senha incorretos" });

            const { data: perfil } = await supabase
                .from('usuario')
                .select('*')
                .eq('id_usuario', authSession.user.id)
                .single();

            if (perfil && !perfil.active) {
                return res.status(403).json({ erro: "Conta de usuário desativada. Entre em contato com o suporte." });
            }

            return res.status(200).json({
                mensagem: "Login realizado com sucesso!",
                token: authSession.session.access_token,
                usuario: perfil || authSession.user
            });
        } catch (erro) {
            return res.status(500).json({ erro: "Falha interna" });
        }
    },

    async getMe(req: Request, res: Response) {
        try {
            const userID = (req as any).user.id;
            const { data, error } = await supabase.from('usuario').select('*').eq('id_usuario', userID).single();

            if (error) return res.status(404).json({ erro: "Usuário não encontrado" });
            return res.status(200).json(data);
        } catch (erro) {
            return res.status(500).json({ erro: "Falha interna" });
        }
    },

    async listAll(req: Request, res: Response) {
        try {
            const { data, error } = await supabase.from('usuario').select('*');

            if (error) return res.status(400).json({ erro: error.message });
            return res.status(200).json(data);
        } catch (erro) {
            return res.status(500).json({ erro: "Falha interna" });
        }
    },

    async searchID(req: Request, res: Response) {
        try {
            const { id_usuario } = req.params;
            const { data, error } = await supabase.from('usuario').select('*').eq('id_usuario', id_usuario).single();

            if (error) return res.status(404).json({ erro: "Usuário não encontrado" });
            return res.status(200).json(data);
        } catch (erro) {
            return res.status(500).json({ erro: "Falha interna" });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const userRole = (req as any).user.role;
            const userId = (req as any).user.id;

            const targetId = userRole === 'admin' && req.params.id_usuario ? req.params.id_usuario : userId;
            
            const { valido, erros, dadosSanitizados } = usuarioValidatorsPayload(req.body, true);
            if (!valido) return res.status(400).json({ erros });

            if (userRole !== 'admin') {
                delete dadosSanitizados.role;
                delete dadosSanitizados.active;
                delete dadosSanitizados.id_usuario;
            }

            const { data, error } = await supabase.from('usuario').update(dadosSanitizados).eq('id_usuario', targetId).select();

            if (error) return res.status(400).json({ erro: error.message });
            if (!data || data.length === 0) {
                return res.status(404).json({ erro: "Usuário não encontrado ou sem permissão" });
            }

            return res.status(200).json({ mensagem: "Usuário atualizado com sucesso", usuario: data[0] });
        } catch (erro) {
            return res.status(500).json({ erro: "Falha interna" });
        }
    },

    async softDelete(req: Request, res: Response) {
        try {
            const userRole = (req as any).user.role;
            const userId = (req as any).user.id;

            const targetId = userRole === 'admin' && req.params.id_usuario ? req.params.id_usuario : userId;

            const { data, error } = await supabase.from('usuario').update({ active: false }).eq('id_usuario', targetId).select();

            if (error) return res.status(400).json({ erro: error.message });
            if (!data || data.length === 0) {
                return res.status(404).json({ erro: "Usuário não encontrado ou sem permissão" });
            }

            return res.status(200).json({ mensagem: "Usuário desativado com sucesso!", usuario: data[0] });
        } catch (erro) {
            return res.status(500).json({ erro: "Falha interna" });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const userRole = (req as any).user.role;
            const userId = (req as any).user.id;

            const targetId = (userRole === 'admin' && req.params.id_usuario ? req.params.id_usuario : userId) as string;

            const { data, error } = await supabase
                .from('usuario')
                .delete()
                .eq('id_usuario', targetId)
                .select();

            if (error) return res.status(400).json({ erro: error.message });
            if (!data || data.length === 0) {
                return res.status(404).json({ erro: "Usuário não encontrado" });
            }

            const { error: authError } = await supabase.auth.admin.deleteUser(targetId);
            if (authError) {
                return res.status(400).json({ 
                    erro: "Perfil removido, mas ocorreu uma falha ao excluir as credenciais: " + authError.message 
                });
            }

            return res.status(200).json({ mensagem: "Usuário deletado permanentemente!" });
        } catch (erro) {
            return res.status(500).json({ erro: "Falha interna" });
        }
    }

};