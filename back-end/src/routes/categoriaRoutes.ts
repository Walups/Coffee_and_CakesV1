import { Router } from "express";
import { categoriaController } from "../controllers/categoriaController";


const router = Router()

router.post('/', categoriaController.create);
router.get('/', categoriaController.listAll);
router.get('/:id_categoria', categoriaController.searchID);
router.patch('/:id_categoria', categoriaController.update);
router.patch('/:id_categoria/softdelete', categoriaController.softDelete);
router.delete('/:id_categoria', categoriaController.delete)

export default router;