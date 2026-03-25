import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("*"),
  WS_PATH: z.string().default("/ws"),
  DISCORD_BOT_TOKEN: z.string().optional(),
  DISCORD_GUILD_ID: z.string().optional(),

  // Payments (optional until real provider integration)
  PAYMENT_PROVIDER: z.enum(["MERCADO_PAGO"]).optional(),

  MERCADO_PAGO_PUBLIC_KEY: z.string().optional(),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().optional(),
  MERCADO_PAGO_WEBHOOK_URL: z.string().url().optional(),
  MERCADO_PAGO_PAYER_EMAIL: z.string().email().optional(),

  FRONTEND_CHECKOUT_SUCCESS_URL: z.string().url().optional(),
  FRONTEND_CHECKOUT_FAILURE_URL: z.string().url().optional(),
  FRONTEND_CHECKOUT_PENDING_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
