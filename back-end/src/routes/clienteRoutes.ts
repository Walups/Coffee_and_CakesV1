import { Router } from "express";
import { clienteController } from "../controllers/clienteController";

const router = Router();

router.post('/', clienteController.create);
router.get('/', clienteController.listAll);
router.get('/:id_cliente', clienteController.searchID);
router.put('/:id_cliente', clienteController.update);
router.delete('/:id_cliente', clienteController.delete);

export default router;
