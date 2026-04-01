import type { Role as PrismaRole } from "@prisma/client";

export type Role = PrismaRole;

export type JwtPayload = {
  sub: string;
  role: Role;
};

export type AuthUser = {
  id: string;
  role: Role;
};
