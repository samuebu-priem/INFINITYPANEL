import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";

import { ApiError } from "../shared/utils/ApiError.js";

type ErrorResponseBody = {
  error: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
};

const sendError = (
  response: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) => {
  const body: ErrorResponseBody = {
    error: {
      message,
      code,
      ...(details ? { details } : {}),
    },
  };
  response.status(statusCode).json(body);
};

export const errorMiddleware = (
  err: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) => {
  if (err instanceof ApiError) {
    return sendError(
      response,
      err.statusCode,
      "API_ERROR",
      err.message,
      err.details,
    );
  }

  if (err instanceof ZodError) {
    return sendError(response, 400, "VALIDATION_ERROR", "Invalid request", {
      issues: err.issues,
    });
  }

  if (err instanceof jwt.TokenExpiredError){
    return sendError(response, 401, "TOKEN_EXPIRED", "Token expired");
  }

  if (err instanceof jwt.JsonWebTokenError) {
    return sendError(response, 401, "INVALID_TOKEN", "Invalid token");
  }

  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);

  return sendError(
    response,
    500,
    "INTERNAL_SERVER_ERROR",
    "Internal server error",
  );
};
