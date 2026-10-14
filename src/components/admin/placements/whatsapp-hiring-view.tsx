"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  Send,
  Eye,
  FileText,
  Building2,
  Briefcase,
  Users,
  Copy,
  ExternalLink,
  Filter,
  Check,
  X,
  Trash2,
  Settings,
  Flame,
  ArrowRight,
  Database,
  Radio,
  FileUp,
  Download,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ActiveSubSection =
  | "status"
  | "sources"
  | "inbox"
  | "extracted"
  | "pending"
  | "approved"
  | "duplicates"
  | "failed"
  | "settings";

export function WhatsAppHiringView() {
  const [activeSection, setActiveSection] = useState<ActiveSubSection>("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Source Modal
  const [showNewSourceModal, setShowNewSourceModal] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceType, setNewSourceType] = useState<"WHATSAPP_GROUP" | "FORWARDED_MESSAGE" | "PROVIDER_WEBHOOK" | "EMAIL_DIGEST" | "MANUAL_IMPORT">("WHATSAPP_GROUP");
  const [newSourceIdentifier, setNewSourceIdentifier] = useState("");
  const [newSourceDesc, setNewSourceDesc] = useState("");
  const [newSourceAutoPublish, setNewSourceAutoPublish] = useState(false);

  // Manual Ingest / Test Simulator Modal
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [ingestText, setIngestText] = useState("");
  const [ingestSenderPhone, setIngestSenderPhone] = useState("9876543210");
  const [ingestSenderName, setIngestSenderName] = useState("Priya Sharma (HR)");
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [isBatchMode, setIsBatchMode] = useState(false);

  // Review / Edit Job Modal
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editOpenings, setEditOpenings] = useState(1);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Feedback Notification
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const utils = api.useUtils();

  // Queries
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } =
    api.hiringAutomation.getIntegrationStatus.useQuery();

  const { data: sources, isLoading: sourcesLoading, refetch: refetchSources } =
    api.hiringAutomation.listSources.useQuery();

  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } =
    api.hiringAutomation.listIncomingMessages.useQuery({
      search: searchQuery || undefined,
      limit: 100,
    });

  const { data: extractedJobs, isLoading: jobsLoading, refetch: refetchJobs } =
    api.hiringAutomation.listExtractedJobs.useQuery({
      search: searchQuery || undefined,
      limit: 100,
    });

  const { data: changeProposals, refetch: refetchProposals } =
    api.hiringAutomation.listChangeProposals.useQuery();

  const { data: logs, refetch: refetchLogs } =
    api.hiringAutomation.listLogs.useQuery({ limit: 50 });

  const { data: config, refetch: refetchConfig } =
    api.hiringAutomation.getSettings.useQuery();

  // Mutations
  const createSourceMutation = api.hiringAutomation.createSource.useMutation({
    onSuccess: () => {
      setShowNewSourceModal(false);
      setNewSourceName("");
      setNewSourceIdentifier("");
      setNewSourceDesc("");
      refetchSources();
      setNotification({ type: "success", message: "Hiring source registered successfully!" });
      setTimeout(() => setNotification(null), 3000);
    },
  });

  const updateSourceMutation = api.hiringAutomation.updateSource.useMutation({
    onSuccess: () => {
      refetchSources();
      refetchStatus();
    },
  });

  const deleteSourceMutation = api.hiringAutomation.deleteSource.useMutation({
    onSuccess: () => {
      refetchSources();
      refetchStatus();
    },
  });

  const ingestMessageMutation = api.hiringAutomation.ingestRawMessage.useMutation({
    onSuccess: (res: any) => {
      setShowIngestModal(false);
      setIngestText("");
      refetchMessages();
      refetchJobs();
      refetchStatus();
      if (res?.status === "DUPLICATE_PREVENTED") {
        setNotification({ type: "info", message: "Duplicate post detected & linked! No duplicate opening created." });
      } else if (res?.status === "UPDATE_PROPOSED") {
        setNotification({ type: "info", message: "Existing opening detected with updated details! Proposed update created for review." });
      } else if (res?.status === "AUTO_PUBLISHED") {
        setNotification({ type: "success", message: "High confidence job automatically approved & published to Placement CRM!" });
      } else {
        setNotification({ type: "success", message: "Job captured & placed in Pending Verification queue!" });
      }
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setNotification({ type: "error", message: err.message || "Failed to process message." });
    },
  });

  const ingestBatchMutation = api.hiringAutomation.ingestBatchChatExport.useMutation({
    onSuccess: (res: any) => {
      setShowIngestModal(false);
      setIngestText("");
      refetchMessages();
      refetchJobs();
      refetchStatus();
      setNotification({
        type: "success",
        message: `Parsed ${res.totalMessagesParsed} messages, processed ${res.processedCount} recruitment posts!`,
      });
      setTimeout(() => setNotification(null), 4000);
    },
  });

  const approveJobMutation = api.hiringAutomation.approveAndPublish.useMutation({
    onSuccess: () => {
      setSelectedJob(null);
      refetchJobs();
      refetchStatus();
      setNotification({ type: "success", message: "Opening published directly to Placement CRM & Student Portal!" });
      setTimeout(() => setNotification(null), 3500);
    },
  });

  const rejectJobMutation = api.hiringAutomation.rejectExtractedJob.useMutation({
    onSuccess: () => {
      setSelectedJob(null);
      setShowRejectModal(false);
      setRejectReason("");
      refetchJobs();
      refetchStatus();
      setNotification({ type: "info", message: "Job marked as rejected." });
      setTimeout(() => setNotification(null), 3500);
    },
  });

  const retryMutation = api.hiringAutomation.retryExtraction.useMutation({
    onSuccess: () => {
      refetchMessages();
      refetchJobs();
      setNotification({ type: "success", message: "Extraction retried successfully!" });
      setTimeout(() => setNotification(null), 3500);
    },
  });

  const reviewProposalMutation = api.hiringAutomation.reviewChangeProposal.useMutation({
    onSuccess: () => {
      refetchProposals();
      refetchJobs();
      setNotification({ type: "success", message: "Change proposal resolved." });
      setTimeout(() => setNotification(null), 3500);
    },
  });

  const updateSettingsMutation = api.hiringAutomation.updateSettings.useMutation({
    onSuccess: () => {
      refetchConfig();
      refetchStatus();
      setNotification({ type: "success", message: "Automation trust policy & settings updated!" });
      setTimeout(() => setNotification(null), 3000);
    },
  });

  // Filtered views
  const pendingJobs = extractedJobs?.filter((j) => j.status === "PENDING_VERIFICATION") || [];
  const approvedJobs = extractedJobs?.filter((j) => j.status === "PUBLISHED" || j.status === "APPROVED") || [];
  const duplicateJobs = messages?.filter((m) => m.processingStatus === "DUPLICATE" || m.processingStatus === "UPDATED") || [];
  const failedMessages = messages?.filter((m) => m.processingStatus === "PROCESSING_FAILED" || m.processingStatus === "REJECTED") || [];

  // Simulator Presets
  const sampleJobs = [
    {
      title: "Hinglish Fresher React Post",
      text: `Urgent Requirement at SoftTech Solutions Pvt Ltd!\nRole: Frontend Developer (React.js / Next.js)\nLocation: Noida Sector 62 / WFH Hybrid\nExp: 0-1 Yr (Freshers 2024/2025 batch can apply)\nSalary: 3.5 LPA - 5 LPA\nSkills: HTML, CSS, JavaScript, React, Tailwind CSS\nImmediate Joiner required. Koi registration fees nahi hai.\nSend CV on WhatsApp: 9876543210 or email hr@softtechsolutions.com`,
    },
    {
      title: "Corporate Python / Data Post",
      text: `Opening at Infospectrum Systems\nDesignation: Python Backend Engineer\nVacancies: 3\nLocation: Prayagraj / Remote\nQualification: B.Tech / BCA / MCA\nPackage: ₹45,000 to ₹65,000 / month\nRequirements: Python, Django, REST APIs, PostgreSQL\nApply link: https://infospectrum.com/careers/apply-py\nContact: Ankita Roy (HR Manager) - 9918273645`,
    },
    {
      title: "Suspicious Post with Fees (Security Test)",
      text: `Urgent Hiring in International IT Company for Telecallers & Data Entry!\nSalary: 45,000 per month\nFreshers welcome.\nRegistration fee: ₹500 compulsory for identity verification.\nSend money to GooglePay and send screenshot to 9123456789 to get offer letter.`,
    },
    {
      title: "Casual Non-Job Message (Filtering Test)",
      text: `Good morning all group members! Happy Diwali to everyone and your family. May this festival bring lots of happiness and prosperity.`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : notification.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {notification.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {notification.type === "info" && <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hero Header & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              WhatsApp Hiring Automation
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-mono">
                AI Ingestion Engine
              </Badge>
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Automatically ingest recruitment posts from authorized WhatsApp groups, forwarders, and chat exports into structured Placement CRM openings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowIngestModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 shadow-sm flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Test Ingestion / Paste Post</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNewSourceModal(true)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold h-9"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add Source</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Ingested</p>
          <p className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">{statusData?.metrics.totalMessages || 0}</p>
          <span className="text-[10px] text-slate-500">Messages processed</span>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending Review</p>
          <p className="text-xl font-extrabold text-amber-700 font-mono mt-0.5">{pendingJobs.length}</p>
          <span className="text-[10px] text-amber-600 font-medium">Awaiting verification</span>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/40 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Published CRM</p>
          <p className="text-xl font-extrabold text-emerald-700 font-mono mt-0.5">{approvedJobs.length}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Active student drives</span>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50/40 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Duplicates Filtered</p>
          <p className="text-xl font-extrabold text-indigo-700 font-mono mt-0.5">{statusData?.metrics.duplicatesCount || 0}</p>
          <span className="text-[10px] text-indigo-600 font-medium">Cross-group prevented</span>
        </Card>

        <Card className="border-rose-200 bg-rose-50/40 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Suspicious Flagged</p>
          <p className="text-xl font-extrabold text-rose-700 font-mono mt-0.5">{statusData?.metrics.suspiciousCount || 0}</p>
          <span className="text-[10px] text-rose-600 font-medium">Fee/scam warnings</span>
        </Card>

        <Card className="border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Success Rate</p>
          <p className="text-xl font-extrabold text-slate-800 font-mono mt-0.5">{statusData?.metrics.successRate || 100}%</p>
          <span className="text-[10px] text-slate-500">Pipeline reliability</span>
        </Card>
      </div>

      {/* 10-Section Navigation Bar */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveSection("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSection === "pending"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>Pending Review</span>
            <span className="bg-white/20 text-white rounded-full px-1.5 py-0.2 text-[10px] font-mono">
              {pendingJobs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection("approved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSection === "approved"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>Approved CRM Openings</span>
            <span className="bg-white/20 text-white rounded-full px-1.5 py-0.2 text-[10px] font-mono">
              {approvedJobs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection("extracted")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSection === "extracted" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All AI Extracted ({extractedJobs?.length || 0})
          </button>

          <button
            onClick={() => setActiveSection("duplicates")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSection === "duplicates" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>Duplicates & Proposals</span>
            {changeProposals && changeProposals.length > 0 && (
              <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-mono">
                {changeProposals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection("inbox")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSection === "inbox" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Message Inbox ({messages?.length || 0})
          </button>

          <button
            onClick={() => setActiveSection("sources")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSection === "sources" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Sources ({sources?.length || 0})
          </button>

          <button
            onClick={() => setActiveSection("status")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              activeSection === "status" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
            <span>Integration Status</span>
          </button>

          <button
            onClick={() => setActiveSection("settings")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              activeSection === "settings" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Trust & Settings</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search company, role, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs h-8 w-44 font-medium"
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: INTEGRATION STATUS                            */}
      {/* ======================================================== */}
      {activeSection === "status" && (
        <div className="space-y-4">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Official Meta WhatsApp Business Cloud API & Ingestion Bridge Sentinel
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time verification of Meta credentials, webhook listeners, and supported group ingestion channels.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => refetchStatus()} className="h-7 text-xs">
                  <RefreshCw className="w-3 h-3 mr-1" /> Refresh Diagnostics
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Cloud API Status</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        statusData?.connectionStatus === "CONNECTED"
                          ? "bg-emerald-500"
                          : statusData?.connectionStatus === "DEGRADED"
                          ? "bg-amber-500"
                          : "bg-slate-400"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-800">{statusData?.connectionStatus}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number ID</p>
                  <p className="text-xs font-bold font-mono text-slate-800 mt-1">
                    {statusData?.phoneIdConfigured ? "Configured in .env" : "Not Set"}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Ingestion Webhook</p>
                  <p className="text-xs font-bold text-emerald-700 mt-1">Active (HMAC SHA-256)</p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Trust Policy Mode</p>
                  <p className="text-xs font-bold text-indigo-700 mt-1">{statusData?.trustPolicy}</p>
                </div>
              </div>

              {/* Supported Channels breakdown */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                  <p className="text-xs font-bold text-slate-700">Supported Ingestion Methods & Compliance Notice</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {statusData?.supportedIngestionChannels.map((ch, idx) => (
                    <div key={idx} className="p-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">{ch.name}</p>
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold ${
                              ch.status === "SUPPORTED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : "bg-rose-50 text-rose-700 border-rose-300"
                            }`}
                          >
                            {ch.status === "SUPPORTED" ? "Supported & Compliant" : "Prohibited by Meta Policy"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{ch.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Webhook Endpoint snippet */}
              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Authorized Webhook URL</p>
                  <p className="text-emerald-400">POST https://lms.softlabglobal.com/api/webhooks/hiring-whatsapp</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText("https://lms.softlabglobal.com/api/webhooks/hiring-whatsapp");
                    setNotification({ type: "info", message: "Webhook URL copied to clipboard!" });
                    setTimeout(() => setNotification(null), 2500);
                  }}
                  className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 h-7 text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: AUTHORIZED HIRING SOURCES                     */}
      {/* ======================================================== */}
      {activeSection === "sources" && (
        <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Authorized Hiring Sources</CardTitle>
              <p className="text-xs text-slate-500">Only authorized groups and channels are processed.</p>
            </div>
            <Button size="sm" onClick={() => setShowNewSourceModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Source
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3">Source Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Consent Status</th>
                  <th className="p-3">Trust Level</th>
                  <th className="p-3">Ingested / Extracted</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sourcesLoading ? (
                  <tr><td colSpan={7} className="p-6 text-center text-slate-400">Loading sources...</td></tr>
                ) : !sources || sources.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-slate-500">No hiring sources configured yet. Click 'Add Source' above.</td></tr>
                ) : (
                  sources.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{s.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{s.identifier || "No Identifier"}</p>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] font-semibold">{s.sourceType}</Badge>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {s.consentStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        {s.autoPublishTrust ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">Auto-Publish Trusted</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Review First</Badge>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <span className="text-slate-800 font-bold">{s.totalReceived}</span> received • <span className="text-indigo-600 font-bold">{s.totalExtracted}</span> extracted
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => updateSourceMutation.mutate({ id: s.id, isEnabled: !s.isEnabled })}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                            s.isEnabled ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                          }`}
                        >
                          {s.isEnabled ? "Active" : "Paused"}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSourceMutation.mutate({ id: s.id })}
                          className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ======================================================== */}
      {/* SECTION 6: PENDING VERIFICATION (DEFAULT REVIEW QUEUE)   */}
      {/* ======================================================== */}
      {activeSection === "pending" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Jobs Awaiting Placement Officer Verification</span>
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-mono text-[10px]">
                {pendingJobs.length} In Review
              </Badge>
            </h3>
            <span className="text-xs text-slate-400">Review extraction, verify company identity, and publish with 1-click.</span>
          </div>

          {pendingJobs.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-200 bg-white">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-800">Review Queue is Clear!</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No extracted jobs are currently pending verification. Click "Test Ingestion" above to simulate new recruitment posts.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingJobs.map((job) => (
                <Card
                  key={job.id}
                  className={`border transition-all shadow-xs overflow-hidden ${
                    job.isSuspicious ? "border-rose-300 bg-rose-50/20" : "border-slate-200 bg-white hover:border-indigo-300"
                  }`}
                >
                  <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{job.jobTitle}</h4>
                        {job.isSuspicious && (
                          <Badge className="bg-rose-600 text-white text-[9px] font-bold flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Flagged
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {job.companyName}
                        {job.location && <span className="text-slate-400">• {job.location}</span>}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-500 block">AI Confidence</span>
                      <span
                        className={`text-xs font-extrabold font-mono px-2 py-0.5 rounded-full ${
                          job.confidenceScore >= 0.8
                            ? "bg-emerald-100 text-emerald-800"
                            : job.confidenceScore >= 0.6
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {Math.round(job.confidenceScore * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 text-xs">
                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Salary / CTC:</span>
                        <span className="font-bold text-slate-800">{job.salaryPackage || "Not specified"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Experience / Mode:</span>
                        <span className="font-bold text-slate-800">
                          {job.experienceRequired || "Fresher"} ({job.workMode})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Recruiter Contact:</span>
                        <span className="font-bold text-slate-800">
                          {job.recruiterPhone || job.recruiterEmail || "Direct Application"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Openings:</span>
                        <span className="font-bold text-slate-800">{job.openingsCount} position(s)</span>
                      </div>
                    </div>

                    {/* Suspicion / Warning Alert */}
                    {job.isSuspicious && job.suspicionReason && (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-[11px] font-medium flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Security Alert: </span>
                          <span>{job.suspicionReason}</span>
                        </div>
                      </div>
                    )}

                    {/* Required Skills */}
                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {job.requiredSkills.slice(0, 5).map((sk: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Raw Snippet preview */}
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono text-slate-600 line-clamp-2">
                      {job.jobDescription}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedJob(job);
                            setEditTitle(job.jobTitle);
                            setEditCompany(job.companyName);
                            setEditSalary(job.salaryPackage || "");
                            setEditLocation(job.location || "");
                            setEditOpenings(job.openingsCount);
                          }}
                          className="h-8 text-xs font-semibold"
                        >
                          <Eye className="w-3 h-3 mr-1" /> View / Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedJob(job);
                            setShowRejectModal(true);
                          }}
                          className="h-8 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 font-semibold"
                        >
                          Reject
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => approveJobMutation.mutate({ extractedJobId: job.id })}
                        disabled={approveJobMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-bold shadow-xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Publish to CRM</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 7: APPROVED CRM OPENINGS                         */}
      {/* ======================================================== */}
      {activeSection === "approved" && (
        <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Approved Placement Openings (Live JobDrives)</CardTitle>
              <p className="text-xs text-slate-500">Live vacancies published directly to Student Job Discovery & Campus Portals.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3">Role & Company</th>
                  <th className="p-3">Salary / CTC</th>
                  <th className="p-3">Location & Mode</th>
                  <th className="p-3">Verified By</th>
                  <th className="p-3">Placement CRM Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvedJobs.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No jobs published to Placement CRM yet.</td></tr>
                ) : (
                  approvedJobs.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/80">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{j.jobTitle}</p>
                        <p className="text-[11px] text-indigo-700 font-semibold">{j.companyName}</p>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">{j.salaryPackage || "As per norms"}</td>
                      <td className="p-3">{j.location} • {j.workMode}</td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-800">{j.verifiedBy?.firstName || "System Auto"}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {j.verifiedAt ? new Date(j.verifiedAt).toLocaleDateString() : "Auto-Published"}
                        </p>
                      </td>
                      <td className="p-3">
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                          ACTIVE DRIVE
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {j.jobDrive?.slug ? (
                          <a
                            href={`/student/placements`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            <span>Student Portal</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">Linked</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ======================================================== */}
      {/* SECTION 8: DUPLICATES & CHANGE PROPOSALS                 */}
      {/* ======================================================== */}
      {activeSection === "duplicates" && (
        <div className="space-y-4">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">
                Job Change Proposals (Recruiter Updated Existing Openings)
              </CardTitle>
              <p className="text-xs text-slate-500">
                When recruiters post updated salary, openings, or deadline for existing drives, changes require approval rather than silent overwrite.
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              {!changeProposals || changeProposals.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No pending change proposals. All existing openings are synchronized.
                </div>
              ) : (
                <div className="space-y-3">
                  {changeProposals.map((p) => {
                    const changes = p.fieldChanges as Record<string, { old: any; new: any }>;
                    return (
                      <div key={p.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{p.jobDrive?.title}</p>
                            <p className="text-[11px] text-indigo-700 font-semibold">{p.jobDrive?.company?.name}</p>
                          </div>

                          <div className="space-y-1">
                            {Object.entries(changes).map(([key, diff]) => (
                              <div key={key} className="text-xs flex items-center gap-2 font-mono">
                                <span className="font-bold text-slate-600">{key}:</span>
                                <span className="text-rose-600 line-through">{String(diff.old || "None")}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <span className="text-emerald-700 font-bold">{String(diff.new)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {p.status === "PENDING" && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reviewProposalMutation.mutate({ proposalId: p.id, action: "REJECT" })}
                              className="h-7 text-xs text-rose-600"
                            >
                              Dismiss
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => reviewProposalMutation.mutate({ proposalId: p.id, action: "APPROVE" })}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            >
                              Accept Changes
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">Prevented Cross-Group Duplicates</CardTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Source & Sender</th>
                    <th className="p-3">Message Snippet</th>
                    <th className="p-3">Received At</th>
                    <th className="p-3">Action Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {duplicateJobs.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-slate-400">No duplicate posts encountered yet.</td></tr>
                  ) : (
                    duplicateJobs.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80">
                        <td className="p-3">
                          <p className="font-bold text-slate-800">{d.senderName || "Unknown"}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{d.channel}</p>
                        </td>
                        <td className="p-3 max-w-md">
                          <p className="line-clamp-2 text-slate-600">{d.rawText}</p>
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">
                          {new Date(d.receivedAt).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-indigo-700 border-indigo-200 bg-indigo-50 text-[10px]">
                            Source Linked (No Duplicate Created)
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 4: INCOMING MESSAGE INBOX                        */}
      {/* ======================================================== */}
      {activeSection === "inbox" && (
        <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900">Incoming Hiring Message Stream</CardTitle>
            <span className="text-xs text-slate-400">Real-time captured WhatsApp raw messages</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Sender / Phone</th>
                  <th className="p-3">Channel / Source</th>
                  <th className="p-3">Message Content</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {messagesLoading ? (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-400">Loading messages...</td></tr>
                ) : !messages || messages.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-400">No incoming messages yet.</td></tr>
                ) : (
                  messages.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{m.senderName || "Unknown"}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{m.senderPhone || "No Phone"}</p>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] font-semibold">{m.source?.name || m.channel}</Badge>
                      </td>
                      <td className="p-3 max-w-lg">
                        <p className="line-clamp-2 text-slate-700">{m.rawText}</p>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.processingStatus === "PUBLISHED"
                              ? "bg-emerald-100 text-emerald-800"
                              : m.processingStatus === "PENDING_VERIFICATION"
                              ? "bg-amber-100 text-amber-800"
                              : m.processingStatus === "DUPLICATE"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {m.processingStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-400 font-mono text-[11px]">
                        {new Date(m.receivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ======================================================== */}
      {/* SECTION 5: ALL AI EXTRACTED JOBS                         */}
      {/* ======================================================== */}
      {activeSection === "extracted" && (
        <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">All Extracted Job Openings</CardTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Role & Company</th>
                  <th className="p-3">Skills</th>
                  <th className="p-3">Experience</th>
                  <th className="p-3">Salary</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!extractedJobs || extractedJobs.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-400">No extracted records.</td></tr>
                ) : (
                  extractedJobs.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/80">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{j.jobTitle}</p>
                        <p className="text-[11px] text-indigo-700 font-semibold">{j.companyName}</p>
                      </td>
                      <td className="p-3">
                        <p className="line-clamp-1 max-w-xs text-slate-600">{j.requiredSkills.join(", ")}</p>
                      </td>
                      <td className="p-3">{j.experienceRequired || "Fresher"}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">{j.salaryPackage || "As per norms"}</td>
                      <td className="p-3 font-mono font-bold">{Math.round(j.confidenceScore * 100)}%</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] font-bold">{j.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ======================================================== */}
      {/* SECTION 10: AUTOMATION SETTINGS & TRUST POLICY           */}
      {/* ======================================================== */}
      {activeSection === "settings" && (
        <div className="space-y-4 max-w-3xl">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">Verification & Trust Policy</CardTitle>
              <p className="text-xs text-slate-500">Configure safety rules, confidence thresholds, and auto-publication.</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-xs font-bold text-slate-800">Operational Verification Mode</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div
                    onClick={() => updateSettingsMutation.mutate({ trustPolicy: "REVIEW_FIRST" })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      config?.trustPolicy === "REVIEW_FIRST"
                        ? "border-indigo-600 bg-indigo-50/40 shadow-xs"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">Mode A: Review First (Default)</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      All new AI-extracted jobs enter the Pending Verification queue. Placement officer manually verifies and approves each job.
                    </p>
                  </div>

                  <div
                    onClick={() => updateSettingsMutation.mutate({ trustPolicy: "CONTROLLED_AUTO_PUBLISH" })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      config?.trustPolicy === "CONTROLLED_AUTO_PUBLISH"
                        ? "border-emerald-600 bg-emerald-50/40 shadow-xs"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">Mode B: Controlled Auto-Publish</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Auto-publishes to Placement CRM only for configured trusted sources with high confidence (≥ 85%) and zero suspicious flags.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label className="text-xs font-bold text-slate-800">
                  Minimum AI Confidence Threshold for Auto-Publish: {Math.round((config?.autoPublishMinScore || 0.85) * 100)}%
                </Label>
                <input
                  type="range"
                  min="60"
                  max="95"
                  value={Math.round((config?.autoPublishMinScore || 0.85) * 100)}
                  onChange={(e) => updateSettingsMutation.mutate({ autoPublishMinScore: parseInt(e.target.value) / 100 })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label className="text-xs font-bold text-slate-800">Ingestion Webhook Secret</Label>
                <Input
                  value={config?.webhookSecret || ""}
                  onChange={(e) => updateSettingsMutation.mutate({ webhookSecret: e.target.value })}
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-slate-400">Used for HMAC SHA-256 validation of incoming webhook payloads.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: TEST INGESTION / PASTE SIMULATOR                */}
      {/* ======================================================== */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-2xl bg-white shadow-xl border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">WhatsApp Ingestion Sandbox & Post Ingestion</CardTitle>
                <p className="text-xs text-slate-500">Test the AI extraction pipeline with raw or Hinglish hiring posts.</p>
              </div>
              <button onClick={() => setShowIngestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Presets */}
              <div>
                <Label className="text-xs font-bold text-slate-700">Quick Test Templates:</Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {sampleJobs.map((sj, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setIngestText(sj.text);
                        setIsBatchMode(false);
                      }}
                      className="p-2 text-left rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-[11px] font-semibold text-slate-800 transition"
                    >
                      {sj.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">Raw Post or Group Chat Export Text *</Label>
                  <label className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBatchMode}
                      onChange={(e) => setIsBatchMode(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span>Batch Export Mode (.txt chat export)</span>
                  </label>
                </div>
                <textarea
                  rows={7}
                  placeholder="Paste WhatsApp message or chat export text here..."
                  value={ingestText}
                  onChange={(e) => setIngestText(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Sender Phone</Label>
                  <Input
                    value={ingestSenderPhone}
                    onChange={(e) => setIngestSenderPhone(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Sender Name / Recruiter</Label>
                  <Input
                    value={ingestSenderName}
                    onChange={(e) => setIngestSenderName(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowIngestModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (isBatchMode) {
                      ingestBatchMutation.mutate({
                        rawBatchText: ingestText,
                        sourceId: selectedSourceId || undefined,
                      });
                    } else {
                      ingestMessageMutation.mutate({
                        rawText: ingestText,
                        senderPhone: ingestSenderPhone,
                        senderName: ingestSenderName,
                        sourceId: selectedSourceId || undefined,
                        channel: "MANUAL_SANDBOX",
                      });
                    }
                  }}
                  disabled={!ingestText.trim() || ingestMessageMutation.isPending || ingestBatchMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  <span>{ingestMessageMutation.isPending || ingestBatchMutation.isPending ? "Extracting..." : "Process Post"}</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD HIRING SOURCE                               */}
      {/* ======================================================== */}
      {showNewSourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white shadow-xl border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">Register Authorized Hiring Source</CardTitle>
              <button onClick={() => setShowNewSourceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div>
                <Label className="text-xs font-semibold">Source Name *</Label>
                <Input
                  placeholder="e.g. Prayagraj IT Recruiters Group"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Source Channel Type</Label>
                <select
                  value={newSourceType}
                  onChange={(e) => setNewSourceType(e.target.value as any)}
                  className="w-full h-8 text-xs rounded-md border border-slate-300 bg-white px-2 mt-1"
                >
                  <option value="WHATSAPP_GROUP">WhatsApp Group (Forwarder / Chat Export)</option>
                  <option value="FORWARDED_MESSAGE">Direct Forwarded Messages</option>
                  <option value="PROVIDER_WEBHOOK">Authorized Provider Webhook</option>
                  <option value="EMAIL_DIGEST">Email Hiring Digest</option>
                  <option value="MANUAL_IMPORT">Manual Batch Upload</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Group / Source Identifier</Label>
                <Input
                  placeholder="e.g. 120363024892@g.us or HR Number"
                  value={newSourceIdentifier}
                  onChange={(e) => setNewSourceIdentifier(e.target.value)}
                  className="text-xs font-mono mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Description & Consent Context</Label>
                <Input
                  placeholder="Recruiter network authorized by Placement Cell"
                  value={newSourceDesc}
                  onChange={(e) => setNewSourceDesc(e.target.value)}
                  className="text-xs mt-1"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newSourceAutoPublish}
                    onChange={(e) => setNewSourceAutoPublish(e.target.checked)}
                    className="rounded accent-emerald-600"
                  />
                  <span>Mark as Auto-Publish Trusted Source (if score ≥ 85%)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowNewSourceModal(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    createSourceMutation.mutate({
                      name: newSourceName,
                      sourceType: newSourceType,
                      identifier: newSourceIdentifier || undefined,
                      description: newSourceDesc || undefined,
                      autoPublishTrust: newSourceAutoPublish,
                    })
                  }
                  disabled={!newSourceName.trim() || createSourceMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Register Source
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: VIEW / EDIT EXTRACTED JOB DETAILS               */}
      {/* ======================================================== */}
      {selectedJob && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-xl bg-white shadow-xl border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Review & Refine Job Opening</CardTitle>
                <p className="text-xs text-slate-500">Edit fields before publishing to Placement CRM.</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Job Title *</Label>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Company Name *</Label>
                  <Input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} className="text-xs mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Salary Package</Label>
                  <Input value={editSalary} onChange={(e) => setEditSalary(e.target.value)} className="text-xs mt-1 font-mono" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Location</Label>
                  <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Openings</Label>
                  <Input
                    type="number"
                    value={editOpenings}
                    onChange={(e) => setEditOpenings(parseInt(e.target.value) || 1)}
                    className="text-xs mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-500">Original WhatsApp Post</Label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono text-[11px] whitespace-pre-wrap max-h-40 overflow-y-auto mt-1">
                  {selectedJob.jobDescription}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(true);
                  }}
                  className="text-xs text-rose-600"
                >
                  Reject Post
                </Button>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedJob(null)} className="text-xs">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      approveJobMutation.mutate({
                        extractedJobId: selectedJob.id,
                        overrides: {
                          jobTitle: editTitle,
                          companyName: editCompany,
                          salaryPackage: editSalary,
                          location: editLocation,
                          openingsCount: editOpenings,
                        },
                      })
                    }
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    Confirm & Publish to CRM
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: REJECT WITH REASON                             */}
      {/* ======================================================== */}
      {showRejectModal && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white shadow-xl border-slate-200">
            <div className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">Reject Hiring Post</CardTitle>
              <p className="text-xs text-slate-500">Provide reason for audit records.</p>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div>
                <Label className="text-xs font-semibold">Rejection Reason *</Label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full h-8 text-xs rounded-md border border-slate-300 bg-white px-2 mt-1"
                >
                  <option value="">Select reason...</option>
                  <option value="Charges registration or recruitment fees (Fraud)">Charges registration or recruitment fees (Fraud)</option>
                  <option value="Unverifiable company or recruiter credentials">Unverifiable company or recruiter credentials</option>
                  <option value="Not relevant to college students or training domains">Not relevant to college students or training domains</option>
                  <option value="Duplicate or expired job drive">Duplicate or expired job drive</option>
                  <option value="Incomplete or spam content">Incomplete or spam content</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowRejectModal(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    rejectJobMutation.mutate({
                      extractedJobId: selectedJob.id,
                      rejectionReason: rejectReason || "Rejected by Placement Officer",
                    })
                  }
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
