import { Router } from "express";
import {pedidoController} from "../controllers/pedidoController";
import {authMiddleware} from "../middlewares/authMiddleware";
import {checkRole} from "../middlewares/checkRole";

const router = Router();

router.post("/pedidos", authMiddleware, pedidoController.create);
router.get("/pedidos/meus", authMiddleware, pedidoController.listMe);
router.patch("/pedidos/:id_pedido/cancelar", authMiddleware, pedidoController.softDelete);
router.get("/pedidos", authMiddleware, checkRole(["admin"]), pedidoController.listAll);
router.get("/pedidos/:id_pedido", authMiddleware, checkRole(["admin"]), pedidoController.searchID);
router.patch("/pedidos/:id_pedido", authMiddleware, checkRole(["admin"]), pedidoController.update);
router.delete("/pedidos/:id_pedido", authMiddleware, checkRole(["admin"]), pedidoController.delete);

export default router;

