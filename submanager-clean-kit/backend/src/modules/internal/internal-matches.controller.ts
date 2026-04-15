import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { internalMatchesService } from "./internal-matches.service.js";

export const internalMatchesController = {
  record: asyncHandler(async (req: Request, res: Response) => {
    const result = await internalMatchesService.record({
      players: req.body?.players,
      threadName: req.body?.threadName,
      game: req.body?.game,
      mode: req.body?.mode,
      winner: req.body?.winner,
      mediatorId: req.body?.mediatorId,
      mediatorName: req.body?.mediatorName,
      mediatorRevenue: req.body?.mediatorRevenue,
    });

    res.status(result.created ? 201 : 200).json(result);
  }),

  list: asyncHandler(async (_req: Request, res: Response) => {
    const result = await internalMatchesService.list();
    res.json(result);
  }),
};