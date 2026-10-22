import { Router } from "express";
import {pedidoController} from "../controllers/pedidoController";

const router = Router();

router.post('/', pedidoController.create);
router.get('/', pedidoController.listAll);
router.get('/:id_pedido', pedidoController.searchID);
router.put('/:id_pedido', pedidoController.update);
router.delete('/:id_pedido', pedidoController.delete);

export default router;

