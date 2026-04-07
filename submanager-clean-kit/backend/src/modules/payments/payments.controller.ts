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

function txStatusToCheckoutStatus(status: ReturnType<typeof mpStatusToTxStatus>) {
  if (status === "APPROVED") return "COMPLETED" as const;
  if (status === "CANCELLED") return "CANCELLED" as const;
  if (status === "EXPIRED") return "EXPIRED" as const;
  if (status === "REJECTED") return "CANCELLED" as const;
  return "OPEN" as const;
}

export const paymentsController = {
  me: asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth!;

    const admin = await prisma.adminProfile.findUnique({
      where: { userId: auth.id },
      select: { id: true },
    });

    if (!admin) {
      res.json({ payments: [] });
      return;
    }

    const payments = await prisma.paymentTransaction.findMany({
      where: { adminId: admin.id },
      orderBy: { createdAt: "desc" },
      take: 50,
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
      })),
    });
  }),

  /**
   * Mercado Pago webhook endpoint.
   *
   * Flow:
   * 1) Parse webhook to get payment id
   * 2) Query Mercado Pago API for canonical payment status + external_reference
   * 3) Map external_reference -> CheckoutSession.id
   * 4) Update CheckoutSession + latest PaymentTransaction
   * 5) On APPROVED, create/activate Subscription
   */
  webhookMercadoPago: asyncHandler(async (req: Request, res: Response) => {
    const provider = getPaymentProvider();
    const parsed = await provider.parseWebhook(req.headers as Record<string, string | string[] | undefined>, req.body);

    const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) throw new ApiError(500, "Mercado Pago access token not configured");

    if (!parsed.externalPaymentId) {
      res.status(200).json({ ok: true, ignored: "missing_payment_id" });
      return;
    }

    // Get canonical payment info from Mercado Pago
    const mp = (await import("mercadopago")) as unknown as {
      MercadoPagoConfig: new (opts: { accessToken: string }) => unknown;
      Payment: new (client: unknown) => {
        get: (args: { id: string }) => Promise<MercadoPagoPaymentInfo>;
      };
    };

    const client = new mp.MercadoPagoConfig({ accessToken });
    const payment = new mp.Payment(client);

    const paymentInfo = await payment.get({ id: String(parsed.externalPaymentId) });

    const txStatus = mpStatusToTxStatus(paymentInfo?.status);
    const checkoutSessionId = paymentInfo?.external_reference ? String(paymentInfo.external_reference) : null;

    if (!checkoutSessionId) {
      // No way to link to our DB; acknowledge to avoid retries.
      res.status(200).json({ ok: true, ignored: "missing_external_reference" });
      return;
    }

    // Update checkout session + transaction atomically
    await prisma.$transaction(async (tx: any) => {
      const checkout = await tx.checkoutSession.findUnique({
        where: { id: checkoutSessionId },
        include: { plan: true },
      });

      if (!checkout) return;

      const nextCheckoutStatus = txStatusToCheckoutStatus(txStatus);

      // Update checkout session
      await tx.checkoutSession.update({
        where: { id: checkout.id },
        data: {
          status: nextCheckoutStatus,
          externalCheckoutId: String(paymentInfo?.id ?? checkout.externalCheckoutId ?? ""),
          paymentMethod: paymentInfo?.payment_method_id ?? checkout.paymentMethod ?? null,
          // keep URL/QR as-is (already stored on creation)
        },
      });

      // Update the latest transaction for this checkout, or create one if missing
      const latestTx = await tx.paymentTransaction.findFirst({
        where: { checkoutSessionId: checkout.id },
        orderBy: { createdAt: "desc" },
      });

      const txPayload = {
        status: txStatus,
        externalPaymentId: String(paymentInfo?.id ?? parsed.externalPaymentId),
        externalCheckoutId: String(paymentInfo?.id ?? checkout.externalCheckoutId ?? ""),
        paymentMethod: paymentInfo?.payment_method_id ?? null,
        approvedAt: txStatus === "APPROVED" ? new Date() : null,
        metadata: {
          ...(latestTx?.metadata && typeof latestTx.metadata === "object" ? (latestTx.metadata as any) : {}),
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
            adminId: checkout.adminId,
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

      if (txStatus === "APPROVED") {
        // Activate subscription
        const existingActive = await tx.subscription.findFirst({
          where: { adminId: checkout.adminId, status: "ACTIVE" },
          select: { id: true },
        });

        if (!existingActive) {
          const now = new Date();

          // Compute endsAt based on billing cycle
          const endsAt = new Date(now);
          const cycle = checkout.plan.billingCycle;
          if (cycle === "WEEKLY") endsAt.setDate(endsAt.getDate() + 7);
          else if (cycle === "MONTHLY") endsAt.setMonth(endsAt.getMonth() + 1);
          else endsAt.setFullYear(endsAt.getFullYear() + 1);

          const sub = await tx.subscription.create({
            data: {
              adminId: checkout.adminId,
              planId: checkout.planId,
              status: "ACTIVE",
              startsAt: now,
              endsAt,
              approvedAt: now,
              metadata: { activatedBy: "mp-webhook", checkoutSessionId: checkout.id },
            },
          });

          await tx.checkoutSession.update({
            where: { id: checkout.id },
            data: { subscriptionId: sub.id },
          });
        }
      }
    });

    res.status(200).json({ ok: true });
  }),

  // Kept for backwards compatibility; routes will point to webhookMercadoPago
  webhookPlaceholder: asyncHandler(async (_req: Request, res: Response) => {
    res.status(410).json({ ok: false, message: "Deprecated webhook endpoint" });
  }),
};
