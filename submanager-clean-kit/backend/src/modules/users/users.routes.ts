import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { usersController } from "./users.controller.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get("/me", usersController.me);
usersRouter.get("/", usersController.listAll);
usersRouter.get("/:id", usersController.getById);
