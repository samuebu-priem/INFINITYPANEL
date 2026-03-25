import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../shared/utils/ApiError.js";

export const notFoundMiddleware = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  next(
    new ApiError(404, `Route not found: ${request.method} ${request.originalUrl}`),
  );
};
