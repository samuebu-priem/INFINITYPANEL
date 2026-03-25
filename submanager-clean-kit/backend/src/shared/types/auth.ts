import type { User } from "@prisma/client";

export type Role = User["role"];

export type JwtPayload = {
  sub: string;
  role: Role;
};

export type AuthUser = {
  id: string;
  role: Role;
};
