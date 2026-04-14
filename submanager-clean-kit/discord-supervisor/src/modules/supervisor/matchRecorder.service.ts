type RecordMatchPayload = {
  players: string[];
  threadName: string;
  game: string;
  mode: string;
  winner: string;
  mediatorId: string;
  mediatorName: string;
  mediatorRevenue: number;
};

type MatchRecorderServiceOptions = {
  internalApiUrl?: string;
  internalApiToken?: string;
};

export class MatchRecorderService {
  constructor(private readonly options: MatchRecorderServiceOptions = {}) {}

  async recordMatch(payload: RecordMatchPayload) {
    console.log("📊 MATCH RECORDED");
    console.log("thread:", payload.threadName);
    console.log("mediator:", payload.mediatorName);
    console.log("match profit:", payload.mediatorRevenue);

    const response = await this.sendToBackend(payload);

    return {
      ok: true,
      backend: response,
    };
  }

  private async sendToBackend(payload: RecordMatchPayload) {
    const baseUrl = this.options.internalApiUrl || process.env.INTERNAL_API_URL;
    const token = this.options.internalApiToken || process.env.INTERNAL_API_TOKEN;

    if (!baseUrl) {
      console.warn("API_BASE_URL not configured. Skipping backend sync.");
      return null;
    }

    if (!token) {
      console.warn("INTERNAL_API_TOKEN not configured. Skipping backend sync.");
      return null;
    }

    try {
      const res = await fetch(`${baseUrl}/api/internal/matches/record`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      const body = contentType.includes("application/json")
        ? await res.json()
        : await res.text();

      if (!res.ok) {
        console.error("Backend sync failed:", {
          status: res.status,
          body,
        });
        return null;
      }

      console.log("✅ Backend sync success:", body);
      return body;
    } catch (error) {
      console.error("Erro ao enviar pro backend:", error);
      return null;
    }
  }
}