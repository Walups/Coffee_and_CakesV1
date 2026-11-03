import { Router } from "express";
import { usuarioController } from "../controllers/usuarioController";

const router = Router();

router.post('/', usuarioController.create);
router.get('/', usuarioController.listAll);
router.get('/:id_usuario', usuarioController.searchID);
router.patch('/:id_usuario', usuarioController.update);
router.patch('/:id_usuario/desativar', usuarioController.softDelete);
router.delete('/:id_usuario', usuarioController.delete);

export default router;
