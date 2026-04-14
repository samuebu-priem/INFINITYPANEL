import { Router } from "express";
import { requireInternalApiToken } from "../../middlewares/internalApiToken.middleware.js";
import { internalMatchesController } from "./internal-matches.controller.js";

export const internalMatchesRouter = Router();

internalMatchesRouter.post(
  "/record",
  requireInternalApiToken,
  internalMatchesController.record,
);