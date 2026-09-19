/**
 * SOFTLAB GLOBAL — Payment Gateway Interface
 * Decouples online payments from vendor-specific implementations (e.g. Razorpay, Stripe).
 * All monetary amounts are handled strictly in integer Paise.
 */

export interface CreateOrderParams {
  amount: number; // in integer Paise
  currency?: string; // Default: "INR"
  receipt: string; // Unique order reference
  notes?: Record<string, string>;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  successUrl?: string;
  cancelUrl?: string;
  description?: string;
}

export interface GatewayOrderResult {
  orderId: string;
  amount: number; // in Paise
  currency: string;
  receipt: string;
  provider: string;
  checkoutUrl?: string;
  clientSecret?: string;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface VerifyWebhookParams {
  rawBody: string;
  signature: string;
}

export interface PaymentGateway {
  readonly providerName: string;
  isConfigured(): boolean;
  createOrder(params: CreateOrderParams): Promise<GatewayOrderResult>;
  verifyPaymentSignature(params: VerifyPaymentParams): boolean;
  verifyWebhookSignature(params: VerifyWebhookParams): boolean;
  fetchPayment(paymentId: string): Promise<Record<string, unknown> | null>;
}
