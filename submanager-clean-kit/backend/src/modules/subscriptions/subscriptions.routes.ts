import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { subscriptionsController } from "./subscriptions.controller.js";

export const subscriptionsRouter = Router();

subscriptionsRouter.get("/me", requireAuth, subscriptionsController.me);
subscriptionsRouter.post("/start", requireAuth, requireRole("ADMIN", "OWNER"), subscriptionsController.start);
