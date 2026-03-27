import type { Request, Response } from "express";

import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ApiError } from "../../shared/utils/ApiError.js";

type PaymentWithRelations = {
  id: string;
  amount: number;
  status: string;
  provider: string;
  externalId: string | null;
  createdAt: Date;
  user: { id: string; name: string; email: string };
  plan: { id: string; name: string };
};

type TransactionClient = {
  payment: {
    update: (args: {
      where: { id: string };
      data: {
        externalId?: string | null | undefined;
        status?: string | undefined;
      };
    }) => Promise<unknown>;
  };
};

type PrismaClientWithPayments = typeof prisma & {
  $transaction: (callback: (tx: TransactionClient) => Promise<unknown>) => Promise<unknown>;
};

export const listPayments = asyncHandler(async (_req: Request, res: Response) => {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      plan: { select: { id: true, name: true } },
    },
  });

  res.json({
    payments: (payments as PaymentWithRelations[]).map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      provider: p.provider,
      externalId: p.externalId,
      createdAt: p.createdAt,
      user: p.user,
      plan: p.plan,
    })),
  });
});

export const createPaymentTransaction = asyncHandler(async (req: Request, res: Response) => {
  const { userId, planId, amount, status, provider, externalId } = req.body ?? {};

  if (!userId || !planId || !Number.isFinite(Number(amount))) {
    throw new ApiError(400, "Dados inválidos.");
  }

  const payment = await prisma.payment.create({
    data: {
      userId,
      planId,
      amount: Number(amount),
      status: status ?? "PENDING",
      provider: provider ?? "manual",
      externalId: externalId ?? null,
    },
  });

  res.status(201).json({ payment });
});

export const registerPaymentTransaction = asyncHandler(async (req: Request, res: Response) => {
  const { paymentId, externalId, status } = req.body ?? {};

  if (!paymentId) {
    throw new ApiError(400, "Dados inválidos.");
  }

  const transactionClient = prisma as PrismaClientWithPayments;

  await transactionClient.$transaction(async (tx: TransactionClient) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        externalId: externalId ?? undefined,
        status: status ?? undefined,
      },
    });
  });

  res.status(204).send();
});
