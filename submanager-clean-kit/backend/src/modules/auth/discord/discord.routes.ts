import { Router } from "express";


import { discordAuthController } from "./discord.controller.js";

export const discordAuthRouter = Router();

discordAuthRouter.get("/callback", discordAuthController.callback);