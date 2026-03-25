import { Request, Response } from "express";

import { devPaymentsService } from "./devPayments.service.js";

export const devPaymentsController = {
  listPlans: async (_req: Request, res: Response) => {
    const plans = await devPaymentsService.listPlans();
    res.json({ plans });
  },

  listCheckoutSessions: async (_req: Request, res: Response) => {
    const checkouts = await devPaymentsService.listCheckoutSessions();
    res.json({ checkouts });
  },

  listTransactions: async (_req: Request, res: Response) => {
    const transactions = await devPaymentsService.listTransactions();
    res.json({ transactions });
  },

  listSubscriptions: async (_req: Request, res: Response) => {
    const subscriptions = await devPaymentsService.listSubscriptions();
    res.json({ subscriptions });
  },
};
