import type { Request, Response } from "express";

import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ApiError } from "../../shared/utils/ApiError.js";

type PlanLike = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  status: string;
  ownerId: string | null;
  stock?: number | null;
  quantity?: number | null;
  availableSlots?: number | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapPlan(plan: PlanLike) {
  const availableSlots = Number(plan.stock ?? plan.quantity ?? plan.availableSlots ?? 0);

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: plan.price,
    durationDays: plan.durationDays,
    status: plan.status,
    isActive: plan.status === "ACTIVE",
    stock: availableSlots,
    quantity: availableSlots,
    availableSlots,
    ownerId: plan.ownerId,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

export const listPlans = asyncHandler(async (_req: Request, res: Response) => {
  const plans = await prisma.plan.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json({ plans: plans.map(mapPlan) });
});

export const getPlanById = asyncHandler(async (req: Request, res: Response) => {
  const plan = await prisma.plan.findUnique({
    where: { id: req.params.id },
  });

  if (!plan) {
    throw new ApiError(404, "Plano não encontrado.");
  }

  res.json({ plan: mapPlan(plan) });
});

export const createPlan = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    description = null,
    price,
    durationDays,
    stock,
    quantity,
    availableSlots,
    status = "ACTIVE",
  } = req.body ?? {};

  const parsedStock = Number(stock ?? quantity ?? availableSlots ?? 0);

  if (!name || !Number.isFinite(Number(price)) || !Number.isInteger(Number(durationDays))) {
    throw new ApiError(400, "Dados inválidos.");
  }

  const plan = await prisma.plan.create({
    data: {
      name,
      description,
      price: Number(price),
      durationDays: Number(durationDays),
      status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      stock: parsedStock,
      quantity: parsedStock,
      availableSlots: parsedStock,
    },
  });

  res.status(201).json({ plan: mapPlan(plan) });
});

export const updatePlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await prisma.plan.findUnique({
    where: { id: req.params.id },
  });

  if (!plan) {
    throw new ApiError(404, "Plano não encontrado.");
  }

  const {
    name,
    description,
    price,
    durationDays,
    stock,
    quantity,
    availableSlots,
    status,
  } = req.body ?? {};

  const parsedStock = stock ?? quantity ?? availableSlots;

  const updated = await prisma.plan.update({
    where: { id: plan.id },
    data: {
      name: name ?? plan.name,
      description: description ?? plan.description,
      price: price !== undefined ? Number(price) : plan.price,
      durationDays: durationDays !== undefined ? Number(durationDays) : plan.durationDays,
      status: status === "INACTIVE" ? "INACTIVE" : status === "ACTIVE" ? "ACTIVE" : plan.status,
      ...(parsedStock !== undefined
        ? {
            stock: Number(parsedStock),
            quantity: Number(parsedStock),
            availableSlots: Number(parsedStock),
          }
        : {}),
    },
  });

  res.json({ plan: mapPlan(updated) });
});

export const deletePlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await prisma.plan.findUnique({
    where: { id: req.params.id },
  });

  if (!plan) {
    throw new ApiError(404, "Plano não encontrado.");
  }

  await prisma.plan.delete({
    where: { id: plan.id },
  });

  res.status(204).send();
});
