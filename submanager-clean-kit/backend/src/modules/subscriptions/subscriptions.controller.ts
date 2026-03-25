import type { Request, Response } from "express";

import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { subscriptionsService } from "./subscriptions.service.js";

export const subscriptionsController = {
  me: asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth!;
    const result = await subscriptionsService.getMySubscription(auth.id);
    res.json(result);
  }),

  start: asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth!;
    const planId = String(req.body?.planId ?? "");

    if (!planId) {
      res.status(400).json({ message: "planId is required" });
      return;
    }

    const result = await subscriptionsService.startSubscription(auth.id, planId);
    res.status(201).json(result);
  }),
};
