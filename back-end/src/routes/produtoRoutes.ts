import { Router } from "express";
import {produtoController} from "../controllers/produtoController";

const router = Router();

router.post('/', produtoController.create);
router.get('/', produtoController.listAll);
router.get('/:id_produto', produtoController.searchID);
router.put('/:id_produto', produtoController.update);
router.put('/:id_produto', produtoController.softdelete);

export default router;