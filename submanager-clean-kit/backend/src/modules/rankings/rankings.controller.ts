import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { rankingsService } from "./rankings.service.js";

function normalizePeriod(value: unknown): "total" | "weekly" | "24h" {
  const period = String(value || "total").trim().toLowerCase();

  if (period === "24h") return "24h";
  if (period === "weekly") return "weekly";
  return "total";
}

export const rankingsController = {
  publicWins: asyncHandler(async (req: Request, res: Response) => {
    const period = normalizePeriod(req.query?.period);
    const result = await rankingsService.publicWins(period);
    res.json(result);
  }),

  mediators: asyncHandler(async (req: Request, res: Response) => {
    const period = normalizePeriod(req.query?.period);
    const result = await rankingsService.mediatorRanking(period);
    res.json(result);
  }),
};