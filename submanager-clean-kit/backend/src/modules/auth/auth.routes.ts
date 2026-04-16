import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { authController } from "./auth.controller.js";
import { discordAuthRouter } from "./discord/discord.routes.js";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.get("/me", requireAuth, authController.me);
authRouter.use("/discord", discordAuthRouter);