import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../shared/utils/ApiError.js";

type RecordSupervisorMatchInput = {
  players: string[];
  threadName: string;
  game: string;
  mode: string;
  winner: string;
  mediatorId: string;
  mediatorName: string;
  mediatorRevenue: number;
};

function normalizePlayers(players: unknown): string[] {
  if (!Array.isArray(players)) return [];
  return players
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function normalizeMoney(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

export const internalMatchesService = {
  record: async (input: RecordSupervisorMatchInput) => {
    const players = normalizePlayers(input.players);
    const threadName = String(input.threadName || "").trim();
    const game = String(input.game || "").trim();
    const mode = String(input.mode || "").trim();
    const winner = String(input.winner || "").trim();
    const mediatorId = String(input.mediatorId || "").trim();
    const mediatorName = String(input.mediatorName || "").trim();
    const mediatorRevenue = normalizeMoney(input.mediatorRevenue);

    if (!threadName) {
      throw new ApiError(400, "threadName is required");
    }

    if (!game) {
      throw new ApiError(400, "game is required");
    }

    if (!mode) {
      throw new ApiError(400, "mode is required");
    }

    if (!winner) {
      throw new ApiError(400, "winner is required");
    }

    if (!mediatorId) {
      throw new ApiError(400, "mediatorId is required");
    }

    if (!mediatorName) {
      throw new ApiError(400, "mediatorName is required");
    }

    if (players.length === 0) {
      throw new ApiError(400, "players is required");
    }

    const existing = await prisma.supervisorMatchRecord.findUnique({
      where: { threadName },
      select: { id: true },
    });

    if (existing) {
      const updated = await prisma.supervisorMatchRecord.update({
        where: { threadName },
        data: {
          game,
          mode,
          winner,
          mediatorId,
          mediatorName,
          mediatorRevenue,
          players,
        },
      });

      return {
        created: false,
        record: {
          id: updated.id,
          threadName: updated.threadName,
          mediatorId: updated.mediatorId,
          mediatorName: updated.mediatorName,
          mediatorRevenue: updated.mediatorRevenue.toString(),
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      };
    }

    const created = await prisma.supervisorMatchRecord.create({
      data: {
        threadName,
        game,
        mode,
        winner,
        mediatorId,
        mediatorName,
        mediatorRevenue,
        players,
      },
    });

    return {
      created: true,
      record: {
        id: created.id,
        threadName: created.threadName,
        mediatorId: created.mediatorId,
        mediatorName: created.mediatorName,
        mediatorRevenue: created.mediatorRevenue.toString(),
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
    };
  },
};