import { PaymentGateway } from "./gateway.interface";
import { RazorpayProvider } from "./razorpay.provider";

let instance: PaymentGateway | null = null;

export function getPaymentGateway(): PaymentGateway {
  if (!instance) {
    instance = new RazorpayProvider();
  }
  return instance;
}

export * from "./gateway.interface";
export * from "./razorpay.provider";
