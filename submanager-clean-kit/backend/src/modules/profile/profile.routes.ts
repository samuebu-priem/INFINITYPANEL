import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { profileController } from "./profile.controller.js";

export const profileRouter = Router();

profileRouter.get("/summary", requireAuth, profileController.summary);
profileRouter.patch("/discord", requireAuth, profileController.updateDiscordId);
profileRouter.post("/discord/refresh", requireAuth, profileController.refreshDiscord);
profileRouter.delete("/discord", requireAuth, profileController.disconnectDiscord);
profileRouter.patch("/", requireAuth, profileController.updateProfile);