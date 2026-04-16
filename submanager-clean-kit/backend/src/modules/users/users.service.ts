import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../shared/utils/ApiError.js";

export const usersService = {
  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        discordId: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        playerProfile: { select: { nickname: true } },
        adminProfile: { select: { isActive: true, weeklyFee: true } },
      },
    });

    if (!user) throw new ApiError(404, "User not found");

    return user;
  },

  async listAll() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        discordId: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        playerProfile: { select: { nickname: true } },
        adminProfile: { select: { isActive: true, weeklyFee: true } },
      },
    });
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        discordId: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        playerProfile: { select: { nickname: true } },
        adminProfile: { select: { isActive: true, weeklyFee: true } },
      },
    });

    if (!user) throw new ApiError(404, "User not found");

    return user;
  },
};