import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { requireInternalApiToken } from "../../middlewares/internalApiToken.middleware.js";
import { internalMatchesController } from "./internal-matches.controller.js";

export const internalMatchesRouter = Router();

internalMatchesRouter.get(
  "/records",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  internalMatchesController.list,
);

internalMatchesRouter.post(
  "/record",
  requireInternalApiToken,
  internalMatchesController.record,
);