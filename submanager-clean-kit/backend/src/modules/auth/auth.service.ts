import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import type { Role } from "../../shared/types/auth.js";
import { ApiError } from "../../shared/utils/ApiError.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

type PublicUser = {
  id: string;
  email: string;
  username: string;
  role: Role;
  discordId: string | null;
  createdAt: Date;
  updatedAt: Date;
  playerProfile?: { nickname: string } | null;
  adminProfile?: { isActive: boolean } | null;
};

const toPublicUser = (user: {
  id: string;
  email: string;
  username: string;
  role: Role;
  discordId: string | null;
  createdAt: Date;
  updatedAt: Date;
  playerProfile?: { nickname: string } | null;
  adminProfile?: { isActive: boolean } | null;
}): PublicUser => user;

const signAccessToken = (user: { id: string; role: Role }) => {
  const options: jwt.SignOptions = {};
  options.expiresIn = env.JWT_EXPIRES_IN as unknown as Exclude<
    jwt.SignOptions["expiresIn"],
    undefined
  >;

  return jwt.sign(
    { sub: user.id, role: user.role },
    env.JWT_SECRET as jwt.Secret,
    options,
  );
};

export const authService = {
  async register(input: RegisterInput) {
    const email = input.email.toLowerCase().trim();
    const username = input.username.trim();

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
      select: { id: true },
    });

    if (existing) {
      throw new ApiError(409, "Email or username already in use");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const data = {
      email,
      username,
      passwordHash,
      role: input.role,
      ...(input.role === "PLAYER"
        ? {
            playerProfile: {
              create: {
                nickname: input.nickname ?? username,
              },
            },
          }
        : {}),
      ...(input.role === "ADMIN"
        ? {
            adminProfile: {
              create: {
                // org can configure fee later; default conservative fee
                weeklyFee: "0",
                isActive: false,
              },
            },
          }
        : {}),
    };

    const created = await prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        discordId: true,
        createdAt: true,
        updatedAt: true,
        playerProfile: { select: { nickname: true } },
        adminProfile: { select: { isActive: true } },
      },
    });

    const accessToken = signAccessToken({ id: created.id, role: created.role });

    return {
      user: toPublicUser(created),
      accessToken,
    };
  },

  async login(input: LoginInput) {
    const key = input.emailOrUsername.trim();
    const maybeEmail = key.includes("@") ? key.toLowerCase() : undefined;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          maybeEmail ? { email: maybeEmail } : undefined,
          { username: key },
        ].filter(Boolean) as Array<Record<string, unknown>>,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        passwordHash: true,
        discordId: true,
        createdAt: true,
        updatedAt: true,
        playerProfile: { select: { nickname: true } },
        adminProfile: { select: { isActive: true } },
      },
    });

    if (!user) throw new ApiError(401, "Invalid credentials");

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new ApiError(401, "Invalid credentials");

    const accessToken = signAccessToken({ id: user.id, role: user.role });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...safe } = user;

    return {
      user: toPublicUser(safe),
      accessToken,
    };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        discordId: true,
        createdAt: true,
        updatedAt: true,
        playerProfile: { select: { nickname: true } },
        adminProfile: { select: { isActive: true } },
      },
    });

    if (!user) throw new ApiError(404, "User not found");

    return toPublicUser(user);
  },
};
