import { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";

/**
 * Plans are owned by the system (organization) and represent admin subscription tiers.
 * Provider-specific data is intentionally not exposed here.
 */
function normalizeQuantity(input: unknown): number {
  if (typeof input === "number" && Number.isFinite(input) && input >= 0) return Math.floor(input);
  if (typeof input === "string" && input.trim() !== "") {
    const value = Number(input);
    if (Number.isFinite(value) && value >= 0) return Math.floor(value);
  }
  return 0;
}

function buildPlanSelect() {
  return {
    id: true,
    name: true,
    description: true,
    amount: true,
    currency: true,
    billingCycle: true,
    isActive: true,
    quantity: true,
    metadata: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}

function normalizePlan(plan: any) {
  return {
    ...plan,
    quantity: normalizeQuantity(plan?.quantity),
  };
}

export const plansController = {
  list: async (_req: Request, res: Response) => {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: [{ amount: "asc" }, { createdAt: "asc" }],
      select: buildPlanSelect(),
    });

    res.json({ plans: plans.map(normalizePlan) });
  },

  create: async (req: Request, res: Response) => {
    const { name, description, amount, billingCycle, currency, metadata, quantity } = req.body as {
      name?: string;
      description?: string | null;
      amount?: number;
      billingCycle?: string;
      currency?: string;
      metadata?: unknown;
      quantity?: unknown;
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
    const qty = normalizeQuantity(quantity);

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: name.trim(),
        description: typeof description === "string" ? description : description ?? null,
        amount,
        billingCycle: cycle as any,
        currency: curr,
        isActive: true,
        quantity: qty,
        ...(typeof metadata !== "undefined" ? { metadata: metadata as any } : {}),
      },
      select: buildPlanSelect(),
    });

    res.status(201).json({ plan: normalizePlan(plan) });
  },

  update: async (req: Request, res: Response) => {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    if (!id) {
      res.status(400).json({ message: "Missing plan id" });
      return;
    }

    const { name, description, amount, billingCycle, currency, metadata, quantity } = req.body as {
      name?: string;
      description?: string | null;
      amount?: number;
      billingCycle?: string;
      currency?: string;
      metadata?: unknown;
      quantity?: unknown;
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
    if (typeof billingCycle === "string") data.billingCycle = billingCycle;
    if (typeof currency === "string") data.currency = currency;
    if (typeof metadata !== "undefined") data.metadata = metadata;
    const qty = normalizeQuantity(quantity);
    if (typeof quantity !== "undefined") data.quantity = qty;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ message: "No valid fields to update" });
      return;
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data,
      select: buildPlanSelect(),
    });

    res.json({ plan: normalizePlan(plan) });
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
      select: buildPlanSelect(),
    });

    res.json({ plan: normalizePlan(plan) });
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
