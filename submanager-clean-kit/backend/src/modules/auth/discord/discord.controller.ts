import type { Request, Response } from "express";
import { discordAuthService } from "./discord.service.js";

export const discordAuthController = {
  getUrl(req: Request, res: Response) {
    const result = discordAuthService.getAuthorizationUrl(req.auth!.id);
    return res.json(result);
  },

  async callback(req: Request, res: Response) {
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");

    try {
      const result = await discordAuthService.callback(state, code);
      return res.redirect(result.redirectTo);
    } catch (error) {
      console.error("Discord callback error:", error);
      return res.redirect(discordAuthService.getCallbackErrorRedirect());
    }
  },
};