import { prisma } from "../../config/prisma.js";

type RankingPeriod = "total" | "weekly" | "24h";

function startOfWindow(period: RankingPeriod): Date | null {
  const now = new Date();

  if (period === "24h") {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  if (period === "weekly") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return null;
}

export const rankingsService = {
  publicWins: async (period: RankingPeriod) => {
    const startDate = startOfWindow(period);

    const whereClause = startDate
      ? {
          createdAt: {
            gte: startDate,
          },
        }
      : undefined;

    const records = await prisma.supervisorMatchRecord.findMany({
      ...(whereClause ? { where: whereClause } : {}),
      orderBy: {
        createdAt: "desc",
      },
      select: {
        winner: true,
        players: true,
        createdAt: true,
      },
      take: 5000,
    });

    const winsMap = new Map<string, { discordId: string; wins: number; matches: number }>();
    const matchesMap = new Map<string, number>();

    for (const record of records) {
      const winner = String(record.winner || "").trim();
      if (winner) {
        const current = winsMap.get(winner) || {
          discordId: winner,
          wins: 0,
          matches: 0,
        };
        current.wins += 1;
        winsMap.set(winner, current);
      }

      const players = Array.isArray(record.players) ? record.players : [];
      for (const player of players) {
        const discordId = String(player || "").trim();
        if (!discordId) continue;
        matchesMap.set(discordId, (matchesMap.get(discordId) || 0) + 1);
      }
    }

    const discordIds = [...new Set([...winsMap.keys(), ...matchesMap.keys()])];

    const users = discordIds.length
      ? await prisma.user.findMany({
          where: {
            discordId: {
              in: discordIds,
            },
          },
          select: {
            username: true,
            discordId: true,
            avatarUrl: true,
            status: true,
          },
        })
      : [];

    const usersMap = new Map(
      users
        .filter((user: { username: string | null; discordId: string | null }) => Boolean(user.discordId))
        .map((user: { username: string | null; discordId: string | null; avatarUrl: string | null; status: string | null }) => [
          user.discordId || "",
          {
            username: user.username || "",
            avatarUrl: user.avatarUrl ?? null,
            status: user.status ?? null,
          },
        ]),
    );

    const ranking = [...winsMap.values()]
      .filter((item) => usersMap.has(item.discordId))
      .map((item) => {
        const user = usersMap.get(item.discordId);
        return {
          discordId: item.discordId,
          username: user?.username || "",
          avatarUrl: user?.avatarUrl ?? null,
          status: user?.status ?? null,
          wins: item.wins,
          matches: matchesMap.get(item.discordId) || item.wins,
        };
      })
      .filter((item) => Boolean(item.username))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 99)
      .map((item, index) => ({
        position: index + 1,
        ...item,
      }));

    return {
      period,
      ranking,
    };
  },

  mediatorRanking: async (period: RankingPeriod) => {
    const startDate = startOfWindow(period);

    const whereClause = startDate
      ? {
          createdAt: {
            gte: startDate,
          },
        }
      : undefined;

    const records = await prisma.supervisorMatchRecord.findMany({
      ...(whereClause ? { where: whereClause } : {}),
      orderBy: {
        createdAt: "desc",
      },
      select: {
        mediatorId: true,
        mediatorName: true,
        mediatorRevenue: true,
        createdAt: true,
      },
      take: 5000,
    });

    const grouped = new Map<
      string,
      {
        mediatorId: string;
        mediatorName: string;
        totalRevenue: number;
        matches: number;
      }
    >();

    for (const record of records) {
      const mediatorId = String(record.mediatorId || "").trim();
      const mediatorName = String(record.mediatorName || "").trim() || "Não informado";

      if (!mediatorId) continue;

      const current = grouped.get(mediatorId) || {
        mediatorId,
        mediatorName,
        totalRevenue: 0,
        matches: 0,
      };

      current.totalRevenue += Number(record.mediatorRevenue || 0);
      current.matches += 1;

      grouped.set(mediatorId, current);
    }

    const ranking = [...grouped.values()]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 50)
      .map((item, index) => ({
        position: index + 1,
        ...item,
      }));

    return {
      period,
      ranking,
    };
  },
};