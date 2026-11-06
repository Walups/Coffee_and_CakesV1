import { Router } from "express";
import { categoriaXProdutoController } from "../controllers/CategoriaXProduto";
import { authMiddleware } from "../middlewares/authMiddleware";
import { checkRole } from "../middlewares/checkRole";

const router = Router();

router.post('/', authMiddleware, checkRole(["admin"]), categoriaXProdutoController.create);
router.patch('/produto/:id_produto', categoriaXProdutoController.listByProduto);
router.patch('/categoria/:id_categoria', categoriaXProdutoController.listByCategoria);
router.patch('/:id_produto/:id_categoria', categoriaXProdutoController.searchID);
router.delete('/:id_produto/:id_categoria', authMiddleware, checkRole(["admin"]), categoriaXProdutoController.delete);

export default router;



