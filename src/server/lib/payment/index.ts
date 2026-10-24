import { PaymentGateway } from "./gateway.interface";
import { RazorpayProvider } from "./razorpay.provider";
import { StripeProvider } from "./stripe.provider";

let stripeInstance: StripeProvider | null = null;
let razorpayInstance: RazorpayProvider | null = null;

export function getStripeProvider(): StripeProvider {
  if (!stripeInstance) {
    stripeInstance = new StripeProvider();
  }
  return stripeInstance;
}

export function getRazorpayProvider(): RazorpayProvider {
  if (!razorpayInstance) {
    razorpayInstance = new RazorpayProvider();
  }
  return razorpayInstance;
}

/**
 * Returns the authoritative payment gateway according to priority and configuration.
 * SoftLab Global Indian Rupee (INR) priority: RAZORPAY -> STRIPE -> Fallback
 */
export function getPaymentGateway(preferred?: "STRIPE" | "RAZORPAY" | "AUTO"): PaymentGateway {
  const stripe = getStripeProvider();
  const razorpay = getRazorpayProvider();

  const providerEnv = (process.env.PAYMENT_PROVIDER || "RAZORPAY").toUpperCase();
  const target = (preferred && preferred !== "AUTO") ? preferred : providerEnv;

  if (target === "STRIPE") {
    if (stripe.isConfigured()) return stripe;
    return razorpay;
  }

  // Primary gateway: Razorpay
  return razorpay;
}

export function getPaymentGatewaysStatus() {
  const stripe = getStripeProvider();
  const razorpay = getRazorpayProvider();
  const activeGateway = getPaymentGateway();

  return {
    activeProvider: activeGateway.providerName,
    stripe: {
      provider: "STRIPE",
      configured: stripe.isConfigured(),
      publishableKey: stripe.getPublishableKey() ? "Configured" : "Missing",
      hasSecretKey: Boolean(stripe.getSecretKey()),
      hasWebhookSecret: Boolean(stripe.getWebhookSecret()),
      status: stripe.isConfigured() ? "CONNECTED" : "NOT_CONFIGURED",
    },
    razorpay: {
      provider: "RAZORPAY",
      configured: razorpay.isConfigured(),
      keyId: razorpay.getPublicConfig().keyId ? "Configured" : "Missing",
      status: razorpay.isConfigured() ? "CONNECTED" : "NOT_CONFIGURED",
    },
  };
}

export * from "./gateway.interface";
export * from "./razorpay.provider";
export * from "./stripe.provider";

