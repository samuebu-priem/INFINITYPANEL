export type Role = "USER" | "ADMIN" | "OWNER";

export type JwtPayload = {
  sub: string;
  role: Role;
};

export type AuthUser = {
  id: string;
  role: Role;
};
