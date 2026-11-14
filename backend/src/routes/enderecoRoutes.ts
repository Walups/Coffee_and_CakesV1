import { Router } from "express";
import { enderecoController } from "../controllers/enderecoController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { checkRole } from "../middlewares/checkRole";


const router = Router()

router.post('/', authMiddleware,  enderecoController.create);
router.get('/me', authMiddleware, enderecoController.listMine);
router.patch('/:id_endereco', authMiddleware,  enderecoController.update);
router.delete('/:id_endereco', authMiddleware, enderecoController.delete);

export default router;