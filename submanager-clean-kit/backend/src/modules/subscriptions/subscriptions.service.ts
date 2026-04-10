import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../shared/utils/ApiError.js";

function isActiveSubscription(subscription: { status: string; endsAt: Date | null }) {
  return subscription.status === "ACTIVE" && (!subscription.endsAt || subscription.endsAt > new Date());
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

    const playerSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
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

    if (user.role === "PLAYER") {
      if (!playerSubscription) {
        return { subscription: null };
      }

      return {
        subscription: {
          id: playerSubscription.id,
          status: playerSubscription.status,
          startsAt: playerSubscription.startsAt,
          endsAt: playerSubscription.endsAt,
          approvedAt: playerSubscription.approvedAt ?? null,
          createdAt: playerSubscription.createdAt,
          plan: playerSubscription.plan,
          isActive: isActiveSubscription(playerSubscription),
        },
      };
    }

    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!adminProfile) {
      return { subscription: null };
    }

    const legacySubscription = await prisma.subscription.findFirst({
      where: {
        adminId: adminProfile.id,
        status: "ACTIVE",
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
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

    if (!legacySubscription) {
      return { subscription: null };
    }

    return {
      subscription: {
        id: legacySubscription.id,
        status: legacySubscription.status,
        startsAt: legacySubscription.startsAt,
        endsAt: legacySubscription.endsAt,
        approvedAt: legacySubscription.approvedAt ?? null,
        createdAt: legacySubscription.createdAt,
        plan: legacySubscription.plan,
        isActive: isActiveSubscription(legacySubscription),
      },
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

    const active = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
      select: { id: true },
    });

    if (active) {
      throw new ApiError(409, "Active subscription already exists");
    }

    throw new ApiError(409, "Subscription creation is temporarily disabled until legacy migration is finalized");
  },
};
