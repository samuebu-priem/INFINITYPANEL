import { Request, Response } from "express";

import { prisma } from "../../config/prisma.js";

/**
 * Plans are owned by the system (organization) and represent admin subscription tiers.
 * Provider-specific data is intentionally not exposed here.
 */
export const plansController = {
  list: async (_req: Request, res: Response) => {
    // Admin/Owner management view: return both active and inactive plans.
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: [{ amount: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        amount: true,
        stock: true,
        currency: true,
        billingCycle: true,
        isActive: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ plans });
  },

  create: async (req: Request, res: Response) => {
    const { name, description, amount, stock, billingCycle, currency, metadata } = req.body as {
      name?: string;
      description?: string | null;
      amount?: number;
      stock?: number;
      billingCycle?: string;
      currency?: string;
      metadata?: unknown;
    };

    if (typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({ message: "`name` is required" });
      return;
    }

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
      res.status(400).json({ message: "`amount` must be a valid number" });
      return;
    }

    const cycle = typeof billingCycle === "string" ? billingCycle : "MONTHLY";
    const curr = typeof currency === "string" && currency.trim() ? currency.trim() : "BRL";

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: name.trim(),
        description: typeof description === "string" ? description : description ?? null,
        amount,
        stock: typeof stock === "number" && Number.isFinite(stock) && stock >= 0 ? Math.floor(stock) : 0,
        billingCycle: cycle as any,
        currency: curr,
        isActive: true,
        ...(typeof metadata !== "undefined" ? { metadata: metadata as any } : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        amount: true,
        stock: true,
        currency: true,
        billingCycle: true,
        isActive: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({ plan });
  },

  update: async (req: Request, res: Response) => {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    if (!id) {
      res.status(400).json({ message: "Missing plan id" });
      return;
    }

    const { name, description, amount, stock, billingCycle, currency, metadata } = req.body as {
      name?: string;
      description?: string | null;
      amount?: number;
      stock?: number;
      billingCycle?: string;
      currency?: string;
      metadata?: unknown;
    };

    const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Plan not found" });
      return;
    }

    const data: Record<string, unknown> = {};
    if (typeof name === "string") data.name = name.trim();
    if (typeof description === "string" || description === null) data.description = description;
    if (typeof amount === "number" && Number.isFinite(amount) && amount >= 0) data.amount = amount;
    if (typeof stock === "number" && Number.isFinite(stock) && stock >= 0) data.stock = Math.floor(stock);
    if (typeof billingCycle === "string") data.billingCycle = billingCycle;
    if (typeof currency === "string") data.currency = currency;
    if (typeof metadata !== "undefined") data.metadata = metadata;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ message: "No valid fields to update" });
      return;
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        amount: true,
        stock: true,
        currency: true,
        billingCycle: true,
        isActive: true,
        metadata: true,
        updatedAt: true,
      },
    });

    res.json({ plan });
  },

  updateStatus: async (req: Request, res: Response) => {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const { isActive } = req.body as { isActive?: boolean };

    if (!id) {
      res.status(400).json({ message: "Missing plan id" });
      return;
    }

    if (typeof isActive !== "boolean") {
      res.status(400).json({ message: "`isActive` must be a boolean" });
      return;
    }

    const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Plan not found" });
      return;
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        description: true,
        amount: true,
        currency: true,
        billingCycle: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({ plan });
  },

  remove: async (req: Request, res: Response) => {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    if (!id) {
      res.status(400).json({ message: "Missing plan id" });
      return;
    }

    const existing = await prisma.subscriptionPlan.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ message: "Plan not found" });
      return;
    }

    const linkedSubscriptions = await prisma.subscription.count({ where: { planId: id } });

    // Safe behavior: if already linked to any subscription, do a soft-delete by deactivating.
    if (linkedSubscriptions > 0) {
      await prisma.subscriptionPlan.update({ where: { id }, data: { isActive: false } });
      res.status(200).json({
        deleted: false,
        deactivated: true,
        message: "Plan is linked to subscriptions and cannot be deleted. It was deactivated instead.",
      });
      return;
    }

    await prisma.subscriptionPlan.delete({ where: { id } });
    res.status(200).json({ deleted: true });
  },
};
