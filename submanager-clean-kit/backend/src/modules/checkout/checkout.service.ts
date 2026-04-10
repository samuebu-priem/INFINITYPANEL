import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../shared/utils/ApiError.js";

export const subscriptionsService = {
  getMySubscription: async (userId: string) => {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!admin) throw new ApiError(403, "Admin profile required");

    const now = new Date();
    const subscription = await prisma.subscription.findFirst({
      where: {
        adminId: admin.id,
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

    if (!subscription) {
      return { subscription: null };
    }

    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        startsAt: subscription.startsAt,
        endsAt: subscription.endsAt,
        approvedAt: subscription.approvedAt ?? null,
        createdAt: subscription.createdAt,
        plan: subscription.plan,
        isActive:
          subscription.status === "ACTIVE" &&
          (!subscription.endsAt || subscription.endsAt > now),
      },
    };
  },

  startSubscription: async (userId: string, planId: string) => {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!admin) throw new ApiError(403, "Admin profile required");

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) throw new ApiError(404, "Plan not found");

    const active = await prisma.subscription.findFirst({
      where: { adminId: admin.id, status: "ACTIVE" },
      select: { id: true },
    });

    if (active) {
      throw new ApiError(409, "Active subscription already exists");
    }

    const subscription = await prisma.subscription.create({
      data: {
        adminId: admin.id,
        planId: plan.id,
        status: "PENDING",
        metadata: { createdBy: "subscriptions/start" },
      },
    });

    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        createdAt: subscription.createdAt,
      },
    };
  },
};