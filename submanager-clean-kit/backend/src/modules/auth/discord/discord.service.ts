import crypto from "crypto";

import { env } from "../../../config/env.js";
import { prisma } from "../../../config/prisma.js";
import { ApiError } from "../../../shared/utils/ApiError.js";

type DiscordTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

type DiscordUserResponse = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
};

function normalizeText(value: unknown): string | null {
  const text = String(value || "").trim();
  return text ? text : null;
}

function normalizeDiscordId(value: unknown): string | null {
  const text = String(value || "").trim();
  return text ? text : null;
}

function getDiscordRedirectUri(): string {
  if (process.env.DISCORD_REDIRECT_URI) {
    return process.env.DISCORD_REDIRECT_URI;
  }

  const baseUrl =
    normalizeText(process.env.BACKEND_URL) ||
    normalizeText(process.env.PUBLIC_BACKEND_URL);

  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, "")}/api/auth/discord/callback`;
  }

  throw new Error("DISCORD_REDIRECT_URI ou BACKEND_URL não configurado");
}

function getDiscordClientConfig() {
  const clientId = normalizeText(process.env.DISCORD_CLIENT_ID);
  const clientSecret = normalizeText(process.env.DISCORD_CLIENT_SECRET);

  if (!clientId || !clientSecret) {
    throw new ApiError(500, "Discord OAuth is not configured");
  }

  return { clientId, clientSecret };
}

async function exchangeCodeForToken(code: string) {
  const { clientId, clientSecret } = getDiscordClientConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: getDiscordRedirectUri(),
  });

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new ApiError(400, "Failed to exchange Discord authorization code", {
      payload,
    });
  }

  return (await response.json()) as DiscordTokenResponse;
}

async function fetchDiscordMe(accessToken: string) {
  const response = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new ApiError(400, "Failed to fetch Discord profile", { payload });
  }

  return (await response.json()) as DiscordUserResponse;
}

async function fetchDiscordGuildNick(accessToken: string): Promise<string | null> {
  if (!env.DISCORD_GUILD_ID) {
    return null;
  }

  if (!env.DISCORD_BOT_TOKEN) {
    return null;
  }

  const response = await fetch(`https://discord.com/api/guilds/${env.DISCORD_GUILD_ID}/members/@me`, {
    headers: {
      Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { nick?: string | null };

  return normalizeText(payload.nick);
}

async function upsertDiscordProfile(userId: string, discordUser: DiscordUserResponse, guildNick: string | null) {
  const discordId = normalizeDiscordId(discordUser.id);

  if (!discordId) {
    throw new ApiError(400, "Discord account is invalid");
  }

  const existingOwner = await prisma.user.findFirst({
    where: {
      discordId,
      NOT: {
        id: userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingOwner) {
    throw new ApiError(409, "This Discord account is already linked to another user");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      discordId,
      discordUsername: normalizeText(discordUser.username),
      discordGlobalName: normalizeText(discordUser.global_name),
      discordAvatar: normalizeText(discordUser.avatar),
      discordGuildNick: guildNick,
      discordConnectedAt: new Date(),
    },
    select: {
      id: true,
      discordId: true,
      discordUsername: true,
      discordGlobalName: true,
      discordAvatar: true,
      discordGuildNick: true,
      discordConnectedAt: true,
      username: true,
    },
  });

  return updated;
}

export const discordAuthService = {
  getAuthorizationUrl() {
    const { clientId } = getDiscordClientConfig();
    const redirectUri = getDiscordRedirectUri();
    const state = crypto.randomBytes(24).toString("hex");
    const scope = ["identify", "guilds.members.read"].join(" ");

    const url = new URL("https://discord.com/api/oauth2/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scope);
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);

    return {
      url: url.toString(),
      state,
    };
  },

  async connectFromCode(userId: string, code: string) {
    if (!normalizeText(code)) {
      throw new ApiError(400, "code is required");
    }

    const token = await exchangeCodeForToken(code);
    const discordUser = await fetchDiscordMe(token.access_token);
    const guildNick = await fetchDiscordGuildNick(token.access_token);

    const profile = await upsertDiscordProfile(userId, discordUser, guildNick);

    return {
      success: true,
      profile,
      discord: {
        connected: true,
        guildNick,
        tokenType: token.token_type,
        scope: token.scope,
      },
    };
  },

  async refresh(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        discordId: true,
        discordUsername: true,
        discordGlobalName: true,
        discordAvatar: true,
        discordGuildNick: true,
        discordConnectedAt: true,
      },
    });

    if (!user?.discordId) {
      throw new ApiError(400, "Discord account is not connected");
    }

    return {
      success: true,
      discord: {
        discordId: user.discordId,
        discordUsername: user.discordUsername ?? null,
        discordGlobalName: user.discordGlobalName ?? null,
        discordAvatar: user.discordAvatar ?? null,
        discordGuildNick: user.discordGuildNick ?? null,
        discordConnectedAt: user.discordConnectedAt ?? null,
      },
    };
  },

  async disconnect(userId: string) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        discordId: null,
        discordUsername: null,
        discordGlobalName: null,
        discordAvatar: null,
        discordGuildNick: null,
        discordConnectedAt: null,
      },
      select: {
        id: true,
      },
    });

    return {
      success: true,
      userId: updated.id,
    };
  },

  async callback(userId: string, code: string) {
    return this.connectFromCode(userId, code);
  },
};