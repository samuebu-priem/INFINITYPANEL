import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { listPayments, registerPaymentTransaction } from "./payments.controller.js";

export const paymentsRouter = Router();

paymentsRouter.get("/me", requireAuth, requireRole("ADMIN", "OWNER"), listPayments);
paymentsRouter.post("/webhook/mercadopago", registerPaymentTransaction);
