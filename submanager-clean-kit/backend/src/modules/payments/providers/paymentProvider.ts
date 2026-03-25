export type PaymentProvider = "MERCADO_PAGO";

export type CheckoutSessionStatus = "PENDING" | "OPEN" | "COMPLETED" | "EXPIRED" | "CANCELLED";

export type PaymentTransactionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED";

export type ProviderCreateCheckoutInput = {
  amount: string;
  currency: string;
  externalReference: string;
  expiresAt?: Date | undefined;
  metadata?: Record<string, unknown> | undefined;
};

export type ProviderCreateCheckoutOutput = {
  provider: PaymentProvider;
  status: CheckoutSessionStatus;

  externalCheckoutId?: string | null;
  checkoutUrl?: string | null;

  // PIX-related (nullable until integrated)
  qrCode?: string | null;
  qrCodeBase64?: string | null;

  paymentMethod?: string | null;
  expiresAt?: Date | null;
  raw?: unknown;
};

export type ProviderParseWebhookOutput = {
  provider: PaymentProvider;
  externalPaymentId?: string | null;
  externalCheckoutId?: string | null;
  status: PaymentTransactionStatus;
  approvedAt?: Date | null;
  raw?: unknown;
};

export interface PaymentProviderClient {
  provider: PaymentProvider;

  createCheckout(input: ProviderCreateCheckoutInput): Promise<ProviderCreateCheckoutOutput>;

  /**
   * Placeholder for future real webhook parsing/verification.
   * For now, returns a safe structured object and NEVER auto-approves.
   */
  parseWebhook(_headers: Record<string, string | string[] | undefined>, _body: unknown): Promise<ProviderParseWebhookOutput>;
}
