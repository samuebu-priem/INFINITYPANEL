import type { Request, Response } from "express";

import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ApiError } from "../../shared/utils/ApiError.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { authService } from "./auth.service.js";

export const authController = {
  register: asyncHandler(async (request: Request, response: Response) => {
    const input = registerSchema.parse({
      ...request.body,
      role: "PLAYER",
    });
    const result = await authService.register(input);
    response.status(201).json(result);
  }),

  login: asyncHandler(async (request: Request, response: Response) => {
    const input = loginSchema.parse(request.body);
    const result = await authService.login(input);
    response.status(200).json(result);
  }),

  me: asyncHandler(async (request: Request, response: Response) => {
    const auth = request.auth;
    if (!auth) throw new ApiError(401, "Unauthorized");

    const user = await authService.me(auth.id);
    response.status(200).json({ user });
  }),
};
