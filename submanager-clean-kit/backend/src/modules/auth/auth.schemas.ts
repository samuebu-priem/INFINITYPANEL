import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32),
  password: z.string().min(8).max(72),
  role: z.enum(["PLAYER", "ADMIN"]).default("PLAYER"),
  nickname: z.string().min(2).max(32).optional(),
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(3),
  password: z.string().min(8).max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
