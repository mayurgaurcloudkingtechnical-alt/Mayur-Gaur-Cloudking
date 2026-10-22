import { EventEmitter } from "events";

export type CrmEventType =
  | "LEAD_CREATED"
  | "LEAD_UPDATED"
  | "LEAD_ASSIGNED"
  | "CALL_LOGGED"
  | "STATUS_CHANGED"
  | "BULK_IMPORT_COMPLETED";

export interface CrmLiveEvent {
  id: string;
  type: CrmEventType;
  timestamp: string; // ISO UTC string
  leadId?: string;
  actorId?: string;
  actorName?: string;
  recipientUserIds?: string[]; // If empty or undefined, visible to all authorized management
  payload: Record<string, any>;
}

class CrmEventBusService extends EventEmitter {
  constructor() {
    super();
    // Allow up to 100 concurrent listeners
    this.setMaxListeners(100);
  }

  /**
   * Publishes a live CRM event to all subscribed listeners
   */
  public publish(event: Omit<CrmLiveEvent, "id" | "timestamp">) {
    const fullEvent: CrmLiveEvent = {
      ...event,
      id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    this.emit("crm_event", fullEvent);
    this.emit(event.type, fullEvent);
    return fullEvent;
  }

  /**
   * Subscribe to all CRM events
   */
  public onEvent(callback: (event: CrmLiveEvent) => void) {
    this.on("crm_event", callback);
    return () => this.off("crm_event", callback);
  }
}

// Global singleton instance across Next.js invocations
const globalForCrmEventBus = globalThis as unknown as {
  crmEventBus?: CrmEventBusService;
};

export const crmEventBus =
  globalForCrmEventBus.crmEventBus ?? new CrmEventBusService();

if (process.env.NODE_ENV !== "production") {
  globalForCrmEventBus.crmEventBus = crmEventBus;
}
