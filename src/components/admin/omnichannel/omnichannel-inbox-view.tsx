"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Phone,
  Send,
  UserCheck,
  RotateCcw,
  CheckCircle,
  FileText,
  CreditCard,
  Search,
  Bot,
  User,
  Clock,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

export function OmnichannelInboxView() {
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState<string>("");

  const utils = api.useUtils();

  const { data: conversations = [], isLoading: loadingConvs } = api.omnichannel.listConversations.useQuery({
    channel: selectedChannel,
    status: selectedStatus,
    search: searchQuery || undefined,
  });

  const { data: activeConv, isLoading: loadingActive } = api.omnichannel.getConversation.useQuery(
    { conversationId: selectedConvId! },
    { enabled: !!selectedConvId }
  );

  const sendMessageMutation = api.omnichannel.sendMessage.useMutation({
    onSuccess: () => {
      setMessageInput("");
      utils.omnichannel.getConversation.invalidate({ conversationId: selectedConvId! });
      utils.omnichannel.listConversations.invalidate();
    },
  });

  const takeoverMutation = api.omnichannel.takeoverConversation.useMutation({
    onSuccess: () => {
      utils.omnichannel.getConversation.invalidate({ conversationId: selectedConvId! });
      utils.omnichannel.listConversations.invalidate();
    },
  });

  const resolveMutation = api.omnichannel.resolveConversation.useMutation({
    onSuccess: () => {
      utils.omnichannel.getConversation.invalidate({ conversationId: selectedConvId! });
      utils.omnichannel.listConversations.invalidate();
    },
  });

  const sendBrochureMutation = api.omnichannel.sendWhatsAppBrochure.useMutation({
    onSuccess: () => {
      alert("Official brochure sent via WhatsApp!");
      utils.omnichannel.getConversation.invalidate({ conversationId: selectedConvId! });
    },
  });

  const handleSend = () => {
    if (!messageInput.trim() || !selectedConvId) return;
    sendMessageMutation.mutate({
      conversationId: selectedConvId,
      content: messageInput.trim(),
    });
  };

  // Auto-select first conversation
  React.useEffect(() => {
    if (!selectedConvId && conversations.length > 0) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, selectedConvId]);

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col gap-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Omnichannel Communications Inbox</h1>
            <Badge variant="outline" className="bg-lime-50 text-lime-700 border-lime-300">
              Live Real-Time
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            Unified WhatsApp Cloud API, AI Chatbot Counselor, and Outbound Voice transcripts linked to central Lead records.
          </p>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left List Column */}
        <div className="col-span-12 md:col-span-5 lg:col-span-4 flex flex-col border rounded-xl bg-white shadow-sm overflow-hidden">
          {/* Search & Filters */}
          <div className="p-3 border-b space-y-2 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
              {["ALL", "WHATSAPP", "WEB_CHAT", "VOICE_CALL"].map((ch) => (
                <button
                  key={ch}
                  onClick={() => setSelectedChannel(ch)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    selectedChannel === ch
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border"
                  }`}
                >
                  {ch === "ALL" ? "All Channels" : ch.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConvs ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No active conversations found.</div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                const lastMsg = conv.messages[0];
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-3.5 cursor-pointer transition-colors hover:bg-slate-50 ${
                      isSelected ? "bg-slate-100/80 border-l-4 border-l-cyan-600" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{conv.lead.fullName}</span>
                        {conv.channel === "WHATSAPP" && (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0 border-0">
                            WhatsApp
                          </Badge>
                        )}
                        {conv.channel === "WEB_CHAT" && (
                          <Badge className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0 border-0">
                            Web Chat
                          </Badge>
                        )}
                        {conv.channel === "VOICE_CALL" && (
                          <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0 border-0">
                            Voice Call
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-mono mt-0.5">{conv.lead.phone}</div>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-600 truncate max-w-[200px]">
                        {lastMsg ? lastMsg.content : "Conversation initiated"}
                      </p>
                      {conv.status === "NEEDS_HUMAN" && (
                        <Badge variant="destructive" className="text-[10px] px-1 py-0 animate-pulse">
                          Needs Human
                        </Badge>
                      )}
                      {conv.status === "AI_HANDLING" && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-purple-100 text-purple-700">
                          AI Handling
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Conversation Stream */}
        <div className="col-span-12 md:col-span-7 lg:col-span-8 flex flex-col border rounded-xl bg-white shadow-sm overflow-hidden">
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <MessageSquare className="h-12 w-12 stroke-1 mb-2 text-slate-300" />
              <p className="text-sm">Select a conversation from the left to view history and take action.</p>
            </div>
          ) : (
            <>
              {/* Conversation Top Action Bar */}
              <div className="p-3.5 border-b bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900">{activeConv.lead.fullName}</span>
                    <Badge variant="outline" className="text-xs">
                      {activeConv.lead.temperature || "WARM"} (Score: {activeConv.lead.leadScore || 50}/100)
                    </Badge>
                    <Badge className="bg-slate-800 text-white text-xs">{activeConv.channel}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                    <span>📱 {activeConv.lead.phone}</span>
                    <span>📧 {activeConv.lead.email}</span>
                    {activeConv.lead.course && <span>🎓 {activeConv.lead.course.title}</span>}
                  </div>
                </div>

                {/* Control Actions */}
                <div className="flex items-center gap-2">
                  {activeConv.status === "AI_HANDLING" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                      onClick={() => takeoverMutation.mutate({ conversationId: activeConv.id })}
                      disabled={takeoverMutation.isPending}
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1" /> Take Over from AI
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100"
                      onClick={() => resolveMutation.mutate({ conversationId: activeConv.id, returnToAi: true })}
                      disabled={resolveMutation.isPending}
                    >
                      <Bot className="h-3.5 w-3.5 mr-1" /> Return to AI
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    onClick={() => sendBrochureMutation.mutate({ leadId: activeConv.leadId })}
                    disabled={sendBrochureMutation.isPending}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" /> Send Brochure
                  </Button>
                </div>
              </div>

              {/* Message Transcript Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {activeConv.messages.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No message history recorded yet.</div>
                ) : (
                  activeConv.messages.map((m) => {
                    const isLead = m.senderType === "LEAD";
                    const isAi = m.senderType === "AI_AGENT";
                    const isTranscript = m.messageType === "TRANSCRIPT";

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isLead ? "items-start" : "items-end"}`}
                      >
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                          {isLead ? (
                            <>
                              <User className="h-3 w-3" />
                              <span>{activeConv.lead.fullName}</span>
                            </>
                          ) : isAi ? (
                            <>
                              <Bot className="h-3 w-3 text-purple-600" />
                              <span className="text-purple-700 font-medium">SoftLab AI Counselor</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3 w-3 text-blue-600" />
                              <span className="text-blue-700 font-medium">{m.senderName || "Counselor"}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>

                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                            isTranscript
                              ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-tr-none font-mono text-xs whitespace-pre-wrap"
                              : isLead
                              ? "bg-white border text-slate-900 rounded-tl-none"
                              : isAi
                              ? "bg-purple-600 text-white rounded-tr-none whitespace-pre-wrap"
                              : "bg-cyan-700 text-white rounded-tr-none whitespace-pre-wrap"
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Composer */}
              <div className="p-3 border-t bg-white flex items-center gap-2">
                <Input
                  placeholder={
                    activeConv.channel === "WHATSAPP"
                      ? "Type reply to send directly to lead via WhatsApp..."
                      : "Type message or note..."
                  }
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  className="bg-cyan-700 hover:bg-cyan-800 text-white"
                >
                  <Send className="h-4 w-4 mr-1.5" /> Send
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
