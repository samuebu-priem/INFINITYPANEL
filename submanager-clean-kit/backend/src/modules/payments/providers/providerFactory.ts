import { env } from "../../../config/env.js";
import { MercadoPagoProvider } from "./mercadoPagoProvider.js";
import type { PaymentProviderClient } from "./paymentProvider.js";

export function getPaymentProvider(): PaymentProviderClient {
  const provider = env.PAYMENT_PROVIDER ?? "MERCADO_PAGO";

  switch (provider) {
    case "MERCADO_PAGO":
      return new MercadoPagoProvider();
    default:
      // Exhaustiveness guard for future providers
      return new MercadoPagoProvider();
  }
}
