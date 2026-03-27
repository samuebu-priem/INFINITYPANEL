from pathlib import Path

path = Path("backend/src/modules/plans/plans.routes.ts")
path.write_text(
"""import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { plansController } from "./plans.controller.js";

export const plansRouter = Router();

plansRouter.get("/", requireAuth, requireRole("ADMIN", "OWNER", "PLAYER"), asyncHandler(plansController.list));
plansRouter.post("/", requireAuth, requireRole("ADMIN", "OWNER"), asyncHandler(plansController.create));
plansRouter.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  asyncHandler(plansController.updateStatus),
);
plansRouter.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  asyncHandler(plansController.update),
);
plansRouter.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  asyncHandler(plansController.remove),
);
""",
    encoding="utf-8",
)
