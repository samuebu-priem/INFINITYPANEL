import { prisma } from "../../config/prisma.js";

const RECENT_TAKE = 50;

export const devPaymentsService = {
  listPlans: async () => {
    return prisma.subscriptionPlan.findMany({
      take: RECENT_TAKE,
      orderBy: { createdAt: "desc" },
      include: {
        checkoutSessions: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { admin: { include: { user: true } } },
        },
        subscriptions: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { admin: { include: { user: true } } },
        },
      },
    });
  },

  listCheckoutSessions: async () => {
    return prisma.checkoutSession.findMany({
      take: RECENT_TAKE,
      orderBy: { createdAt: "desc" },
      include: {
        plan: true,
        admin: { include: { user: true } },
        paymentTransactions: true,
        subscription: {
          include: { plan: true, admin: { include: { user: true } } },
        },
      },
    });
  },

  listTransactions: async () => {
    return prisma.paymentTransaction.findMany({
      take: RECENT_TAKE,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { include: { user: true } },
        checkoutSession: { include: { plan: true, admin: { include: { user: true } } } },
        subscription: { include: { plan: true, admin: { include: { user: true } } } },
      },
    });
  },

  listSubscriptions: async () => {
    return prisma.subscription.findMany({
      take: RECENT_TAKE,
      orderBy: { createdAt: "desc" },
      include: {
        plan: true,
        admin: { include: { user: true } },
        checkoutSessions: { take: 5, orderBy: { createdAt: "desc" } },
        paymentTransactions: { take: 5, orderBy: { createdAt: "desc" } },
      },
    });
  },
};
