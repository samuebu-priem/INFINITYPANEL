import { prisma } from "../../config/prisma.js";

type OverviewStaffUser = {
  id: string;
  username: string;
  email: string;
  role: "OWNER" | "ADMIN";
};

type OverviewClientSubscription = {
  id: string;
  status: string;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  plan: {
    id: string;
    name: string;
  };
};

type OverviewClientUser = {
  id: string;
  username: string;
  email: string;
  role: "PLAYER";
  subscription: OverviewClientSubscription | null;
  isOnline: boolean;
};

const mapSubscription = (
  subscription: {
    id: string;
    status: string;
    startsAt: Date | null;
    endsAt: Date | null;
    plan: { id: string; name: string };
  } | null,
): OverviewClientSubscription | null => {
  if (!subscription) return null;

  const isActive =
    subscription.status === "ACTIVE" ||
    (subscription.endsAt !== null && subscription.endsAt > new Date());

  return {
    id: subscription.id,
    status: subscription.status,
    isActive,
    startsAt: subscription.startsAt,
    endsAt: subscription.endsAt,
    plan: {
      id: subscription.plan.id,
      name: subscription.plan.name,
    },
  };
};

export const adminService = {
  usersOverview: async (): Promise<{
    staff: OverviewStaffUser[];
    clients: OverviewClientUser[];
  }> => {
    const now = new Date();

    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ["OWNER", "ADMIN", "PLAYER"],
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        subscriptions: {
          where: {
            OR: [
              { status: "ACTIVE" },
              { endsAt: { gt: now } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            startsAt: true,
            endsAt: true,
            plan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });

    const staff: OverviewStaffUser[] = [];
    const clients: OverviewClientUser[] = [];

    for (const user of users) {
      if (user.role === "PLAYER") {
        const subscriptionRecord = user.subscriptions[0] ?? null;
        const subscription = mapSubscription(subscriptionRecord);

        const isOnline =
          subscription?.isActive === true ||
          subscription?.status === "ACTIVE" ||
          (subscription?.endsAt !== null &&
            subscription?.endsAt !== undefined &&
            subscription.endsAt > now);

        clients.push({
          id: user.id,
          username: user.username,
          email: user.email,
          role: "PLAYER",
          subscription,
          isOnline,
        });
        continue;
      }

      staff.push({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    }

    return { staff, clients };
  },
};