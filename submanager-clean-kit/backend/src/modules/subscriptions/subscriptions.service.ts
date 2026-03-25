import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../shared/utils/ApiError.js";

export const subscriptionsService = {
  getMySubscription: async (userId: string) => {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!admin) throw new ApiError(403, "Admin profile required");

    const subscription = await prisma.subscription.findFirst({
      where: { adminId: admin.id },
      orderBy: { createdAt: "desc" },
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
        // Plan details will be linked once we unify schema to the new SubscriptionPlan model.
      },
    };
  },

  /**
   * Creates a Subscription record in PENDING state.
   * Checkout creation is handled by /checkout/create and references plan/admin.
   * This endpoint exists to match the requested contract and to support future flows.
   */
  startSubscription: async (userId: string, planId: string) => {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!admin) throw new ApiError(403, "Admin profile required");

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
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
