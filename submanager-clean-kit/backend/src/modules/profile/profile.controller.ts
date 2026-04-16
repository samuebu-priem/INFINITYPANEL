import type { Request, Response } from "express";

import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { profileService } from "./profile.service.js";
import { discordAuthService } from "../auth/discord/discord.service.js";

export const profileController = {
  summary: asyncHandler(async (req: Request, res: Response) => {
    const result = await profileService.summary(req.auth!.id);
    res.json(result);
  }),

  updateDiscordId: asyncHandler(async (req: Request, res: Response) => {
    const result = await profileService.updateDiscordId(
      req.auth!.id,
      req.body?.discordId,
    );

    res.json(result);
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const result = await profileService.updateProfileFields(req.auth!.id, {
      avatarUrl: req.body?.avatarUrl,
      status: req.body?.status,
    });

    res.json(result);
  }),

  refreshDiscord: asyncHandler(async (req: Request, res: Response) => {
    const result = await discordAuthService.refresh(req.auth!.id);
    res.json(result);
  }),

  disconnectDiscord: asyncHandler(async (req: Request, res: Response) => {
    const result = await discordAuthService.disconnect(req.auth!.id);
    res.json(result);
  }),
};