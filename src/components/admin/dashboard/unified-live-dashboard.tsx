"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  RefreshCw,
  Radio,
  ExternalLink,
  Globe,
  Instagram,
  PhoneCall,
  CreditCard,
  BookOpen,
  Award,
  Users,
  Briefcase,
  Shield,
  Sparkles,
  Filter,
  Clock,
  ArrowRight,
  Zap,
  Play,
  Pause,
  IndianRupee,
} from "lucide-react";
import { PlatformHealthItem, LiveStreamEvent } from "@/server/services/live-tracking.service";

export function UnifiedLiveDashboard() {
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(10);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const utils = api.useUtils();

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = api.dashboard.getLiveTrackingData.useQuery(undefined, {
    refetchInterval: refreshIntervalSec > 0 ? refreshIntervalSec * 1000 : false,
    refetchOnWindowFocus: true,
  });

  const simulateMutation = api.dashboard.simulateEvent.useMutation({
    onSuccess: (res: any) => {
      setFeedbackMessage({
        text: `Live test ping broadcasted to ${res.platform || "Platform"}! Ingested into live tracking feed.`,
        type: "success",
      });
      utils.dashboard.getLiveTrackingData.invalidate();
    },
    onError: (err) => {
      setFeedbackMessage({
        text: `Simulation failed: ${err.message}`,
        type: "error",
      });
    },
  });

  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const platforms: PlatformHealthItem[] = data?.platforms || [];
  const rawEvents: LiveStreamEvent[] = data?.liveEvents || [];

  const filteredEvents = rawEvents.filter((ev) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "LEADS") return ["META", "INSTAGRAM", "GOOGLE", "JUSTDIAL", "WEBSITE"].includes(ev.platform);
    if (activeFilter === "PAYMENTS") return ["RAZORPAY", "FINANCE"].includes(ev.platform);
    if (activeFilter === "LMS") return ["LMS", "ATTENDANCE"].includes(ev.platform);
    if (activeFilter === "EXAMS") return ["EXAMS"].includes(ev.platform);
    if (activeFilter === "AUTOMATION") return ["WHATSAPP", "SECURITY"].includes(ev.platform);
    return true;
  });

  const getPlatformIcon = (iconType: string) => {
    switch (iconType) {
      case "facebook":
        return (
          <div className="h-8 w-8 rounded-lg bg-[#1877F2] flex items-center justify-center text-white font-bold shadow-xs">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
        );
      case "instagram":
        return (
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Instagram className="h-4 w-4" />
          </div>
        );
      case "google":
        return (
          <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Globe className="h-4 w-4" />
          </div>
        );
      case "phone":
        return (
          <div className="h-8 w-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold shadow-xs">
            <PhoneCall className="h-4 w-4" />
          </div>
        );
      case "globe":
        return (
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Globe className="h-4 w-4" />
          </div>
        );
      case "message":
        return (
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
        );
      case "credit-card":
        return (
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
            <CreditCard className="h-4 w-4" />
          </div>
        );
      case "indian-rupee":
        return (
          <div className="h-8 w-8 rounded-lg bg-teal-700 flex items-center justify-center text-white font-bold shadow-xs">
            <IndianRupee className="h-4 w-4" />
          </div>
        );
      case "book-open":
        return (
          <div className="h-8 w-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold shadow-xs">
            <BookOpen className="h-4 w-4" />
          </div>
        );
      case "award":
        return (
          <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Award className="h-4 w-4" />
          </div>
        );
      case "users":
        return (
          <div className="h-8 w-8 rounded-lg bg-cyan-700 flex items-center justify-center text-white font-bold shadow-xs">
            <Users className="h-4 w-4" />
          </div>
        );
      case "briefcase":
        return (
          <div className="h-8 w-8 rounded-lg bg-purple-700 flex items-center justify-center text-white font-bold shadow-xs">
            <Briefcase className="h-4 w-4" />
          </div>
        );
      case "shield":
        return (
          <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-white font-bold shadow-xs">
            <Shield className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Activity className="h-4 w-4" />
          </div>
        );
    }
  };

  const getPlatformBadgeColor = (platform: LiveStreamEvent["platform"]) => {
    switch (platform) {
      case "META":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "INSTAGRAM":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "GOOGLE":
        return "bg-red-100 text-red-800 border-red-200";
      case "JUSTDIAL":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "WEBSITE":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "WHATSAPP":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "RAZORPAY":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "FINANCE":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "LMS":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      case "EXAMS":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "ATTENDANCE":
        return "bg-cyan-100 text-cyan-900 border-cyan-300";
      case "PLACEMENTS":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "HRMS":
        return "bg-slate-200 text-slate-900 border-slate-300";
      case "SECURITY":
        return "bg-slate-900 text-white border-slate-800";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const formatRelativeTime = (dateInput: Date | string) => {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 15) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Live Stream Controller Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 text-white shadow-md border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide">LIVE PLATFORM TELEMETRY & TRACKING</span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] uppercase font-semibold">
                14 Connected Platforms
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous multi-channel ingestion, payment webhooks, LMS delivery, and AI automation tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-lg bg-slate-800 p-1 border border-slate-700 text-xs text-slate-300">
            <span className="px-2 py-1 flex items-center gap-1 font-medium text-slate-400">
              <Clock className="h-3 w-3" /> Auto-sync:
            </span>
            <button
              onClick={() => setRefreshIntervalSec(5)}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                refreshIntervalSec === 5 ? "bg-emerald-600 text-white font-bold" : "hover:text-white"
              }`}
            >
              5s
            </button>
            <button
              onClick={() => setRefreshIntervalSec(10)}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                refreshIntervalSec === 10 ? "bg-emerald-600 text-white font-bold" : "hover:text-white"
              }`}
            >
              10s
            </button>
            <button
              onClick={() => setRefreshIntervalSec(30)}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                refreshIntervalSec === 30 ? "bg-emerald-600 text-white font-bold" : "hover:text-white"
              }`}
            >
              30s
            </button>
            <button
              onClick={() => setRefreshIntervalSec(0)}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                refreshIntervalSec === 0 ? "bg-rose-600 text-white font-bold" : "hover:text-white"
              }`}
            >
              {refreshIntervalSec === 0 ? <Pause className="h-3 w-3 inline" /> : "Pause"}
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-emerald-400" : ""}`} />
            <span>Sync</span>
          </Button>
        </div>
      </div>

      {/* Simulation Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-medium border flex items-center justify-between transition-all ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 animate-pulse text-emerald-600" />
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Multi-Platform Health & Status Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-600" />
            Connected Platforms & Ingestion Infrastructure
          </h2>
          <span className="text-xs text-slate-500 font-medium">All services connected & active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {platforms.map((plat) => (
            <Card
              key={plat.id}
              className="border-slate-200 hover:border-emerald-300 transition-all hover:shadow-sm bg-white flex flex-col justify-between"
            >
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-center justify-between">
                  {getPlatformIcon(plat.iconType)}
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold tracking-wider ${
                      plat.status === "ONLINE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : plat.status === "LISTENING"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-purple-50 text-purple-700 border-purple-200"
                    }`}
                  >
                    ● {plat.status}
                  </Badge>
                </div>
                <CardTitle className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">
                  {plat.name}
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-500 line-clamp-1">
                  {plat.metricLabel}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-2">
                <div className="text-lg font-bold text-slate-900">{plat.metricValue}</div>
                {plat.secondaryMetric && (
                  <p className="text-[10px] text-slate-500 font-medium line-clamp-1">
                    {plat.secondaryMetric}
                  </p>
                )}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">{plat.latencyMs}ms</span>
                  <div className="flex items-center gap-1.5">
                    {plat.externalLink && (
                      <a
                        href={plat.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-slate-500 hover:text-slate-900"
                        title="External Portal"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <Link
                      href={plat.internalPath}
                      className="text-[11px] text-emerald-700 font-semibold hover:text-emerald-900 flex items-center gap-0.5"
                    >
                      <span>Open</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Live Ingestion Simulator & Test Dock */}
      <Card className="border-indigo-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm">
        <CardHeader className="p-4 border-b border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <CardTitle className="text-sm font-bold text-white">
                Live Multi-Platform Webhook Ingestion & Simulator Dock
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-indigo-200 mt-0.5">
              Trigger instant synthetic events to test real-time routing, auto-response bots, and ledger settlement.
            </CardDescription>
          </div>
          <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-[10px] font-semibold">
            One-Click Test Triggers
          </Badge>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            <Button
              size="sm"
              variant="outline"
              disabled={simulateMutation.isPending}
              onClick={() => simulateMutation.mutate({ platform: "meta" })}
              className="h-9 bg-slate-800/80 border-slate-700 text-blue-300 hover:bg-blue-900/40 hover:text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Zap className="h-3 w-3 text-blue-400" />
              <span>Simulate Meta FB Lead</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={simulateMutation.isPending}
              onClick={() => simulateMutation.mutate({ platform: "google" })}
              className="h-9 bg-slate-800/80 border-slate-700 text-red-300 hover:bg-red-900/40 hover:text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Zap className="h-3 w-3 text-red-400" />
              <span>Simulate Google Lead</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={simulateMutation.isPending}
              onClick={() => simulateMutation.mutate({ platform: "justdial" })}
              className="h-9 bg-slate-800/80 border-slate-700 text-orange-300 hover:bg-orange-900/40 hover:text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Zap className="h-3 w-3 text-orange-400" />
              <span>Simulate JustDial Lead</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={simulateMutation.isPending}
              onClick={() => simulateMutation.mutate({ platform: "whatsapp" })}
              className="h-9 bg-slate-800/80 border-slate-700 text-emerald-300 hover:bg-emerald-900/40 hover:text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Zap className="h-3 w-3 text-emerald-400" />
              <span>Simulate WhatsApp Bot</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={simulateMutation.isPending}
              onClick={() => simulateMutation.mutate({ platform: "razorpay" })}
              className="h-9 bg-slate-800/80 border-slate-700 text-indigo-300 hover:bg-indigo-900/40 hover:text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Zap className="h-3 w-3 text-indigo-400" />
              <span>Simulate Razorpay Paid</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Live Tracking Feed Stream */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Real-Time Live Event Tracking Stream
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Chronological real-time event feed combining all 14 platforms
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {["ALL", "LEADS", "PAYMENTS", "LMS", "EXAMS", "AUTOMATION"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  activeFilter === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
              Connecting to real-time telemetry stream...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No events found for category: {activeFilter}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto pr-1">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getPlatformBadgeColor(
                        event.platform
                      )}`}
                    >
                      {event.platform}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{event.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{event.description}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Badge variant="outline" className="text-[10px] font-medium">
                      {event.badgeText}
                    </Badge>
                    <span className="text-[10px] font-mono text-slate-400">
                      {formatRelativeTime(event.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
