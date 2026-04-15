import { prisma } from "../../config/prisma.js";

export const profileService = {
  summary: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        discordId: true,
      },
    });

    if (!user?.discordId) {
      return {
        summary: {
          wins: 0,
          supervisedMatchesWon: 0,
          latestWinAt: null,
        },
      };
    }

    const wins = await prisma.supervisorMatchRecord.count({
      where: {
        winner: user.discordId,
      },
    });

    const latestWin = await prisma.supervisorMatchRecord.findFirst({
      where: {
        winner: user.discordId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    });

    return {
      summary: {
        wins,
        supervisedMatchesWon: wins,
        latestWinAt: latestWin?.createdAt ?? null,
      },
    };
  },
};