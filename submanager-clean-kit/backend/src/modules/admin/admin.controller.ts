import type { Request, Response } from "express";

import { requireRole } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { adminService } from "./admin.service.js";

export const adminController = {
  usersOverview: [
    requireRole("ADMIN", "OWNER"),
    asyncHandler(async (_request: Request, response: Response) => {
      const overview = await adminService.usersOverview();
      response.status(200).json(overview);
    }),
  ],
};