import type { Request, Response } from "express";

import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../shared/utils/ApiError.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { getPaymentProvider } from "./providers/providerFactory.js";

type MercadoPagoPaymentInfo = {
  id?: number | string;
  status?: string;
  external_reference?: string;
  payment_method_id?: string;
  transaction_amount?: number;
  currency_id?: string;
};

function mpStatusToTxStatus(status?: string) {
  if (status === "approved") return "APPROVED" as const;
  if (status === "rejected") return "REJECTED" as const;
  if (status === "cancelled") return "CANCELLED" as const;
  if (status === "expired") return "EXPIRED" as const;
  return "PENDING" as const;
}

function txStatusToCheckoutStatus(
  status: ReturnType<typeof mpStatusToTxStatus>,
) {
  if (status === "APPROVED") return "COMPLETED" as const;
  if (status === "CANCELLED") return "CANCELLED" as const;
  if (status === "EXPIRED") return "EXPIRED" as const;
  if (status === "REJECTED") return "CANCELLED" as const;
  return "OPEN" as const;
}

function resolvePlanDurationDays(plan: {
  billingCycle: "WEEKLY" | "MONTHLY" | "YEARLY";
  metadata?: unknown;
  days?: number | null;
  durationDays?: number | null;
}) {
  const metadata =
    plan?.metadata && typeof plan.metadata === "object"
      ? (plan.metadata as Record<string, unknown>)
      : {};

  const candidates = [
    Number(metadata.validityDays),
    Number(metadata.days),
    Number(metadata.durationDays),
    Number(plan?.days),
    Number(plan?.durationDays),
  ];

  const customDays = candidates.find(
    (value) => Number.isFinite(value) && value > 0,
  );

  if (customDays) {
    return Math.floor(customDays);
  }

  if (plan.billingCycle === "WEEKLY") return 7;
  if (plan.billingCycle === "MONTHLY") return 30;
  return 365;
}

function computeEndsAt(
  plan: {
    billingCycle: "WEEKLY" | "MONTHLY" | "YEARLY";
    metadata?: unknown;
    days?: number | null;
    durationDays?: number | null;
  },
  baseDate: Date,
) {
  const durationDays = resolvePlanDurationDays(plan);
  const endsAt = new Date(baseDate);
  endsAt.setDate(baseDate.getDate() + durationDays);
  return endsAt;
}

