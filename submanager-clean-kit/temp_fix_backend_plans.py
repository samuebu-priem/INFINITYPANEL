from pathlib import Path

path = Path("backend/src/modules/plans/plans.controller.ts")
path.write_text(
"""import { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";

/**
 * Plans are owned by the system (organization) and represent admin subscription tiers.
 * Provider-specific data is intentionally not exposed here.
 */
function normalizeQuantity(input: unknown): number | undefined {
  if (typeof input === "number" && Number.isFinite(input) && input >= 0) return Math.floor(input);
  if (typeof input === "string" && input.trim() !== "") {
    const value = Number(input);
    if (Number.isFinite(value) && value >= 0) return Math.floor(value);
  }
  return undefined;
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
    quantity: typeof plan?.quantity === "number" ? plan.quantity : 0,
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
    const { name, description, amount, billingCycle, currency, metadata,
