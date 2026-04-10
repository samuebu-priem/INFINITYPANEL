import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../shared/utils/ApiError.js";
import { getPaymentProvider } from "../payments/providers/providerFactory.js";

type CheckoutSessionStatus =
  | "PENDING"
  | "OPEN"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

type PaymentTransactionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED";

export type CreateCheckoutInput = {
  adminProfileId: string;
  planId: string;
};

export type CreatePlayerCheckoutInput = {
  userId: string;
  planId: string;
};

export type CreateCheckoutResult = {
  checkoutSessionId: string;
  status: string;
  provider: string;
  plan: {
    id: string;
    name: string;
    billingCycle: string;
  };
  amount: string;
  currency: string;
  checkoutUrl: string | null;
  qrCode: string | null;
  qrCodeBase64: string | null;
  expiresAt: Date | null;
  paymentTransactionId: string | null;
};

function mapProviderStatusToCheckoutStatus(
  status: string,
): CheckoutSessionStatus {
  if (status === "approved") return "COMPLETED";
  if (status === "cancelled") return "CANCELLED";
  if (status === "expired") return "EXPIRED";
  if (status === "rejected") return "CANCELLED";
  return "OPEN";
}

function mapProviderStatusToPaymentStatus(
  status: string,
): PaymentTransactionStatus {
  if (status === "approved") return "APPROVED";
  if (status === "cancelled") return "CANCELLED";
  if (status === "expired") return "EXPIRED";
  if (status === "rejected") return "REJECTED";
  return "PENDING";
}

