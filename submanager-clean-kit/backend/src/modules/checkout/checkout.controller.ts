import type { Request, Response } from "express";

import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../shared/utils/ApiError.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { checkoutService } from "./checkout.service.js";

export const checkoutController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth!;
    const planId = String(req.body?.planId ?? "");

    if (!planId) {
      res.status(400).json({ message: "planId is required" });
      return;
    }

    let adminProfile = await prisma.adminProfile.findUnique({
      where: { userId: auth.id },
      select: { id: true },
    });

    if (!adminProfile) {
      // If the user has ADMIN/OWNER role but does not have an AdminProfile yet,
      // create one automatically to allow subscription checkout.
      // (AdminProfile.weeklyFee is required, so we default to 0.00)
      adminProfile = await prisma.adminProfile.create({
        data: {
          userId: auth.id,
          isActive: false,
          weeklyFee: 0,
        },
        select: { id: true },
      });
    }

    const result = await checkoutService.createAdminSubscriptionCheckout({
      adminProfileId: adminProfile.id,
      planId,
    });

    res.status(201).json(result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth!;
    const id = String(req.params.id);

    let adminProfile = await prisma.adminProfile.findUnique({
      where: { userId: auth.id },
      select: { id: true },
    });

    if (!adminProfile) {
      adminProfile = await prisma.adminProfile.create({
        data: {
          userId: auth.id,
          isActive: false,
          weeklyFee: 0,
        },
        select: { id: true },
      });
    }

    const result = await checkoutService.getCheckoutByIdForAdmin(adminProfile.id, id);
    res.json(result);
  }),
};
