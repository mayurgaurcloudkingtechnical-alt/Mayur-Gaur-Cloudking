"use client";

import * as React from "react";
import { useState, useEffect } from "react";
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
  Lock,
  Eye,
  Globe,
  SlidersHorizontal,
  PauseCircle,
  PlayCircle,
  Link as LinkIcon,
  Copy,
  Check,
} from "lucide-react";

export function YouTubePublishingView() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<any>(null);
  const [copiedRedirect, setCopiedRedirect] = useState(false);
  const [urlMessage, setUrlMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Configuration Form State
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [channelTitle, setChannelTitle] = useState("SoftLab Global Official");
  const [defaultPrivacy, setDefaultPrivacy] = useState<"PRIVATE" | "UNLISTED" | "PUBLIC">("PRIVATE");
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(true);

  // Edit Item Form State
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editPrivacy, setEditPrivacy] = useState<"PRIVATE" | "UNLISTED" | "PUBLIC">("PRIVATE");
  const [editApproved, setEditApproved] = useState(true);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const utils = api.useUtils();
  const { data: status, isLoading: isStatusLoading } = api.youtubePublisher.getPublishingStatus.useQuery();
  const { data: queueItems = [], isLoading: isQueueLoading } = api.youtubePublisher.listQueueItems.useQuery({
    limit: 30,
    status: statusFilter,
  });

  // Handle URL callback params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const conn = params.get("connection");
      const ch = params.get("channel");
      const msg = params.get("message");

      if (conn === "success") {
        setUrlMessage({
          type: "success",
          text: `Official YouTube channel connected successfully${ch ? `: ${decodeURIComponent(ch)}` : ""}. Ready for uploads.`,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (conn === "error") {
        setUrlMessage({
          type: "error",
          text: `YouTube authorization error: ${msg ? decodeURIComponent(msg) : "Consent was cancelled or invalid."}`,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Sync config defaults when status loads
  useEffect(() => {
    if (status) {
      if (status.channelTitle) setChannelTitle(status.channelTitle);
      if (status.defaultPrivacy) setDefaultPrivacy(status.defaultPrivacy as any);
      if (status.autoPublishEnabled !== undefined) setAutoPublishEnabled(status.autoPublishEnabled);
    }
  }, [status]);

  const processQueueMutation = api.youtubePublisher.processQueueNow.useMutation({
    onSuccess: (data) => {
      alert(`Queue Processed:\n• Published: ${data.published}\n• Failed: ${data.failed}\n• Total Checked: ${data.processed}`);
      utils.youtubePublisher.getPublishingStatus.invalidate();
      utils.youtubePublisher.listQueueItems.invalidate();
    },
    onError: (err) => alert(`Queue processing error: ${err.message}`),
  });

  const testConnectionMutation = api.youtubePublisher.testConnection.useMutation({
    onSuccess: (res) => {
      if (res.success) {
        alert(`Connection Test PASSED!\n\nChannel: ${res.channelTitle}\nChannel ID: ${res.channelId}\nStatus: ${res.status}`);
      } else {
        alert(`Connection Test Result:\nStatus: ${res.status}\nError: ${res.error}`);
      }
      utils.youtubePublisher.getPublishingStatus.invalidate();
    },
    onError: (err) => alert(`Connection test request failed: ${err.message}`),
  });

  const getOAuthUrlMutation = api.youtubePublisher.getOAuthConnectUrl.useMutation({
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (err) => alert(`Failed to start Google OAuth: ${err.message}`),
  });

  const disconnectMutation = api.youtubePublisher.disconnectChannel.useMutation({
    onSuccess: () => {
      alert("YouTube channel disconnected and tokens cleared.");
      utils.youtubePublisher.getPublishingStatus.invalidate();
    },
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
      alert("YouTube OAuth settings updated successfully.");
      utils.youtubePublisher.getPublishingStatus.invalidate();
    },
    onError: (err) => alert(`Failed to save settings: ${err.message}`),
  });

  const updateItemMutation = api.youtubePublisher.updateQueueItem.useMutation({
    onSuccess: () => {
      setIsEditModalOpen(false);
      setSelectedQueueItem(null);
      alert("Queue item metadata and privacy updated.");
      utils.youtubePublisher.listQueueItems.invalidate();
    },
    onError: (err) => alert(`Failed to update item: ${err.message}`),
  });

  const toggleWorkerMutation = api.youtubePublisher.toggleQueueWorker.useMutation({
    onSuccess: (data) => {
      utils.youtubePublisher.getPublishingStatus.invalidate();
    },
  });

  const handleOpenEdit = (item: any) => {
    setSelectedQueueItem(item);
    setEditTitle(item.videoTitle || item.lectureTopic);
    setEditDescription(item.videoDescription || "");
    setEditTags(Array.isArray(item.tags) ? item.tags.join(", ") : "");
    setEditPrivacy(item.targetPrivacy || "PRIVATE");
    setEditApproved(item.isApproved !== false);
    setIsEditModalOpen(true);
  };

  const handleCopyRedirect = () => {
    if (status?.redirectUri) {
      navigator.clipboard.writeText(status.redirectUri);
      setCopiedRedirect(true);
      setTimeout(() => setCopiedRedirect(false), 2000);
    }
  };

  const getStatusBadge = () => {
    switch (status?.status) {
      case "CONNECTED":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold text-xs">CONNECTED</Badge>;
      case "AUTHORIZATION_REQUIRED":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-300 font-bold text-xs">AUTHORIZATION_REQUIRED</Badge>;
      case "DEGRADED":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-300 font-bold text-xs">DEGRADED</Badge>;
      case "ERROR":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-300 font-bold text-xs">ERROR</Badge>;
      case "NOT_CONFIGURED":
      default:
        return <Badge className="bg-amber-50 text-amber-700 border-amber-300 font-bold text-xs">NOT_CONFIGURED</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* URL Banner Message */}
      {urlMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            urlMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {urlMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{urlMessage.text}</span>
          </div>
          <button onClick={() => setUrlMessage(null)} className="text-slate-400 hover:text-slate-700 font-bold">
            ✕
          </button>
        </div>
      )}

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

        <div className="flex items-center flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsConfigOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-semibold gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>OAuth & Credentials</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={testConnectionMutation.isPending}
            onClick={() => testConnectionMutation.mutate()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testConnectionMutation.isPending ? "animate-spin" : ""}`} />
            <span>Test Connection</span>
          </Button>

          {status?.status === "CONNECTED" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (confirm("Disconnect official YouTube channel? Live uploading will be paused.")) {
                  disconnectMutation.mutate();
                }
              }}
              className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800 text-xs font-semibold gap-1"
            >
              <span>Disconnect</span>
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={getOAuthUrlMutation.isPending || !status?.hasClientId}
              onClick={() => getOAuthUrlMutation.mutate({ origin: window.location.origin })}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5 shadow-sm"
              title={!status?.hasClientId ? "Configure Google OAuth Client ID first in settings" : "Authorize Official Channel"}
            >
              <Youtube className="w-3.5 h-3.5 fill-current" />
              <span>Connect Channel</span>
            </Button>
          )}

          <Button
            size="sm"
            disabled={processQueueMutation.isPending || status?.status !== "CONNECTED"}
            onClick={() => processQueueMutation.mutate()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${processQueueMutation.isPending ? "animate-spin" : ""}`} />
            <span>Process Queue Now</span>
          </Button>
        </div>
      </div>

      {/* Diagnostics Alert Box when not connected */}
      {status?.status !== "CONNECTED" && (
        <Card className="border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-900">
                  YouTube Integration Diagnostic: {status?.statusReason || "Credentials Pending"}
                </span>
                <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-800 border-amber-300 font-mono">
                  Category {status?.diagnosticCategory ?? 1}
                </Badge>
              </div>
              <p className="text-amber-800">{status?.diagnosticCategoryDescription}</p>
              <div className="pt-2 flex items-center gap-2">
                {!status?.hasClientId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsConfigOpen(true)}
                    className="bg-white hover:bg-amber-100 text-amber-900 border-amber-300 text-xs font-bold"
                  >
                    Open Settings to Enter Google Cloud Credentials
                  </Button>
                ) : !status?.hasRefreshToken ? (
                  <Button
                    size="sm"
                    onClick={() => getOAuthUrlMutation.mutate({ origin: window.location.origin })}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5"
                  >
                    <Youtube className="w-3.5 h-3.5 fill-current" />
                    <span>Authorize Official YouTube Channel Now</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => testConnectionMutation.mutate()}
                    className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold"
                  >
                    Re-test Token & Channel Health
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Telemetry Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-slate-200 p-4">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Channel Status</span>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge()}
          </div>
          <p className="text-xs text-slate-700 font-semibold mt-1 truncate">
            {status?.channelTitle || "Official Channel"}
          </p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
            {status?.channelId && status.channelId !== "Not Connected" ? `ID: ${status.channelId}` : "Not Connected"}
          </p>
        </Card>

        <Card className="border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Queue Pipeline</span>
            <button
              onClick={() => toggleWorkerMutation.mutate({ paused: status?.autoPublishEnabled !== false })}
              className="text-[10px] text-indigo-600 font-semibold hover:underline"
            >
              {status?.autoPublishEnabled !== false ? "Pause Queue" : "Resume Queue"}
            </button>
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-1">{status?.stats.totalQueued ?? 0}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                status?.autoPublishEnabled !== false ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span className="text-[10px] text-slate-400">
              {status?.autoPublishEnabled !== false ? "Queue Active" : "Worker Paused"}
            </span>
          </div>
        </Card>

        <Card className="border-slate-200 p-4">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Published Lectures</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{status?.stats.totalPublished ?? 0}</p>
          <span className="text-[10px] text-slate-400">Live on official channel</span>
        </Card>

        <Card className="border-slate-200 p-4">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Privacy Blocked</span>
          <p className="text-2xl font-black text-slate-700 mt-1">{status?.stats.totalBlockedPrivacy ?? 0}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Interviews (Strict Private)</span>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1">
          {["ALL", "QUEUED", "PROCESSING", "UPLOADING", "PUBLISHED", "FAILED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === tab
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">Showing {queueItems.length} items</span>
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
                <p>No video recordings currently matching filter in publication queue.</p>
              </div>
            ) : (
              queueItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-bold text-slate-900 line-clamp-1">
                        {item.videoTitle || item.lectureTopic}
                      </span>
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
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono flex items-center gap-1 ${
                          item.targetPrivacy === "PUBLIC"
                            ? "border-emerald-300 text-emerald-700"
                            : item.targetPrivacy === "UNLISTED"
                            ? "border-amber-300 text-amber-700"
                            : "border-slate-300 text-slate-700"
                        }`}
                      >
                        {item.targetPrivacy === "PRIVATE" ? (
                          <Lock className="w-2.5 h-2.5" />
                        ) : item.targetPrivacy === "UNLISTED" ? (
                          <Eye className="w-2.5 h-2.5" />
                        ) : (
                          <Globe className="w-2.5 h-2.5" />
                        )}
                        <span>{item.targetPrivacy}</span>
                      </Badge>
                      {item.isApproved === false && (
                        <Badge className="bg-amber-100 text-amber-800 text-[10px]">Pending Approval</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {item.courseTitle} • {item.moduleTitle} • Faculty: {item.trainerName}
                    </p>
                    {item.errorMessage && (
                      <p className="text-[10px] text-rose-600 font-medium bg-rose-50 p-1.5 rounded-md border border-rose-100">
                        Error: {item.errorMessage}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(item)}
                      disabled={item.status === "PUBLISHED"}
                      className="text-xs gap-1 border-slate-300"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>Edit & Privacy</span>
                    </Button>

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
                        className="text-xs gap-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </Button>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-mono">
                        {item.uploadProgressPercent ? `${item.uploadProgressPercent}%` : "In Queue..."}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Queue Item Metadata & Privacy Modal */}
      {isEditModalOpen && selectedQueueItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Edit Lecture Publishing Metadata</h3>
                <p className="text-[11px] text-slate-500">Configure title, description, privacy, and approval</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateItemMutation.mutate({
                  itemId: selectedQueueItem.id,
                  videoTitle: editTitle,
                  videoDescription: editDescription,
                  tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
                  targetPrivacy: editPrivacy,
                  isApproved: editApproved,
                });
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Video Title (max 100 chars)</label>
                <input
                  type="text"
                  maxLength={100}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold focus:outline-none focus:border-rose-500"
                  required
                />
                <span className="text-[10px] text-slate-400">{editTitle.length}/100 characters</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Video Description</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-[11px] focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="SoftLab Global, Coding, Prayagraj"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Privacy</label>
                  <select
                    value={editPrivacy}
                    onChange={(e: any) => setEditPrivacy(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-semibold"
                  >
                    <option value="PRIVATE">PRIVATE (Strict Internal)</option>
                    <option value="UNLISTED">UNLISTED (Link Only)</option>
                    <option value="PUBLIC">PUBLIC (Searchable)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Publishing Approval</label>
                  <select
                    value={editApproved ? "APPROVED" : "PENDING"}
                    onChange={(e) => setEditApproved(e.target.value === "APPROVED")}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-semibold"
                  >
                    <option value="APPROVED">Approved for Upload</option>
                    <option value="PENDING">Hold / Pending Approval</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateItemMutation.isPending}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  {updateItemMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OAuth & Policy Settings Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Google Cloud OAuth 2.0 Credentials</h3>
                <p className="text-[11px] text-slate-500">Configure YouTube Data API v3 integration</p>
              </div>
              <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                ✕
              </button>
            </div>

            {/* Redirect URI Display */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-700 text-[11px] block">
                Google Cloud Authorized Redirect URI:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={status?.redirectUri || "https://lms.softlabglobal.com/api/auth/youtube/callback"}
                  className="w-full bg-white border border-slate-300 rounded-md p-1.5 font-mono text-[10px] text-slate-800 select-all"
                />
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={handleCopyRedirect}
                  className="shrink-0 text-xs px-2.5 h-8 gap-1"
                >
                  {copiedRedirect ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRedirect ? "Copied" : "Copy"}</span>
                </Button>
              </div>
              <p className="text-[10px] text-slate-500">
                Add this exact URI in your Google Cloud Console project under OAuth 2.0 Client IDs.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveConfigMutation.mutate({
                  clientId: clientId || undefined,
                  clientSecret: clientSecret || undefined,
                  channelTitle,
                  defaultPrivacy,
                  autoPublishEnabled,
                });
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Channel Display Name</label>
                <input
                  type="text"
                  value={channelTitle}
                  onChange={(e) => setChannelTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Google OAuth 2.0 Client ID{" "}
                  {status?.hasClientId && <span className="text-emerald-600 text-[10px] font-normal">(Configured)</span>}
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder={status?.hasClientId ? "•••••••• (Leave blank to keep existing)" : "xxxx.apps.googleusercontent.com"}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-[11px] focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Google OAuth 2.0 Client Secret{" "}
                  {status?.hasClientSecret && <span className="text-emerald-600 text-[10px] font-normal">(Configured)</span>}
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder={status?.hasClientSecret ? "•••••••••••••••• (Leave blank to keep existing)" : "Enter client secret"}
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
                    <option value="PRIVATE">PRIVATE (Strict Internal)</option>
                    <option value="UNLISTED">UNLISTED (Link Only)</option>
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

              <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500 space-y-1">
                <span className="font-bold text-slate-700 block">Required Google Cloud API Scopes:</span>
                <p>• https://www.googleapis.com/auth/youtube.upload (Upload video lectures)</p>
                <p>• https://www.googleapis.com/auth/youtube.readonly (Verify channel identity)</p>
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
                  {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
