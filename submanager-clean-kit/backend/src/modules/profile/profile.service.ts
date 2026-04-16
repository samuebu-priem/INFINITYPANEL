import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../shared/utils/ApiError.js";

function normalizeDiscordId(value: unknown): string {
  return String(value || "").trim();
}

function normalizeText(value: unknown): string | null {
  const text = String(value || "").trim();
  return text ? text : null;
}

function getDiscordDisplayName(user: {
  username: string;
  discordUsername: string | null;
  discordGlobalName: string | null;
  discordGuildNick: string | null;
}) {
  return (
    user.discordGuildNick ??
    user.discordGlobalName ??
    user.discordUsername ??
    user.username
  );
}

export const profileService = {
  summary: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        discordId: true,
        discordUsername: true,
        discordGlobalName: true,
        discordAvatar: true,
        discordGuildNick: true,
        discordConnectedAt: true,
        avatarUrl: true,
        status: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const wins = user.discordId
      ? await prisma.supervisorMatchRecord.count({
          where: {
            winner: user.discordId,
          },
        })
      : 0;

    const matchesPlayed = user.discordId
      ? await prisma.supervisorMatchRecord.count({
          where: {
            players: {
              array_contains: user.discordId,
            } as any,
          },
        })
      : 0;

    const latestWin = user.discordId
      ? await prisma.supervisorMatchRecord.findFirst({
          where: {
            winner: user.discordId,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            createdAt: true,
          },
        })
      : null;

    const mediatedRecords = user.discordId
      ? await prisma.supervisorMatchRecord.findMany({
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
        })
      : [];

    const mediatorProfitTotal = mediatedRecords.reduce(
      (acc: number, item: (typeof mediatedRecords)[number]) =>
        acc + Number(item.mediatorRevenue || 0),
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

        discordId: user.discordId ?? null,
        discordUsername: user.discordUsername ?? null,
        discordGlobalName: user.discordGlobalName ?? null,
        discordAvatar: user.discordAvatar ?? null,
        discordGuildNick: user.discordGuildNick ?? null,
        discordConnectedAt: user.discordConnectedAt ?? null,
        discordDisplayName: getDiscordDisplayName(user),

        avatarUrl: user.avatarUrl ?? null,
        status: user.status ?? null,

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
        avatarUrl: true,
        status: true,
      },
    });

    return {
      success: true,
      profile: {
        id: updated.id,
        discordId: updated.discordId,
        avatarUrl: updated.avatarUrl ?? null,
        status: updated.status ?? null,
      },
    };
  },

  updateProfileFields: async (
    userId: string,
    input: { avatarUrl?: unknown; status?: unknown },
  ) => {
    const data: { avatarUrl?: string | null; status?: string | null } = {};

    if (Object.prototype.hasOwnProperty.call(input, "avatarUrl")) {
      data.avatarUrl = normalizeText(input.avatarUrl);
    }

    if (Object.prototype.hasOwnProperty.call(input, "status")) {
      data.status = normalizeText(input.status);
    }

    if (!("avatarUrl" in data) && !("status" in data)) {
      throw new ApiError(400, "No profile fields provided");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        avatarUrl: true,
        status: true,
      },
    });

    return {
      success: true,
      profile: {
        id: updated.id,
        avatarUrl: updated.avatarUrl ?? null,
        status: updated.status ?? null,
      },
    };
  },
};