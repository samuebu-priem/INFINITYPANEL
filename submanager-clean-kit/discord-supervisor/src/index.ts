declare const process: {
  env: Record<string, string | undefined>;
  exit(code?: number): never;
  on(event: 'SIGINT' | 'SIGTERM', listener: () => void): void;
};

import { config as dotenvConfig } from 'dotenv';
import { ApiClient } from './integrations/api/apiClient';
import { DiscordSupervisorClient } from './discord/client';
import { ParserService } from './modules/supervisor/parser.service';
import { ValidatorService } from './modules/supervisor/validator.service';

dotenvConfig();

const requiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const token = requiredEnv('DISCORD_BOT_TOKEN');
const logChannelId = requiredEnv('DISCORD_LOG_CHANNEL_ID');
const alertChannelId = requiredEnv('STAFF_ALERT_CHANNEL_ID');
const apiBaseUrl = requiredEnv('API_BASE_URL');
const apiToken = process.env.API_TOKEN?.trim() || undefined;
const sendStartupMessage = process.env.SUPERVISOR_SEND_STARTUP_MESSAGE?.trim() === 'true';

const apiClient = new ApiClient({ baseUrl: apiBaseUrl, token: apiToken });
const parserService = new ParserService();
const validatorService = new ValidatorService();

const client = new DiscordSupervisorClient({
  token,
  logChannelId,
  alertChannelId,
  apiClient,
  parserService,
  validatorService,
  sendStartupMessage
});

const shutdown = async () => {
  try {
    await client.stop();
  } finally {
    process.exit(0);
  }
};

client.start().catch((error) => {
  console.error('Failed to start Discord supervisor:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  void shutdown();
});

process.on('SIGTERM', () => {
  void shutdown();
});
