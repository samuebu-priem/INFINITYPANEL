import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { checkoutController } from "./checkout.controller.js";

export const checkoutRouter = Router();

/**
 * Start subscription checkout and query its status.
 *
 * Notes:
 * - This is used by the Plans page for regular users too (PLAYER).
 * - If you want an admin-only checkout flow, create a separate /admin/checkout route.
 */
checkoutRouter.post("/create", requireAuth, requireRole("PLAYER", "ADMIN", "OWNER"), checkoutController.create);
checkoutRouter.get("/:id", requireAuth, requireRole("PLAYER", "ADMIN", "OWNER"), checkoutController.getById);
