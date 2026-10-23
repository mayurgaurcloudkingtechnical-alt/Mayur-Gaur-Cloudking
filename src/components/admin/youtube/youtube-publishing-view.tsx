"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Youtube,
  Radio,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Play,
  RotateCcw,
  Sparkles,
  Settings,
} from "lucide-react";

export function YouTubePublishingView() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [channelTitle, setChannelTitle] = useState("SoftLab Global Official");
  const [defaultPrivacy, setDefaultPrivacy] = useState<"PRIVATE" | "UNLISTED" | "PUBLIC">("UNLISTED");
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(true);

  const utils = api.useUtils();
  const { data: status, isLoading: isStatusLoading } = api.youtubePublisher.getPublishingStatus.useQuery();
  const { data: queueItems = [], isLoading: isQueueLoading } = api.youtubePublisher.listQueueItems.useQuery({ limit: 20 });

  const processQueueMutation = api.youtubePublisher.processQueueNow.useMutation({
    onSuccess: (data) => {
      alert(`Processing complete: ${data.published} published, ${data.failed} failed.`);
      utils.youtubePublisher.getPublishingStatus.invalidate();
      utils.youtubePublisher.listQueueItems.invalidate();
    },
    onError: (err) => alert(`Queue processing error: ${err.message}`),
  });

  const retryItemMutation = api.youtubePublisher.retryItem.useMutation({
    onSuccess: () => {
      utils.youtubePublisher.getPublishingStatus.invalidate();
      utils.youtubePublisher.listQueueItems.invalidate();
    },
  });

  const saveConfigMutation = api.youtubePublisher.saveOAuthConfig.useMutation({
    onSuccess: () => {
      setIsConfigOpen(false);
      alert("YouTube OAuth2 settings updated successfully.");
      utils.youtubePublisher.getPublishingStatus.invalidate();
    },
    onError: (err) => alert(`Failed to save settings: ${err.message}`),
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/60 to-slate-900 p-6 rounded-2xl text-white shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-400/30">
              <Youtube className="w-5 h-5 text-rose-500" />
            </span>
            <h1 className="text-xl font-bold tracking-tight">Automated YouTube Publishing Engine</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Official SoftLab Global YouTube Data API v3 pipeline. Automatically enqueues finalized batch lectures, generates SEO metadata, applies thumbnails, and publishes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsConfigOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-semibold gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>OAuth & Privacy Policy</span>
          </Button>

          <Button
            size="sm"
            disabled={processQueueMutation.isPending}
            onClick={() => processQueueMutation.mutate()}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${processQueueMutation.isPending ? "animate-spin" : ""}`} />
            <span>Process Queue Now</span>
          </Button>
        </div>
      </div>

      {/* Telemetry Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-slate-200 p-4">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Channel Status</span>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              className={
                status?.isConnected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                  : "bg-amber-50 text-amber-700 border-amber-200 text-xs"
              }
            >
              {status?.isConnected ? "OAuth Connected" : "Credentials Pending"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">{status?.channelTitle || "Official Channel"}</p>
        </Card>

        <Card className="border-slate-200 p-4">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Pending in Queue</span>
          <p className="text-2xl font-black text-indigo-700 mt-1">{status?.stats.totalQueued ?? 0}</p>
          <span className="text-[10px] text-slate-400">Processing asynchronously</span>
        </Card>

        <Card className="border-slate-200 p-4">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Published Lectures</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{status?.stats.totalPublished ?? 0}</p>
          <span className="text-[10px] text-slate-400">Live on official channel</span>
        </Card>

        <Card className="border-slate-200 p-4">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Privacy Filter Blocked</span>
          <p className="text-2xl font-black text-slate-700 mt-1">{status?.stats.totalBlockedPrivacy ?? 0}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Protected (LMS Private only)</span>
        </Card>
      </div>

      {/* Publishing Queue Roster */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-200 py-3">
          <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span>Lecture Recording Upload Pipeline</span>
            <span className="text-[11px] font-normal text-slate-500">Deduplicated queue with retry safeguards</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 text-xs">
            {queueItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Youtube className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>No video recordings currently in publication queue.</p>
              </div>
            ) : (
              queueItems.map((item) => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 line-clamp-1">{item.videoTitle || item.lectureTopic}</span>
                      <Badge
                        className={
                          item.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                            : item.status === "FAILED"
                            ? "bg-rose-50 text-rose-700 border-rose-200 text-[10px]"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]"
                        }
                      >
                        {item.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {item.targetPrivacy}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {item.courseTitle} • {item.moduleTitle} • Faculty: {item.trainerName}
                    </p>
                    {item.errorMessage && (
                      <p className="text-[10px] text-rose-600 font-medium">Error: {item.errorMessage}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.youTubeUrl ? (
                      <a
                        href={item.youTubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-100"
                      >
                        <Youtube className="w-3.5 h-3.5 fill-current" />
                        <span>Watch Video</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : item.status === "FAILED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryItemMutation.mutate({ itemId: item.id })}
                        className="text-xs gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </Button>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-mono">Processing...</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* OAuth & Policy Settings Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">YouTube Data API v3 OAuth Settings</h3>
              <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveConfigMutation.mutate({
                  clientId,
                  clientSecret,
                  refreshToken,
                  channelTitle,
                  defaultPrivacy,
                  autoPublishEnabled,
                });
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Channel Display Title</label>
                <input
                  type="text"
                  value={channelTitle}
                  onChange={(e) => setChannelTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Google OAuth2 Client ID</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="xxxx.apps.googleusercontent.com"
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-[11px] focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Google OAuth2 Client Secret</label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-[11px] focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">OAuth2 Refresh Token</label>
                <input
                  type="password"
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                  placeholder="1//0xxxxxx (Generated via Google OAuth Playground or Channel Admin)"
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-[11px] focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Default Visibility</label>
                  <select
                    value={defaultPrivacy}
                    onChange={(e: any) => setDefaultPrivacy(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-semibold"
                  >
                    <option value="UNLISTED">UNLISTED (Recommended)</option>
                    <option value="PRIVATE">PRIVATE (Strict Internal)</option>
                    <option value="PUBLIC">PUBLIC (Searchable)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Auto-Enqueue on Class End</label>
                  <select
                    value={autoPublishEnabled ? "ENABLED" : "DISABLED"}
                    onChange={(e) => setAutoPublishEnabled(e.target.value === "ENABLED")}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-semibold"
                  >
                    <option value="ENABLED">Active (Eligible Classes)</option>
                    <option value="DISABLED">Manual Enqueue Only</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsConfigOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saveConfigMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {saveConfigMutation.isPending ? "Saving..." : "Save OAuth Configuration"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
