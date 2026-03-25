import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import type { AuthUser, JwtPayload } from "../shared/types/auth.js";
import { ApiError } from "../shared/utils/ApiError.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

const isJwtPayload = (value: unknown): value is JwtPayload => {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.sub === "string" && typeof v.role === "string";
};

export const requireAuth = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Missing authorization token"));
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) return next(new ApiError(401, "Missing authorization token"));

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!isJwtPayload(decoded)) return next(new ApiError(401, "Invalid token"));

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, role: true },
    });

    if (!user) return next(new ApiError(401, "User not found"));

    request.auth = { id: user.id, role: user.role };
    return next();
  } catch (err) {
    return next(err);
  }
};
