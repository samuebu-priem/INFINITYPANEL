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

function mapClientSubscription(
  subscription:
    | {
        id: string;
        status: string;
        startsAt: Date | null;
        endsAt: Date | null;
        plan: {
          id: string;
          name: string;
        };
      }
    | undefined,
) {
  if (!subscription) return null;

  const now = new Date();
  const isActive =
    subscription.status === "ACTIVE" &&
    (!subscription.endsAt || subscription.endsAt > now);

  return {
    id: subscription.id,
    status: subscription.status,
    startsAt: subscription.startsAt,
    endsAt: subscription.endsAt,
    isActive,
    plan: {
      id: subscription.plan.id,
      name: subscription.plan.name,
    },
  };
}

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
            status: "ACTIVE",
            OR: [{ endsAt: null }, { endsAt: { gt: now } }],
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
        const subscription = mapClientSubscription(user.subscriptions[0]);

        clients.push({
          id: user.id,
          username: user.username,
          email: user.email,
          role: "PLAYER",
          subscription,
          isOnline: Boolean(subscription?.isActive),
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