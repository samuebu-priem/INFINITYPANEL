import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { profileService } from "./profile.service.js";

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
};