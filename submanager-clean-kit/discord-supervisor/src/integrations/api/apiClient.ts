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
    const payload = await this.request(`/matches?threadName=${encodeURIComponent(threadName)}`);

    if (Array.isArray(payload)) {
      return (payload.find((item) => {
        const record = item as MatchRecord;
        return typeof record.threadName === 'string' && record.threadName.trim().toLowerCase() === threadName.trim().toLowerCase();
      }) as MatchRecord | undefined) ?? null;
    }

    if (payload && typeof payload === 'object') {
      const record = payload as MatchRecord;
      if (typeof record.threadName === 'string') return record;
    }

    return null;
  }
}
