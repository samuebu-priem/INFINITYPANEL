import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { paymentsController } from "./payments.controller.js";

export const paymentsRouter = Router();

/**
 * Authenticated endpoints
 * Mount path: /api/payments
 */
paymentsRouter.get("/me", requireAuth, requireRole("ADMIN", "OWNER"), paymentsController.me);

/**
 * Webhooks (public)
 * Mount path: /api/payments/webhook/mercadopago
 *
 * NOTE:
 * - Mercado Pago needs a public URL, so during local dev use ngrok/cloudflared.
 * - We'll implement reconciliation logic in controller next.
 */
paymentsRouter.post("/webhook/mercadopago", paymentsController.webhookMercadoPago);
