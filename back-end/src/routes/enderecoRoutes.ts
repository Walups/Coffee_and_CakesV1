import { Router } from "express";
import { enderecoController } from "../controllers/enderecoController";


const router = Router()

router.post('/', enderecoController.create);
router.get('/', enderecoController.listAll);
router.get('/:id_endereco', enderecoController.searchID);
router.put('/:id_endereco', enderecoController.update);
router.delete('/:id_endereco', enderecoController.delete);

export default router;