import type { Request, Response } from "express";

import { requireRole } from "../../middlewares/role.middleware.js";
import { ApiError } from "../../shared/utils/ApiError.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { usersService } from "./users.service.js";

export const usersController = {
  me: asyncHandler(async (request: Request, response: Response) => {
    const auth = request.auth;
    if (!auth) throw new ApiError(401, "Unauthorized");

    const user = await usersService.me(auth.id);
    response.status(200).json({ user });
  }),

  listAll: [
    requireRole("OWNER"),
    asyncHandler(async (_request: Request, response: Response) => {
      const users = await usersService.listAll();
      response.status(200).json({ users });
    }),
  ],

  getById: [
    requireRole("OWNER"),
    asyncHandler(async (request: Request, response: Response) => {
      const id = request.params.id;
      if (typeof id !== "string") throw new ApiError(400, "Invalid user id");

      const user = await usersService.getById(id);
      response.status(200).json({ user });
    }),
  ],
};
