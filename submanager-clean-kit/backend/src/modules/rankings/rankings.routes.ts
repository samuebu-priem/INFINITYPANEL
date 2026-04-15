import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { rankingsController } from "./rankings.controller.js";

export const rankingsRouter = Router();

rankingsRouter.get("/public", requireAuth, rankingsController.publicWins);

rankingsRouter.get(
  "/mediators",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  rankingsController.mediators,
);