export const paymentsController = {
  me: asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth!;

    if (!["ADMIN", "OWNER"].includes(auth.role)) {
      throw new ApiError(403, "Forbidden");
    }

    const payments = await prisma.paymentTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    res.json({
      payments: payments.map((p: (typeof payments)[number]) => ({
        id: p.id,
        provider: p.provider,
        status: p.status,
        amount: p.amount.toString(),
        currency: p.currency,
        paymentMethod: p.paymentMethod,
        externalPaymentId: p.externalPaymentId,
        externalCheckoutId: p.externalCheckoutId,
        approvedAt: p.approvedAt,
        createdAt: p.createdAt,
        userId: p.userId,
        adminId: p.adminId,
      })),
    });
  }),

  webhookMercadoPago: asyncHandler(async (req: Request, res: Response) => {
    const provider = getPaymentProvider();
    const parsed = await provider.parseWebhook(
      req.headers as Record<string, string | string[] | undefined>,
      req.body,
    );

    const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new ApiError(500, "Mercado Pago access token not configured");
    }

    if (!parsed.externalPaymentId) {
      res.status(200).json({ ok: true, ignored: "missing_payment_id" });
      return;
    }

    const mp = (await import("mercadopago")) as unknown as {
      MercadoPagoConfig: new (opts: { accessToken: string }) => unknown;
      Payment: new (client: unknown) => {
        get: (args: { id: string }) => Promise<MercadoPagoPaymentInfo>;
      };
    };

    const client = new mp.MercadoPagoConfig({ accessToken });
    const payment = new mp.Payment(client);

    const paymentInfo = await payment.get({
      id: String(parsed.externalPaymentId),
    });

    const txStatus = mpStatusToTxStatus(paymentInfo?.status);
    const checkoutSessionId = paymentInfo?.external_reference
      ? String(paymentInfo.external_reference)
      : null;

    if (!checkoutSessionId) {
      res.status(200).json({ ok: true, ignored: "missing_external_reference" });
      return;
    }

    await prisma.$transaction(async (tx: any) => {
      const checkout = await tx.checkoutSession.findUnique({
        where: { id: checkoutSessionId },
        include: { plan: true },
      });

      if (!checkout) return;

      const latestTx = await tx.paymentTransaction.findFirst({
        where: { checkoutSessionId: checkout.id },
        orderBy: { createdAt: "desc" },
      });

      const wasAlreadyApproved = latestTx?.status === "APPROVED";
      const nextCheckoutStatus = txStatusToCheckoutStatus(txStatus);

      await tx.checkoutSession.update({
        where: { id: checkout.id },
        data: {
          status: nextCheckoutStatus,
          externalCheckoutId: String(
            paymentInfo?.id ?? checkout.externalCheckoutId ?? "",
          ),
          paymentMethod:
            paymentInfo?.payment_method_id ?? checkout.paymentMethod ?? null,
        },
      });

      const txPayload = {
        status: txStatus,
        externalPaymentId: String(paymentInfo?.id ?? parsed.externalPaymentId),
        externalCheckoutId: String(
          paymentInfo?.id ?? checkout.externalCheckoutId ?? "",
        ),
        paymentMethod: paymentInfo?.payment_method_id ?? null,
        approvedAt: txStatus === "APPROVED" ? new Date() : null,
        metadata: {
          ...(latestTx?.metadata && typeof latestTx.metadata === "object"
            ? (latestTx.metadata as any)
            : {}),
          mpWebhook: { receivedAt: new Date().toISOString() },
          mpPayment: paymentInfo ?? null,
        } as any,
      };

      if (latestTx) {
        await tx.paymentTransaction.update({
          where: { id: latestTx.id },
          data: txPayload,
        });
      } else {
        await tx.paymentTransaction.create({
          data: {
            adminId: checkout.adminId ?? null,
            userId: checkout.userId ?? null,
            checkoutSessionId: checkout.id,
            provider: checkout.provider,
            status: txStatus,
            externalPaymentId: txPayload.externalPaymentId,
            externalCheckoutId: txPayload.externalCheckoutId,
            amount: checkout.amount,
            currency: checkout.currency,
            paymentMethod: txPayload.paymentMethod,
            approvedAt: txPayload.approvedAt,
            metadata: txPayload.metadata,
          },
        });
      }

      // evita processar duas vezes
      if (txStatus !== "APPROVED" || wasAlreadyApproved) {
        return;
      }

      const now = new Date();

      // estoque: decrementa uma vez só quando aprova
      if (
        Number.isFinite(checkout.plan.quantity) &&
        checkout.plan.quantity > 0
      ) {
        await tx.subscriptionPlan.update({
          where: { id: checkout.planId },
          data: {
            quantity: {
              decrement: 1,
            },
          },
        });
      }

      // PLAYER com tempo corrido
      if (checkout.userId) {
        const existingActive = await tx.subscription.findFirst({
          where: {
            userId: checkout.userId,
            status: "ACTIVE",
            OR: [{ endsAt: null }, { endsAt: { gt: now } }],
          },
          orderBy: { createdAt: "desc" },
        });

        const baseDate =
          existingActive?.endsAt && existingActive.endsAt > now
            ? existingActive.endsAt
            : now;

        const endsAt = computeEndsAt(checkout.plan, baseDate);

        let subscriptionId: string | null = null;

        if (existingActive) {
          const updatedActive = await tx.subscription.update({
            where: { id: existingActive.id },
            data: {
              endsAt,
              approvedAt: now,
              metadata: {
                ...(existingActive.metadata &&
                typeof existingActive.metadata === "object"
                  ? existingActive.metadata
                  : {}),
                extendedBy: "mp-webhook",
                checkoutSessionId: checkout.id,
                cycle: checkout.plan.billingCycle,
                durationDaysAdded: resolvePlanDurationDays(checkout.plan),
              },
            },
          });

          subscriptionId = updatedActive.id;
        } else {
          const pendingSubscription = await tx.subscription.findFirst({
            where: {
              userId: checkout.userId,
              planId: checkout.planId,
              status: "PENDING",
            },
            orderBy: { createdAt: "desc" },
          });

          if (pendingSubscription) {
            const updatedSubscription = await tx.subscription.update({
              where: { id: pendingSubscription.id },
              data: {
                status: "ACTIVE",
                startsAt: now,
                endsAt,
                approvedAt: now,
                metadata: {
                  ...(pendingSubscription.metadata &&
                  typeof pendingSubscription.metadata === "object"
                    ? pendingSubscription.metadata
                    : {}),
                  activatedBy: "mp-webhook",
                  checkoutSessionId: checkout.id,
                  cycle: checkout.plan.billingCycle,
                  durationDaysAdded: resolvePlanDurationDays(checkout.plan),
                },
              },
            });

            subscriptionId = updatedSubscription.id;
          } else {
            const createdSubscription = await tx.subscription.create({
              data: {
                userId: checkout.userId,
                adminId: checkout.adminId ?? null,
                planId: checkout.planId,
                status: "ACTIVE",
                startsAt: now,
                endsAt,
                approvedAt: now,
                metadata: {
                  activatedBy: "mp-webhook",
                  checkoutSessionId: checkout.id,
                  cycle: checkout.plan.billingCycle,
                  durationDaysAdded: resolvePlanDurationDays(checkout.plan),
                },
              },
            });

            subscriptionId = createdSubscription.id;
          }
        }

        if (subscriptionId) {
          await tx.checkoutSession.update({
            where: { id: checkout.id },
            data: { subscriptionId },
          });
        }

        return;
      }

      // legado ADMIN
      if (checkout.adminId) {
        const existingActive = await tx.subscription.findFirst({
          where: {
            adminId: checkout.adminId,
            status: "ACTIVE",
            OR: [{ endsAt: null }, { endsAt: { gt: now } }],
          },
          orderBy: { createdAt: "desc" },
        });

        const baseDate =
          existingActive?.endsAt && existingActive.endsAt > now
            ? existingActive.endsAt
            : now;

        const endsAt = computeEndsAt(checkout.plan, baseDate);

        let subscriptionId: string | null = null;

        if (existingActive) {
          const updatedActive = await tx.subscription.update({
            where: { id: existingActive.id },
            data: {
              endsAt,
              approvedAt: now,
              metadata: {
                ...(existingActive.metadata &&
                typeof existingActive.metadata === "object"
                  ? existingActive.metadata
                  : {}),
                extendedBy: "mp-webhook",
                checkoutSessionId: checkout.id,
                cycle: checkout.plan.billingCycle,
                durationDaysAdded: resolvePlanDurationDays(checkout.plan),
              },
            },
          });

          subscriptionId = updatedActive.id;
        } else {
          const pendingSubscription = await tx.subscription.findFirst({
            where: {
              adminId: checkout.adminId,
              planId: checkout.planId,
              status: "PENDING",
            },
            orderBy: { createdAt: "desc" },
          });

          if (pendingSubscription) {
            const updatedSubscription = await tx.subscription.update({
              where: { id: pendingSubscription.id },
              data: {
                status: "ACTIVE",
                startsAt: now,
                endsAt,
                approvedAt: now,
                metadata: {
                  ...(pendingSubscription.metadata &&
                  typeof pendingSubscription.metadata === "object"
                    ? pendingSubscription.metadata
                    : {}),
                  activatedBy: "mp-webhook",
                  checkoutSessionId: checkout.id,
                  cycle: checkout.plan.billingCycle,
                  durationDaysAdded: resolvePlanDurationDays(checkout.plan),
                },
              },
            });

            subscriptionId = updatedSubscription.id;
          } else {
            const createdSubscription = await tx.subscription.create({
              data: {
                adminId: checkout.adminId,
                planId: checkout.planId,
                status: "ACTIVE",
                startsAt: now,
                endsAt,
                approvedAt: now,
                metadata: {
                  activatedBy: "mp-webhook",
                  checkoutSessionId: checkout.id,
                  cycle: checkout.plan.billingCycle,
                  durationDaysAdded: resolvePlanDurationDays(checkout.plan),
                },
              },
            });

            subscriptionId = createdSubscription.id;
          }
        }

        if (subscriptionId) {
          await tx.checkoutSession.update({
            where: { id: checkout.id },
            data: { subscriptionId },
          });
        }
      }
    });

    res.status(200).json({ ok: true });
  }),

  webhookPlaceholder: asyncHandler(async (_req: Request, res: Response) => {
    res.status(410).json({ ok: false, message: "Deprecated webhook endpoint" });
  }),
};