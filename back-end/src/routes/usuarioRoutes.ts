import { Router } from "express";
import { usuarioController } from "../controllers/usuarioController";

const router = Router();

router.post('/', usuarioController.create);
router.get('/', usuarioController.listAll);
router.get('/:id_usuario', usuarioController.searchID);
router.put('/:id_usuario', usuarioController.update);
router.put('/:id_usuario', usuarioController.softDelete);

export default router;
