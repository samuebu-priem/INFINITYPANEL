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

export const adminService = {
  usersOverview: async (): Promise<{
    staff: OverviewStaffUser[];
    clients: OverviewClientUser[];
  }> => {
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
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });

    const staff: OverviewStaffUser[] = [];
    const clients: OverviewClientUser[] = [];

    for (const user of users) {
      if (user.role === "PLAYER") {
        clients.push({
          id: user.id,
          username: user.username,
          email: user.email,
          role: "PLAYER",
          subscription: null,
          isOnline: false,
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