import type { NextFunction, Request, Response } from "express";

import type { Role } from "../shared/types/auth.js";
import { ApiError } from "../shared/utils/ApiError.js";

export const requireRole =
  (...roles: Role[]) =>
  (request: Request, _response: Response, next: NextFunction) => {
    const auth = request.auth;

    if (!auth) return next(new ApiError(401, "Unauthorized"));
    if (!roles.includes(auth.role)) return next(new ApiError(403, "Forbidden"));

    return next();
  };
