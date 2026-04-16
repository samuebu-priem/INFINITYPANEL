import type { Request, Response } from "express";

import { asyncHandler } from "../../../shared/utils/asyncHandler.js";
import { ApiError } from "../../../shared/utils/ApiError.js";
import { discordAuthService } from "./discord.service.js";

export const discordAuthController = {
  url: asyncHandler(async (_request: Request, response: Response) => {
    const result = discordAuthService.getAuthorizationUrl();
    response.status(200).json(result);
  }),

  callback: asyncHandler(async (request: Request, response: Response) => {
    const auth = request.auth;
    if (!auth) throw new ApiError(401, "Unauthorized");

    const code = String(request.query.code || "").trim();
    const result = await discordAuthService.callback(auth.id, code);
    response.status(200).json(result);
  }),
};