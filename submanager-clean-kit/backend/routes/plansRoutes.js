import { Router } from "express";

import { requireAuth } from "../src/middlewares/auth.middleware.js";
import { requireRole } from "../src/middlewares/role.middleware.js";
import { asyncHandler } from "../src/shared/utils/asyncHandler.js";
import { plansController } from "../src/modules/plans/plans.controller.js";

const router = Router();

router.get("/", requireAuth, requireRole("ADMIN", "OWNER", "PLAYER"), asyncHandler(plansController.list));
router.post("/", requireAuth, requireRole("ADMIN", "OWNER"), asyncHandler(plansController.create));
router.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  asyncHandler(plansController.update),
);
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  asyncHandler(plansController.updateStatus),
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  asyncHandler(plansController.remove),
);

export default router;