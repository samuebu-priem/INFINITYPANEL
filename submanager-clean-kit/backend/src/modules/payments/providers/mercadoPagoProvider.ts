import { env } from "../../../config/env.js";
import { ApiError } from "../../../shared/utils/ApiError.js";
import type {
  PaymentProviderClient,
  ProviderCreateCheckoutInput,
  ProviderCreateCheckoutOutput,
  ProviderParseWebhookOutput,
} from "./paymentProvider.js";

type MercadoPagoPaymentCreateResponse = {
  id?: number | string;
  status?: string;
  status_detail?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
};

function mapMpStatusToCheckoutStatus(mpStatus?: string): ProviderCreateCheckoutOutput["status"] {
  // When creating a PIX payment, Mercado Pago typically returns `pending`.
  // We'll treat `pending` as OPEN checkout session.
  if (!mpStatus) return "OPEN";
  if (mpStatus === "approved") return "COMPLETED";
  if (mpStatus === "cancelled") return "CANCELLED";
  if (mpStatus === "rejected") return "CANCELLED";
  if (mpStatus === "expired") return "EXPIRED";
  return "OPEN";
}

/**
 * Minimal Mercado Pago PIX implementation.
 * - Creates a Payment with `payment_method_id=pix`
 * - Returns QR Code + ticket URL for client display
 *
 * Webhook verification can be added later via `MERCADO_PAGO_WEBHOOK_SECRET`.
 */
export class MercadoPagoProvider implements PaymentProviderClient {
  public readonly provider = "MERCADO_PAGO" as const;

  async createCheckout(input: ProviderCreateCheckoutInput): Promise<ProviderCreateCheckoutOutput> {
    const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return {
        provider: this.provider,
        status: "PENDING",
        externalCheckoutId: null,
        checkoutUrl: null,
        qrCode: null,
        qrCodeBase64: null,
        paymentMethod: "PIX",
        expiresAt: input.expiresAt ?? null,
        raw: { reason: "MERCADO_PAGO_ACCESS_TOKEN_MISSING" },
      };
    }

    // Lazy import so dev envs without the dep don't break compilation until used.
    // We'll add the dependency in backend/package.json next.
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const mp = (await import("mercadopago")) as unknown as {
      MercadoPagoConfig: new (opts: { accessToken: string }) => unknown;
      Payment: new (client: unknown) => {
        create: (args: { body: Record<string, unknown> }) => Promise<{ id?: unknown; status?: unknown } & MercadoPagoPaymentCreateResponse>;
      };
    };

    try {
      const client = new mp.MercadoPagoConfig({ accessToken });
      const payment = new mp.Payment(client);

      const amount = Number(input.amount);
      if (!Number.isFinite(amount) || amount <= 0) throw new ApiError(400, "Invalid amount");

      const payerEmail = (env as any).MERCADO_PAGO_PAYER_EMAIL as string | undefined;
      const notificationUrl = (env as any).MERCADO_PAGO_WEBHOOK_URL as string | undefined;

      // Mercado Pago requires `payer` for PIX payments. If you don't provide it, you'll get:
      // "payer_cannot_be_nil".
      //
      // Prefer: env.MERCADO_PAGO_PAYER_EMAIL
      // Fallback: email from metadata (if provided by the caller)
      // Last resort: a safe test email (dev only)
      const payerFromMetadata = (input.metadata as any)?.payerEmail as string | undefined;
      const effectivePayerEmail =
        (payerEmail && payerEmail.trim()) ||
        (payerFromMetadata && payerFromMetadata.trim()) ||
        "test@example.com";

      const resp = await payment.create({
        body: {
          transaction_amount: amount,
          description: "Subscription payment",
          payment_method_id: "pix",
          external_reference: input.externalReference,
          notification_url: notificationUrl || undefined, // set when you expose a public URL (ngrok)
          metadata: input.metadata ?? {},
          payer: { email: effectivePayerEmail },
        },
      });

      // eslint-disable-next-line no-console
      console.log("[mercadopago] payment.create response keys", Object.keys(resp || {}));
      // eslint-disable-next-line no-console
      console.log("[mercadopago] point_of_interaction", resp?.point_of_interaction);

      const externalPaymentId = resp?.id ? String(resp.id) : null;
      const ticketUrl = resp?.point_of_interaction?.transaction_data?.ticket_url ?? null;
      const qrCode = resp?.point_of_interaction?.transaction_data?.qr_code ?? null;
      const qrCodeBase64 = resp?.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;

      return {
        provider: this.provider,
        status: mapMpStatusToCheckoutStatus(resp?.status),
        externalCheckoutId: externalPaymentId,
        checkoutUrl: ticketUrl,
        qrCode,
        qrCodeBase64,
        paymentMethod: "PIX",
        expiresAt: input.expiresAt ?? null,
        raw: resp,
      };
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status;
      const data = err?.cause ?? err?.response?.data ?? err?.message;

      // Log full details server-side (token is not logged)
      // eslint-disable-next-line no-console
      console.error("Mercado Pago createCheckout error", {
        status,
        message: err?.message,
        cause: err?.cause,
        response: err?.response?.data,
      });

      const detail =
        typeof data === "string"
          ? data
          : data
            ? JSON.stringify(data)
            : err?.message ?? "unknown error";

      throw new ApiError(
        502,
        `Mercado Pago createCheckout failed${status ? ` (status ${status})` : ""}: ${detail}`,
      );
    }
  }

  async parseWebhook(
    _headers: Record<string, string | string[] | undefined>,
    body: unknown,
  ): Promise<ProviderParseWebhookOutput> {
    // TODO: Verify webhook signature (when MERCADO_PAGO_WEBHOOK_SECRET is configured)
    // and fetch payment details from MP if needed.

    // For now: safe parsing only (no auto-approve) unless payload clearly says approved.
    const b = body as any;

    const paymentId =
      b?.data?.id ?? b?.id ?? b?.resource?.split?.("/")?.pop?.() ?? null;

    const status = b?.status ?? b?.data?.status ?? null;

    const normalized =
      status === "approved"
        ? "APPROVED"
        : status === "rejected"
          ? "REJECTED"
          : status === "cancelled"
            ? "CANCELLED"
            : status === "expired"
              ? "EXPIRED"
              : "PENDING";

    return {
      provider: this.provider,
      status: normalized,
      externalPaymentId: paymentId ? String(paymentId) : null,
      externalCheckoutId: null,
      approvedAt: normalized === "APPROVED" ? new Date() : null,
      raw: body,
    };
  }
}
