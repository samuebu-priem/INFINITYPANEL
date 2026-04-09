import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../shared/utils/ApiError.js";

function isActiveStatus(status: string) {
  return status === "ACTIVE";
}

export const subscriptionsService = {
  getMySubscription: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
      },
      include: {
        plan: true,
      },
      orderBy: [
        { createdAt: "desc" },
        { updatedAt: "desc" },
      ],
    });

    if (!subscription) {
      return {
        userId: user.id,
        role: user.role,
        subscription: null,
      };
    }

    return {
      userId: user.id,
      role: user.role,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        isActive: isActiveStatus(subscription.status),
        startsAt: subscription.startsAt,
        endsAt: subscription.endsAt,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          billingCycle: subscription.plan.billingCycle,
        },
      },
    };
  },

  startSubscription: async (userId: string, planId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.role !== "PLAYER") {
      throw new ApiError(403, "Only PLAYER users can subscribe");
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        name: true,
        billingCycle: true,
        amount: true,
        currency: true,
        isActive: true,
      },
    });

    if (!plan || !plan.isActive) {
      throw new ApiError(404, "Plan not found");
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
      include: {
        plan: true,
      },
      orderBy: [
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    if (activeSubscription) {
      return {
        userId: user.id,
        role: user.role,
        subscription: {
          id: activeSubscription.id,
          status: activeSubscription.status,
          isActive: true,
          startsAt: activeSubscription.startsAt,
          endsAt: activeSubscription.endsAt,
          plan: {
            id: activeSubscription.plan.id,
            name: activeSubscription.plan.name,
            billingCycle: activeSubscription.plan.billingCycle,
          },
        },
      };
    }

    const created = await prisma.subscription.create({
      data: {
        userId: user.id,
        adminId: user.id,
        planId: plan.id,
        status: "PENDING",
      },
      include: {
        plan: true,
      },
    });

    return {
      userId: user.id,
      role: user.role,
      subscription: {
        id: created.id,
        status: created.status,
        isActive: isActiveStatus(created.status),
        startsAt: created.startsAt,
        endsAt: created.endsAt,
        plan: {
          id: created.plan.id,
          name: created.plan.name,
          billingCycle: created.plan.billingCycle,
        },
      },
    };
  },
};
