import { Router } from "express";

import { requireAuth } from "../../../middlewares/auth.middleware.js";
import { discordAuthController } from "./discord.controller.js";

export const discordAuthRouter = Router();

discordAuthRouter.get("/url", requireAuth, discordAuthController.url);
discordAuthRouter.get("/callback", requireAuth, discordAuthController.callback);