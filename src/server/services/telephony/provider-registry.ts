import { TelephonyProviderAdapter, SupportedTelephonyProvider, ProviderHealthStatus } from "./types";
import { GenericCdrAdapter } from "./adapters/generic.adapter";
import { ExotelAdapter } from "./adapters/exotel.adapter";
import { TwilioAdapter } from "./adapters/twilio.adapter";

export class TelephonyProviderRegistry {
  private static adapters: Map<string, TelephonyProviderAdapter> = new Map();

  static {
    this.registerAdapter(new GenericCdrAdapter());
    this.registerAdapter(new ExotelAdapter());
    this.registerAdapter(new TwilioAdapter());
  }

  static registerAdapter(adapter: TelephonyProviderAdapter): void {
    this.adapters.set(adapter.providerName.toUpperCase(), adapter);
  }

  static getAdapter(providerName: string): TelephonyProviderAdapter | null {
    return this.adapters.get(providerName.toUpperCase()) || null;
  }

  static getAllAdapters(): TelephonyProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  static getSupportedProviders(): string[] {
    return Array.from(this.adapters.keys());
  }

  static getFleetHealth(): ProviderHealthStatus[] {
    return this.getAllAdapters().map((a) => a.getHealthStatus());
  }
}
