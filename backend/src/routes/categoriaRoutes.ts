import { Router } from "express";
import { categoriaController } from "../controllers/categoriaController";
import {authMiddleware} from "../middlewares/authMiddleware";
import {checkRole} from "../middlewares/checkRole"

const router = Router()

router.post('/', authMiddleware, checkRole(["admin"]), categoriaController.create);
router.get('/', categoriaController.listAll);
router.get('/:id_categoria', categoriaController.searchID);
router.patch('/:id_categoria', authMiddleware, checkRole(["admin"]), categoriaController.update);
router.patch('/:id_categoria/softdelete', authMiddleware, checkRole(["admin"]), categoriaController.softDelete);
router.delete('/:id_categoria', authMiddleware, checkRole(["admin"]), categoriaController.delete)

export default router;