async function buildCheckoutResponse(
  checkoutSessionId: string,
  plan: {
    id: string;
    name: string;
    billingCycle: string;
  },
) {
  const checkout = await prisma.checkoutSession.findUnique({
    where: { id: checkoutSessionId },
    include: {
      paymentTransactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!checkout) {
    throw new ApiError(404, "Checkout not found");
  }

  return {
    checkoutSessionId: checkout.id,
    status: checkout.status,
    provider: checkout.provider,
    plan,
    amount: checkout.amount.toString(),
    currency: checkout.currency,
    checkoutUrl: checkout.checkoutUrl,
    qrCode: checkout.qrCode,
    qrCodeBase64: checkout.qrCodeBase64,
    expiresAt: checkout.expiresAt,
    paymentTransactionId: checkout.paymentTransactions?.[0]?.id ?? null,
  };
}

export const checkoutService = {
  createPlayerSubscriptionCheckout: async (
    input: CreatePlayerCheckoutInput,
  ): Promise<CreateCheckoutResult> => {
    console.log("[checkout] createPlayerSubscriptionCheckout", input);

    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, role: true, email: true },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.role !== "PLAYER") {
      throw new ApiError(403, "Only PLAYER users can create checkout");
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: input.planId },
    });

    if (!plan || !plan.isActive) {
      throw new ApiError(404, "Plan not found");
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
      select: { id: true },
    });

    if (activeSubscription) {
      throw new ApiError(409, "Active subscription already exists");
    }

    const existing = await prisma.checkoutSession.findFirst({
      where: {
        userId: user.id,
        planId: plan.id,
        status: { in: ["PENDING", "OPEN"] },
      },
      orderBy: { createdAt: "desc" },
    });

    const existingHasArtifacts = Boolean(
      existing?.checkoutUrl || existing?.qrCode || existing?.qrCodeBase64,
    );

    if (
      existing &&
      (!existing.expiresAt || existing.expiresAt > new Date()) &&
      existingHasArtifacts
    ) {
      const latestTx = await prisma.paymentTransaction.findFirst({
        where: { checkoutSessionId: existing.id },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      return {
        checkoutSessionId: existing.id,
        status: existing.status,
        provider: existing.provider,
        plan: {
          id: plan.id,
          name: plan.name,
          billingCycle: plan.billingCycle,
        },
        amount: existing.amount.toString(),
        currency: existing.currency,
        checkoutUrl: existing.checkoutUrl,
        qrCode: existing.qrCode,
        qrCodeBase64: existing.qrCodeBase64,
        expiresAt: existing.expiresAt,
        paymentTransactionId: latestTx?.id ?? null,
      };
    }

    const provider = getPaymentProvider();

    const pending = await prisma.checkoutSession.create({
      data: {
        userId: user.id,
        planId: plan.id,
        provider: "MERCADO_PAGO",
        status: "PENDING",
        amount: plan.amount,
        currency: plan.currency,
        metadata: {
          planBillingCycle: plan.billingCycle,
          checkoutOwnerRole: "PLAYER",
        },
      },
    });

    const providerResponse = (await provider.createCheckout({
      amount: plan.amount.toString(),
      currency: plan.currency,
      externalReference: pending.id,
      expiresAt: pending.expiresAt ?? undefined,
      metadata: {
        checkoutSessionId: pending.id,
        userId: user.id,
        planId: plan.id,
        payerEmail: user.email || (env as any).MERCADO_PAGO_PAYER_EMAIL,
      },
    })) as unknown as {
      status: string;
      externalCheckoutId?: string | null;
      checkoutUrl?: string | null;
      qrCode?: string | null;
      qrCodeBase64?: string | null;
      paymentMethod?: string | null;
      expiresAt?: Date | null;
      raw?: unknown;
    };

    const baseMetadata =
      pending.metadata && typeof pending.metadata === "object"
        ? (pending.metadata as Record<string, unknown>)
        : {};

    const nextMetadata = providerResponse.raw
      ? ({ ...baseMetadata, providerRaw: providerResponse.raw } as unknown)
      : (baseMetadata as unknown);

    const updated = await prisma.checkoutSession.update({
      where: { id: pending.id },
      data: {
        status: mapProviderStatusToCheckoutStatus(providerResponse.status),
        externalCheckoutId: providerResponse.externalCheckoutId ?? null,
        checkoutUrl: providerResponse.checkoutUrl ?? null,
        qrCode: providerResponse.qrCode ?? null,
        qrCodeBase64: providerResponse.qrCodeBase64 ?? null,
        paymentMethod: providerResponse.paymentMethod ?? null,
        expiresAt: providerResponse.expiresAt ?? null,
        metadata: nextMetadata as never,
      },
    });

    await prisma.paymentTransaction.create({
      data: {
        userId: user.id,
        checkoutSessionId: updated.id,
        provider: updated.provider,
        status: mapProviderStatusToPaymentStatus(providerResponse.status),
        providerPublicKey: updated.providerPublicKey ?? null,
        providerAccessToken: updated.providerAccessToken ?? null,
        externalCheckoutId: updated.externalCheckoutId ?? null,
        amount: updated.amount,
        currency: updated.currency,
        paymentMethod: updated.paymentMethod ?? null,
        ...(providerResponse.raw
          ? { metadata: { providerRaw: providerResponse.raw } }
          : {}),
      },
    });

    return buildCheckoutResponse(updated.id, {
      id: plan.id,
      name: plan.name,
      billingCycle: plan.billingCycle,
    });
  },

  createAdminSubscriptionCheckout: async (
    input: CreateCheckoutInput,
  ): Promise<CreateCheckoutResult> => {
    console.log("[checkout] createAdminSubscriptionCheckout", input);

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: input.planId },
    });

    if (!plan || !plan.isActive) {
      throw new ApiError(404, "Plan not found");
    }

    const admin = await prisma.adminProfile.findUnique({
      where: { id: input.adminProfileId },
      select: { id: true, userId: true },
    });

    if (!admin) {
      throw new ApiError(404, "Admin profile not found");
    }

    const existing = await prisma.checkoutSession.findFirst({
      where: {
        adminId: admin.id,
        planId: plan.id,
        status: { in: ["PENDING", "OPEN"] },
      },
      orderBy: { createdAt: "desc" },
    });

    const existingHasArtifacts = Boolean(
      existing?.checkoutUrl || existing?.qrCode || existing?.qrCodeBase64,
    );

    if (
      existing &&
      (!existing.expiresAt || existing.expiresAt > new Date()) &&
      existingHasArtifacts
    ) {
      const latestTx = await prisma.paymentTransaction.findFirst({
        where: { checkoutSessionId: existing.id },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      return {
        checkoutSessionId: existing.id,
        status: existing.status,
        provider: existing.provider,
        plan: {
          id: plan.id,
          name: plan.name,
          billingCycle: plan.billingCycle,
        },
        amount: existing.amount.toString(),
        currency: existing.currency,
        checkoutUrl: existing.checkoutUrl,
        qrCode: existing.qrCode,
        qrCodeBase64: existing.qrCodeBase64,
        expiresAt: existing.expiresAt,
        paymentTransactionId: latestTx?.id ?? null,
      };
    }

    const provider = getPaymentProvider();

    console.log("[checkout] provider selected", {
      provider: (provider as any)?.provider,
    });

    const pending = await prisma.checkoutSession.create({
      data: {
        adminId: admin.id,
        planId: plan.id,
        provider: "MERCADO_PAGO",
        status: "PENDING",
        amount: plan.amount,
        currency: plan.currency,
        metadata: { planBillingCycle: plan.billingCycle },
      },
    });

    console.log("[checkout] calling provider.createCheckout", {
      checkoutSessionId: pending.id,
    });

    const providerResponse = (await provider.createCheckout({
      amount: plan.amount.toString(),
      currency: plan.currency,
      externalReference: pending.id,
      expiresAt: pending.expiresAt ?? undefined,
      metadata: {
        checkoutSessionId: pending.id,
        adminUserId: admin.userId,
        planId: plan.id,
        payerEmail: (env as any).MERCADO_PAGO_PAYER_EMAIL,
      },
    })) as unknown as {
      status: string;
      externalCheckoutId?: string | null;
      checkoutUrl?: string | null;
      qrCode?: string | null;
      qrCodeBase64?: string | null;
      paymentMethod?: string | null;
      expiresAt?: Date | null;
      raw?: unknown;
    };

    const baseMetadata =
      pending.metadata && typeof pending.metadata === "object"
        ? (pending.metadata as Record<string, unknown>)
        : {};

    const nextMetadata = providerResponse.raw
      ? ({ ...baseMetadata, providerRaw: providerResponse.raw } as unknown)
      : (baseMetadata as unknown);

    const updated = await prisma.checkoutSession.update({
      where: { id: pending.id },
      data: {
        status: mapProviderStatusToCheckoutStatus(providerResponse.status),
        externalCheckoutId: providerResponse.externalCheckoutId ?? null,
        checkoutUrl: providerResponse.checkoutUrl ?? null,
        qrCode: providerResponse.qrCode ?? null,
        qrCodeBase64: providerResponse.qrCodeBase64 ?? null,
        paymentMethod: providerResponse.paymentMethod ?? null,
        expiresAt: providerResponse.expiresAt ?? null,
        metadata: nextMetadata as never,
      },
    });

    await prisma.paymentTransaction.create({
      data: {
        adminId: admin.id,
        checkoutSessionId: updated.id,
        provider: updated.provider,
        status: mapProviderStatusToPaymentStatus(providerResponse.status),
        providerPublicKey: updated.providerPublicKey ?? null,
        providerAccessToken: updated.providerAccessToken ?? null,
        externalCheckoutId: updated.externalCheckoutId ?? null,
        amount: updated.amount,
        currency: updated.currency,
        paymentMethod: updated.paymentMethod ?? null,
        ...(providerResponse.raw
          ? { metadata: { providerRaw: providerResponse.raw } }
          : {}),
      },
    });

    return buildCheckoutResponse(updated.id, {
      id: plan.id,
      name: plan.name,
      billingCycle: plan.billingCycle,
    });
  },

  getCheckoutByIdForAdmin: async (
    adminProfileId: string,
    checkoutId: string,
  ) => {
    const checkout = await prisma.checkoutSession.findFirst({
      where: { id: checkoutId, adminId: adminProfileId },
      include: {
        plan: true,
        paymentTransactions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!checkout) throw new ApiError(404, "Checkout not found");

    return {
      checkoutSessionId: checkout.id,
      status: checkout.status,
      provider: checkout.provider,
      plan: {
        id: checkout.plan.id,
        name: checkout.plan.name,
        billingCycle: checkout.plan.billingCycle,
      },
      amount: checkout.amount.toString(),
      currency: checkout.currency,
      checkoutUrl: checkout.checkoutUrl,
      qrCode: checkout.qrCode,
      qrCodeBase64: checkout.qrCodeBase64,
      expiresAt: checkout.expiresAt,
      paymentTransactionId: checkout.paymentTransactions?.[0]?.id ?? null,
    };
  },
};