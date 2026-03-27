import { prisma } from "../config/prisma.js";

const toNumber = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  return NaN;
};

const normalizePlan = (plan) => ({
  id: plan.id,
  name: plan.name,
  description: plan.description,
  amount: typeof plan.amount === "number" ? plan.amount : Number(plan.amount),
  currency: plan.currency,
  billingCycle: plan.billingCycle,
  isActive: plan.isActive ?? true,
  metadata: plan.metadata ?? null,
  createdAt: plan.createdAt,
  updatedAt: plan.updatedAt,
});

export async function listPlans(_req, res) {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: [{ amount: "asc" }, { createdAt: "asc" }],
  });

  res.json({ plans: plans.map(normalizePlan) });
}

export async function createPlan(req, res) {
  const { name, description, amount, billingCycle, currency, metadata } = req.body;

  if (typeof name !== "string" || name.trim().length < 2) {
    res.status(400).json({ message: "`name` is required" });
    return;
  }

  const numericAmount = toNumber(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    res.status(400).json({ message: "`amount` must be a valid number" });
    return;
  }

  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: name.trim(),
      description: typeof description === "string" ? description : description ?? null,
      amount: numericAmount,
      billingCycle: typeof billingCycle === "string" ? billingCycle : "MONTHLY",
      currency: typeof currency === "string" && currency.trim() ? currency.trim() : "BRL",
      isActive: true,
      ...(typeof metadata !== "undefined" ? { metadata } : {}),
    },
  });

  res.status(201).json({ plan: normalizePlan(plan) });
}

export async function updatePlan(req, res) {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "Missing plan id" });
    return;
  }

  const { name, description, amount, billingCycle, currency, metadata, isActive } = req.body;
  const data = {};

  if (typeof name === "string") data.name = name.trim();
  if (typeof description === "string" || description === null) data.description = description;
  if (typeof amount !== "undefined") {
    const numericAmount = toNumber(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      res.status(400).json({ message: "`amount` must be a valid number" });
      return;
    }
    data.amount = numericAmount;
  }
  if (typeof billingCycle === "string") data.billingCycle = billingCycle;
  if (typeof currency === "string") data.currency = currency.trim() || "BRL";
  if (typeof metadata !== "undefined") data.metadata = metadata;
  if (typeof isActive === "boolean") data.isActive = isActive;

  if (Object.keys(data).length === 0) {
    res.status(400).json({ message: "No valid fields to update" });
    return;
  }

  const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Plan not found" });
    return;
  }

  const plan = await prisma.subscriptionPlan.update({
    where: { id },
    data,
  });

  res.json({ plan: normalizePlan(plan) });
}

export async function updatePlanStatus(req, res) {
  const { id } = req.params;
  const { isActive } = req.body;

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
  });

  res.json({ plan: normalizePlan(plan) });
}

export async function deletePlan(req, res) {
  const { id } = req.params;

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

  await prisma.subscriptionPlan.delete({ where: { id } });
  res.status(200).json({ deleted: true });
}