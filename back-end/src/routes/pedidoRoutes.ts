import { Router } from "express";
import {pedidoController} from "../controllers/pedidoController";

const router = Router();

router.post('/', pedidoController.create);
router.get('/', pedidoController.listAll);
router.get('/:id_pedido', pedidoController.searchID);
router.patch('/:id_pedido/update', pedidoController.update);
router.delete('/:id_pedido', pedidoController.delete);
router.patch('/id_pedido/softdelete', pedidoController.softDelete);

export default router;

