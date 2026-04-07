import { Request, Response, NextFunction } from "express";

const getBearerToken = (value: unknown): string => {
  if (typeof value !== "string") return "";
  const match = value.match(/^Bearer\s+(.+)$/i);
  return (match?.[1] ?? "").trim();
};

export const requireInternalApiToken = (req: Request, res: Response, next: NextFunction) => {
  const expectedToken = process.env.INTERNAL_API_TOKEN?.trim();
  const providedToken = getBearerToken(req.headers.authorization);

  if (!expectedToken) {
    res.status(500).json({ message: "INTERNAL_API_TOKEN is not configured" });
    return;
  }

  if (!providedToken || providedToken !== expectedToken) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  next();
};
