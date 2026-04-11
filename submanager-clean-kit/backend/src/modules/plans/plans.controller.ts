import { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";

function normalizeQuantity(input: unknown): number {
  if (typeof input === "number" && Number.isFinite(input) && input >= 0) {
    return Math.floor(input);
  }

  if (typeof input === "string" && input.trim() !== "") {
    const value = Number(input);
    if (Number.isFinite(value) && value >= 0) {
      return Math.floor(value);
    }
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

function normalizeMetadata(input: unknown, quantity: number) {
  const metadata =
    input && typeof input === "object" && !Array.isArray(input)
      ? { ...(input as Record<string, unknown>) }
      : {};

  const validityCandidates = [
    Number(metadata.validityDays),
    Number(metadata.days),
    Number(metadata.durationDays),
  ];

  const validity = validityCandidates.find(
    (value) => Number.isFinite(value) && value > 0,
  );

  if (validity) {
    metadata.validityDays = Math.floor(validity);
    metadata.days = Math.floor(validity);
    metadata.durationDays = Math.floor(validity);
  } else {
    delete metadata.validityDays;
    delete metadata.days;
    delete metadata.durationDays;
  }

  metadata.stock = quantity;

  const originalAmount = Number(metadata.originalAmount);
  if (!(Number.isFinite(originalAmount) && originalAmount > 0)) {
    delete metadata.originalAmount;
  }

  return metadata;
}

function normalizePlan(plan: any) {
  const metadata =
    plan?.metadata && typeof plan.metadata === "object" && !Array.isArray(plan.metadata)
      ? plan.metadata
      : {};

  return {
    ...plan,
    quantity: normalizeQuantity(plan?.quantity),
    metadata,
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
    const {
      name,
      description,
      amount,
      billingCycle,
      currency,
      metadata,
      quantity,
    } = req.body as {
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
    const curr =
      typeof currency === "string" && currency.trim() ? currency.trim() : "BRL";
    const qty = normalizeQuantity(quantity);
    const normalizedMetadata = normalizeMetadata(metadata, qty);

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: name.trim(),
        description:
          typeof description === "string" ? description : description ?? null,
        amount,
        billingCycle: cycle as any,
        currency: curr,
        isActive: true,
        quantity: qty,
        metadata: normalizedMetadata as any,
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

    const {
      name,
      description,
      amount,
      billingCycle,
      currency,
      metadata,
      quantity,
    } = req.body as {
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
    if (typeof description === "string" || description === null) {
      data.description = description;
    }
    if (typeof amount === "number" && Number.isFinite(amount) && amount >= 0) {
      data.amount = amount;
    }
    if (typeof billingCycle === "string") data.billingCycle = billingCycle;
    if (typeof currency === "string") data.currency = currency;

    const nextQuantity =
      typeof quantity !== "undefined"
        ? normalizeQuantity(quantity)
        : normalizeQuantity(existing.quantity);

    if (typeof quantity !== "undefined") {
      data.quantity = nextQuantity;
    }

    if (typeof metadata !== "undefined") {
      data.metadata = normalizeMetadata(metadata, nextQuantity) as any;
    } else if (typeof quantity !== "undefined") {
      data.metadata = normalizeMetadata(existing.metadata, nextQuantity) as any;
    }

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

    const linkedSubscriptions = await prisma.subscription.count({
      where: { planId: id },
    });

    if (linkedSubscriptions > 0) {
      await prisma.subscriptionPlan.update({
        where: { id },
        data: { isActive: false },
      });

      res.status(200).json({
        deleted: false,
        deactivated: true,
        message:
          "Plan is linked to subscriptions and cannot be deleted. It was deactivated instead.",
      });
      return;
    }

    await prisma.subscriptionPlan.delete({ where: { id } });
    res.status(200).json({ deleted: true });
  },
};