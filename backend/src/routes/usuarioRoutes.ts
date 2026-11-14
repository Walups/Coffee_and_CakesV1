import { Router } from "express";
import { usuarioController } from "../controllers/usuarioController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { checkRole } from "../middlewares/checkRole";

const router = Router();

router.post('/register', usuarioController.register);
router.post('/login', usuarioController.login);

router.get('/me', authMiddleware, usuarioController.getMe);

router.get('/', authMiddleware, checkRole(['admin']), usuarioController.listAll);
router.get('/:id_usuario', authMiddleware, checkRole(['admin']), usuarioController.searchID);
router.patch('/:id_usuario', authMiddleware, usuarioController.update);
router.patch('/:id_usuario/desativar', authMiddleware, usuarioController.softDelete);
router.delete('/:id_usuario', authMiddleware, checkRole(['admin']), usuarioController.delete);


export default router;
