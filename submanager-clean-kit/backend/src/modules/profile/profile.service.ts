import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../shared/utils/ApiError.js";

function normalizeDiscordId(value: unknown): string {
  return String(value || "").trim();
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
          supervisedMatchesWon: 0,
          latestWinAt: null,
          discordId: null,
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
        discordId: user.discordId,
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