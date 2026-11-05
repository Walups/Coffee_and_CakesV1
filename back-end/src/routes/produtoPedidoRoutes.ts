import { Router } from "express";
import {produtoPedidoController } from "../controllers/produtoPedidoController";

const router = Router();

router.post('/', produtoPedidoController.create);
router.get('/', produtoPedidoController.listAll);
router.get('/:id_produto_pedido', produtoPedidoController.searchID);
router.patch('/:id_produto_peduto', produtoPedidoController.update);
router.delete('/:id_produto_pedido', produtoPedidoController.delete);

export default router;