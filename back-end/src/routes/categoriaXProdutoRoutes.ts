import { Router } from "express";
import { categoriaXProdutoController } from "../controllers/CategoriaXProduto";

const router = Router();

router.post('/', categoriaXProdutoController.create);
router.patch('/produto/:id_produto', categoriaXProdutoController.listByProduto);
router.patch('/categoria/:id_categoria', categoriaXProdutoController.listByCategoria);
router.patch('/:id_produto/:id_categoria', categoriaXProdutoController.searchID);
router.delete('/:id_produto/:id_categoria', categoriaXProdutoController.delete);

export default router;



