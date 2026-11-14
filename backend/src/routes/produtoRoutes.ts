import { Router } from "express";
import {produtoController} from "../controllers/produtoController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { checkRole } from "../middlewares/checkRole";

const router = Router();

router.post('/', authMiddleware, checkRole(["admin"]),produtoController.create);
router.get('/', produtoController.listAll);
router.get('/:id_produto', produtoController.searchID);
router.patch('/:id_produto', authMiddleware, checkRole(["admin"]), produtoController.update);
router.patch('/:id_produto/softdelete', authMiddleware, checkRole(["admin"]), produtoController.softdelete);
router.delete('/:id_produto', authMiddleware, checkRole(["admin"]), produtoController.delete);

export default router;