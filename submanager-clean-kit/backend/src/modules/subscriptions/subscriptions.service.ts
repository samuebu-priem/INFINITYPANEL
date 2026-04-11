import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../shared/utils/ApiError.js";

function isActiveSubscription(subscription: {
  status: string;
  endsAt: Date | null;
}) {
  return (
    subscription.status === "ACTIVE" &&
    (!subscription.endsAt || subscription.endsAt > new Date())
  );
}

function mapSubscription(subscription: {
  id: string;
  status: string;
  startsAt: Date | null;
  endsAt: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
  plan: {
    id: string;
    name: string;
    amount: unknown;
    billingCycle: string;
    currency: string;
  };
}) {
  return {
    id: subscription.id,
    status: subscription.status,
    startsAt: subscription.startsAt,
    endsAt: subscription.endsAt,
    approvedAt: subscription.approvedAt ?? null,
    createdAt: subscription.createdAt,
    plan: subscription.plan,
    isActive: isActiveSubscription(subscription),
  };
}

export const subscriptionsService = {
  getMySubscription: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const now = new Date();

    if (user.role === "PLAYER") {
      const playerSubscriptions = await prisma.subscription.findMany({
        where: {
          userId: user.id,
          status: "ACTIVE",
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
        orderBy: [{ endsAt: "asc" }, { createdAt: "desc" }],
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              amount: true,
              billingCycle: true,
              currency: true,
            },
          },
        },
      });

      return {
        subscriptions: playerSubscriptions.map(mapSubscription),
      };
    }

    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!adminProfile) {
      return { subscriptions: [] };
    }

    const legacySubscriptions = await prisma.subscription.findMany({
      where: {
        adminId: adminProfile.id,
        status: "ACTIVE",
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      orderBy: [{ endsAt: "asc" }, { createdAt: "desc" }],
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            amount: true,
            billingCycle: true,
            currency: true,
          },
        },
      },
    });

    return {
      subscriptions: legacySubscriptions.map(mapSubscription),
    };
  },

  startSubscription: async (userId: string, planId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.role !== "PLAYER") {
      throw new ApiError(403, "Only PLAYER users can subscribe");
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      select: { id: true, isActive: true },
    });

    if (!plan || !plan.isActive) {
      throw new ApiError(404, "Plan not found");
    }

    const activeSamePlan = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        planId: plan.id,
        status: "ACTIVE",
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
      select: { id: true },
    });

    if (activeSamePlan) {
      throw new ApiError(
        409,
        "Active subscription for this plan already exists",
      );
    }

    throw new ApiError(
      409,
      "Subscription creation is temporarily disabled until checkout flow finalizes activation",
    );
  },
};