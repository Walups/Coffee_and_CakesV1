import { Router } from "express";
import { enderecoController } from "../controllers/enderecoController";
import { authMiddleware } from "../middlewares/authMiddleware";



const router = Router()

router.post('/', (req, res, next) => {
    if (req.headers.authorization) {
        return authMiddleware(req, res, next);
    }
    return next();
}, enderecoController.create);
router.get('/me', authMiddleware, enderecoController.listMine);
router.patch('/:id_endereco', authMiddleware,  enderecoController.update);
router.delete('/:id_endereco', authMiddleware, enderecoController.delete);

export default router;