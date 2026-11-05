import { Router } from "express";
import {produtoController} from "../controllers/produtoController";

const router = Router();

router.post('/', produtoController.create);
router.get('/', produtoController.listAll);
router.get('/:id_produto', produtoController.searchID);
router.patch('/:id_produto', produtoController.update);
router.patch('/:id_produto/softdelete', produtoController.softdelete);
router.delete('/:id_produto', produtoController.delete);

export default router;