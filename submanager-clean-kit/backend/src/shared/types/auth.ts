export type Role = "OWNER" | "ADMIN" | "PLAYER";

export type JwtPayload = {
  sub: string;
  role: Role;
};

export type AuthUser = {
  id: string;
  role: Role;
};
