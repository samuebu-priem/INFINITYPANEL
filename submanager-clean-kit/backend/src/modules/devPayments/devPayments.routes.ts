import { Router } from "express";

import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { devPaymentsController } from "./devPayments.controller.js";

export const devPaymentsRouter = Router();

/**
 * Dev-only inspection endpoints.
 * Must remain protected and should never be exposed publicly.
 *
 * Mount path: /api/dev/payments
 */
devPaymentsRouter.use(requireAuth);
devPaymentsRouter.use(requireRole("OWNER"));

devPaymentsRouter.get("/plans", asyncHandler(devPaymentsController.listPlans));
devPaymentsRouter.get(
  "/checkouts",
  asyncHandler(devPaymentsController.listCheckoutSessions),
);
devPaymentsRouter.get(
  "/transactions",
  asyncHandler(devPaymentsController.listTransactions),
);
devPaymentsRouter.get(
  "/subscriptions",
  asyncHandler(devPaymentsController.listSubscriptions),
);
