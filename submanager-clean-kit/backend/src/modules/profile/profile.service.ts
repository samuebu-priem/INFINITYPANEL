import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../shared/utils/ApiError.js";

function normalizeDiscordId(value: unknown): string {
  return String(value || "").trim();
}

function startOfWindow(period: "total" | "weekly" | "24h"): Date | null {
  const now = new Date();

  if (period === "24h") {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  if (period === "weekly") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return null;
}

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
          matchesPlayed: 0,
          latestWinAt: null,
          discordId: null,
          mediatorProfitTotal: 0,
          mediatedMatchesCount: 0,
          bestMediatorDay: null,
          mediatorSeries: [],
        },
      };
    }

    const wins = await prisma.supervisorMatchRecord.count({
      where: {
        winner: user.discordId,
      },
    });

    const matchesPlayed = await prisma.supervisorMatchRecord.count({
      where: {
        players: {
          array_contains: user.discordId,
        } as any,
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

    const mediatedRecords = await prisma.supervisorMatchRecord.findMany({
      where: {
        mediatorId: user.discordId,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        mediatorRevenue: true,
        createdAt: true,
      },
    });

    const mediatorProfitTotal = mediatedRecords.reduce(
      (acc: number, item: typeof mediatedRecords[number]) => acc + Number(item.mediatorRevenue || 0),
      0,
    );

    const mediatedMatchesCount = mediatedRecords.length;

    const groupedByDay = new Map<string, number>();

    for (const item of mediatedRecords) {
      const day = item.createdAt.toISOString().slice(0, 10);
      groupedByDay.set(day, (groupedByDay.get(day) || 0) + Number(item.mediatorRevenue || 0));
    }

    const mediatorSeries = [...groupedByDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({
        date,
        amount,
      }));

    const bestMediatorDay =
      mediatorSeries.length > 0
        ? mediatorSeries.reduce((best, current) =>
            current.amount > best.amount ? current : best,
          )
        : null;

    return {
      summary: {
        wins,
        matchesPlayed,
        latestWinAt: latestWin?.createdAt ?? null,
        discordId: user.discordId,
        mediatorProfitTotal,
        mediatedMatchesCount,
        bestMediatorDay,
        mediatorSeries,
      },
    };
  },

  updateDiscordId: async (userId: string, discordIdInput: unknown) => {
    const discordId = normalizeDiscordId(discordIdInput);

    if (!discordId) {
      throw new ApiError(400, "discordId is required");
    }

    if (!/^\d{16,20}$/.test(discordId)) {
      throw new ApiError(400, "discordId must be a valid Discord numeric ID");
    }

    const existingOwner = await prisma.user.findFirst({
      where: {
        discordId,
        NOT: {
          id: userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingOwner) {
      throw new ApiError(409, "This Discord ID is already linked to another account");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { discordId },
      select: {
        id: true,
        discordId: true,
      },
    });

    return {
      success: true,
      profile: {
        id: updated.id,
        discordId: updated.discordId,
      },
    };
  },
};