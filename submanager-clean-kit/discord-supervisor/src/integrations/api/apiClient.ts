export type MatchRecord = {
  threadName?: string;
  game?: string;
  mode?: string;
  closedBy?: string;
  initialValue?: number;
  mediator?: string;
  players?: string[];
  winner?: string;
  durationSeconds?: number;
  mediatorRevenue?: number;
  status?: string;
};

type ApiClientOptions = {
  baseUrl: string;
  token?: string;
};

type InternalMatchResponse = {
  match?: {
    queueId?: string;
    player1Id?: string;
    player2Id?: string;
    adminId?: string;
    mode?: string;
    amount?: unknown;
    adminFee?: unknown;
    status?: string;
    paymentStatus?: string;
    winnerId?: string | null;
    startedAt?: string | Date | null;
    completedAt?: string | Date | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    queue?: { id?: string; notes?: string | null };
    admin?: { id?: string; username?: string | null; discordId?: string | null };
    player1?: { id?: string; username?: string | null; discordId?: string | null };
    player2?: { id?: string; username?: string | null; discordId?: string | null };
    winner?: { id?: string; username?: string | null; discordId?: string | null } | null;
  };
};

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  private async request(path: string): Promise<unknown> {
    const url = new URL(path, this.options.baseUrl).toString();
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...(this.options.token ? { Authorization: `Bearer ${this.options.token}` } : {})
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const rawBody = await response.text();

    if (!response.ok) {
      throw new Error(`API request failed (${response.status}) for ${path}: ${rawBody.slice(0, 200)}`);
    }

    if (!contentType.toLowerCase().includes('application/json')) {
      throw new Error(`API returned non-JSON content for ${path}: ${contentType || 'unknown content-type'} | body=${rawBody.slice(0, 200)}`);
    }

    try {
      return JSON.parse(rawBody);
    } catch (error) {
      throw new Error(`API returned invalid JSON for ${path}: ${(error as Error).message} | body=${rawBody.slice(0, 200)}`);
    }
  }

  async getMatchByThreadName(threadName: string): Promise<MatchRecord | null> {
    const lookupThreadName = threadName.replace(/\s+/g, ' ').trim();
    const payload = (await this.request(`/internal/matches/by-thread-name?threadName=${encodeURIComponent(lookupThreadName)}`)) as InternalMatchResponse;

    if (!payload?.match) return null;

    const match = payload.match;

    return {
      threadName: typeof match.queue?.id === "string" ? match.queue.id : lookupThreadName,
      game: match.mode,
      mode: match.mode,
      closedBy: match.admin?.username ?? match.adminId,
      initialValue: typeof match.amount === "number" ? match.amount : Number(match.amount ?? 0),
      mediator: match.admin?.username ?? match.adminId,
      players: [match.player1?.username ?? match.player1Id, match.player2?.username ?? match.player2Id].filter(Boolean) as string[],
      winner: match.winner?.username ?? match.winnerId ?? undefined,
      durationSeconds: undefined,
      mediatorRevenue: typeof match.adminFee === "number" ? match.adminFee : Number(match.adminFee ?? 0),
      status: match.status,
    };
  }
}
