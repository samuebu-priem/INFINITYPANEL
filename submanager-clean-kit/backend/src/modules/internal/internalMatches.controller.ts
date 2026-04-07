import { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";

const normalizeThreadName = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/\s+/g, " ");
};

const normalizeQueueId = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
};

const extractQueueBase = (value: string): string => {
  const normalized = normalizeThreadName(value);
  return normalized.replace(/\s*\(([^)]+)\)\s*$/, "").trim();
};

const buildMatchSelect = () => ({
  id: true,
  queueId: true,
  player1Id: true,
  player2Id: true,
  adminId: true,
  mode: true,
  amount: true,
  adminFee: true,
  status: true,
  paymentStatus: true,
  winnerId: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  queue: {
    select: {
      id: true,
      notes: true,
      createdAt: true,
      acceptedAt: true,
      expiresAt: true,
    },
  },
  admin: {
    select: {
      id: true,
      username: true,
      discordId: true,
    },
  },
  player1: {
    select: {
      id: true,
      username: true,
      discordId: true,
    },
  },
  player2: {
    select: {
      id: true,
      username: true,
      discordId: true,
    },
  },
  winner: {
    select: {
      id: true,
      username: true,
      discordId: true,
    },
  },
}) as const;

export const internalMatchesController = {
  getByThreadName: async (req: Request, res: Response) => {
    const threadName = normalizeThreadName(req.query.threadName);
    const queueBase = extractQueueBase(threadName);

    if (!threadName) {
      res.status(400).json({ message: "Missing threadName" });
      return;
    }

    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { queue: { id: threadName } },
          { queue: { id: queueBase } },
          { queue: { notes: { contains: threadName, mode: "insensitive" } } },
          { queue: { notes: { contains: queueBase, mode: "insensitive" } } },
          { queue: { notes: { contains: threadName.replace(/^\s*fila-?\s*/i, ""), mode: "insensitive" } } },
          { queue: { notes: { contains: queueBase.replace(/^\s*fila-?\s*/i, ""), mode: "insensitive" } } },
        ],
      },
      select: buildMatchSelect(),
    });

    if (!match) {
      res.status(404).json({ message: "Match not found" });
      return;
    }

    res.json({ match });
  },
};
