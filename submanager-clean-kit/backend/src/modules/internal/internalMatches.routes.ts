import { Router } from "express";

import { requireInternalApiToken } from "../../middlewares/internalApiToken.middleware.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { internalMatchesController } from "./internalMatches.controller.js";

export const internalMatchesRouter = Router();

internalMatchesRouter.use(requireInternalApiToken);

internalMatchesRouter.get("/by-thread-name", asyncHandler(internalMatchesController.getByThreadName));
