import { Router } from "express";
import { createCheckout, listPayments, webhookMercadoPago } from "../controllers/paymentsController.js";

const router = Router();
router.get("/", listPayments);
router.post("/checkout", createCheckout);
router.post("/webhook/mercadopago", webhookMercadoPago);
export default router;
