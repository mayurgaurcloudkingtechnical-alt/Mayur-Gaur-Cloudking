import { ExtractedCallResult } from "../ai-calling-agent.service";

export interface OutboundCallRequest {
  queueItemId: string;
  batchId: string;
  callerId?: string;
  leadName?: string;
  phone: string;
  courseTitle?: string;
  language?: string;
  openingScript?: string;
  systemPrompt?: string;
  webhookUrl?: string;
}

export interface OutboundCallResponse {
  success: boolean;
  providerCallId: string;
  status: "INITIATED" | "RINGING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "BUSY" | "NO_ANSWER";
  error?: string;
  result?: ExtractedCallResult;
}

export interface VoiceProviderAdapter {
  providerName: string;
  makeCall(request: OutboundCallRequest): Promise<OutboundCallResponse>;
  terminateCall(providerCallId: string): Promise<boolean>;
  getCallStatus(providerCallId: string): Promise<string>;
}
