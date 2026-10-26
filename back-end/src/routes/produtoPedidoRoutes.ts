import { Router } from "express";
import { ProdutoPedido, produtoPedidoController } from "../controllers/produtoPedidoController";

const router = Router();

router.post('/', produtoPedidoController.create);
router.get('/', produtoPedidoController.listAll);
router.get('/:id_produto_pedido', produtoPedidoController.searchID);
router.put('/:id_produto_peduto', produtoPedidoController.update);
router.delete('/:id_produto_pedido', produtoPedidoController.delete);

export default router;