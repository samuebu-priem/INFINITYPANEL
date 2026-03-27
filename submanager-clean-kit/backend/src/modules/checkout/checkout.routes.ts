import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { checkoutController } from "./checkout.controller.js";

const checkoutRouter = Router();

checkoutRouter.post("/create", requireAuth, requireRole("ADMIN", "OWNER"), checkoutController.create);
checkoutRouter.get("/:id", requireAuth, requireRole("ADMIN", "OWNER"), checkoutController.getById);

export { checkoutRouter };
