import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { adminController } from "./admin.controller.js";

export const adminRouter = Router();

adminRouter.use(requireAuth);

adminRouter.get("/users-overview", adminController.usersOverview);