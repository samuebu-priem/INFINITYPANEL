import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { profileController } from "./profile.controller.js";

export const profileRouter = Router();

profileRouter.get("/summary", requireAuth, profileController.summary);