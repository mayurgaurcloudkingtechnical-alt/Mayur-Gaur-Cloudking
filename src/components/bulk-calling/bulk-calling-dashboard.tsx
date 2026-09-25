"use client";

import React, { useState, useRef, useEffect } from "react";
import { api } from "@/lib/trpc/react";
import {
  PhoneCall,
  Upload,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Clock,
  Sparkles,
  UserCheck,
  UserX,
  Volume2,
  Trash2,
  Eye,
  Settings,
  ShieldCheck,
  MessageSquare,
  Search,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRoleCode, CallingBatchStatus, CallingQueueStatus, CallingOutcome } from "@prisma/client";

interface BulkCallingDashboardProps {
  userRole: UserRoleCode;
  userId: string;
}

export function BulkCallingDashboard({ userRole, userId }: BulkCallingDashboardProps) {
  const isSuperAdminOrAdmin =
    userRole === UserRoleCode.SUPER_ADMIN ||
    userRole === UserRoleCode.DIRECTOR ||
    userRole === UserRoleCode.ADMIN;

  const [activeTab, setActiveTab] = useState<string>("batches");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Queries
  const { data: batchesData, refetch: refetchBatches, isLoading: loadingBatches } =
    api.bulkCalling.listBatches.useQuery(
      { page: 1, limit: 30 },
      { refetchInterval: 3000 } // Auto-poll every 3s to show real-time one-by-one progress!
    );

  const { data: batchDetails, refetch: refetchDetails } = api.bulkCalling.getBatchDetails.useQuery(
    { batchId: selectedBatchId || "" },
    { enabled: Boolean(selectedBatchId), refetchInterval: 2500 }
  );

  const { data: templateData } = api.bulkCalling.getTemplate.useQuery();
  const { data: globalConfig, refetch: refetchConfig } = api.bulkCalling.getGlobalConfig.useQuery(
    undefined,
    { enabled: isSuperAdminOrAdmin }
  );
  const { data: dncData, refetch: refetchDnc } = api.bulkCalling.listDnc.useQuery(
    { page: 1, limit: 50 },
    { enabled: isSuperAdminOrAdmin }
  );
  const { data: identitiesData, refetch: refetchIdentities } = api.bulkCalling.listIdentities.useQuery(
    undefined,
    { enabled: isSuperAdminOrAdmin }
  );

  // Mutations
  const validateMutation = api.bulkCalling.validateUpload.useMutation();
  const createBatchMutation = api.bulkCalling.createBatch.useMutation();
  const startBatchMutation = api.bulkCalling.startBatch.useMutation();
  const pauseBatchMutation = api.bulkCalling.pauseBatch.useMutation();
  const resumeBatchMutation = api.bulkCalling.resumeBatch.useMutation();
  const stopBatchMutation = api.bulkCalling.stopBatch.useMutation();
  const deleteBatchMutation = api.bulkCalling.deleteBatch.useMutation();
  const updateConfigMutation = api.bulkCalling.updateGlobalConfig.useMutation();
  const upsertIdentityMutation = api.bulkCalling.upsertIdentity.useMutation();
  const addDncMutation = api.bulkCalling.addDnc.useMutation();
  const removeDncMutation = api.bulkCalling.removeDnc.useMutation();
  const simulateCallMutation = api.bulkCalling.simulateCallTurn.useMutation();

  // Settings & Identity Edit State
  const [configSaveStatus, setConfigSaveStatus] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editOfficialNumber, setEditOfficialNumber] = useState<string>("");
  const [editStatus, setEditStatus] = useState<"VERIFIED" | "PENDING_VERIFICATION" | "UNVERIFIED">("VERIFIED");
  const [identitySaveStatus, setIdentitySaveStatus] = useState<string | null>(null);

  // Import State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [rawParsedRows, setRawParsedRows] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [batchName, setBatchName] = useState("");
  const [autoStart, setAutoStart] = useState(false);
  const [callingHoursStart, setCallingHoursStart] = useState("10:00");
  const [callingHoursEnd, setCallingHoursEnd] = useState("19:00");
  const [language, setLanguage] = useState("Hindi");
  const [openingScript, setOpeningScript] = useState("");
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Transcript view modal
  const [viewingItem, setViewingItem] = useState<any | null>(null);

  // DNC input
  const [newDncPhone, setNewDncPhone] = useState("");
  const [newDncReason, setNewDncReason] = useState("");

  // Simulator state
  const [simLeadName, setSimLeadName] = useState("Rahul Kumar");
  const [simPhone, setSimPhone] = useState("9876543210");
  const [simCourse, setSimCourse] = useState("Artificial Intelligence & Machine Learning");
  const [simScenario, setSimScenario] = useState<any>("INTERESTED_STUDENT");
  const [simResult, setSimResult] = useState<any | null>(null);

  // Handle template download
  const handleDownloadTemplate = () => {
    if (!templateData) return;
    const headers = templateData.headers.join(",");
    const rows = templateData.sampleRows
      .map((row) =>
        templateData.headers
          .map((h) => {
            const val = row[h as keyof typeof row] || "";
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "SoftLab_Global_Calling_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV / Text
  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
      const res: string[] = [];
      let cur = "";
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQ && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQ = !inQ;
          }
        } else if (c === "," && !inQ) {
          res.push(cur);
          cur = "";
        } else {
          cur += c;
        }
      }
      res.push(cur);
      return res;
    };

    const headers = parseLine(lines[0] || "").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
    const records: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const vals = parseLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = (vals[idx] || "").trim();
      });

      const phone = row["phone"] || row["phonenumber"] || row["mobile"] || row["mobilenumber"] || row["contact"];
      if (phone) {
        records.push({
          name: row["name"] || row["fullname"] || row["studentname"],
          phone,
          alternatePhone: row["alternatephone"] || row["altphone"],
          email: row["email"] || row["emailaddress"],
          city: row["city"] || row["location"],
          state: row["state"],
          course: row["course"] || row["coursetitle"] || row["program"],
          source: row["source"] || "BULK_UPLOAD",
          campaign: row["campaign"] || row["campaignname"],
          language: row["language"] || row["lang"] || "Hindi",
          remarks: row["remarks"] || row["notes"],
          consent: row["consent"] || row["permission"] || "YES",
          customFields: row["customfields"] || row["custom"],
        });
      }
    }
    return records;
  };

  // Handle file selection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setParsingFile(true);
    setValidationResult(null);
    setImportSuccessMessage(null);

    const defaultName = `SoftLab Global Leads - ${file.name.replace(/\.[^/.]+$/, "")} (${new Date().toLocaleDateString("en-IN")})`;
    setBatchName(defaultName);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (extension === "csv" || extension === "txt") {
        const text = await file.text();
        const parsed = parseCsvText(text);
        setRawParsedRows(parsed);

        // Run Pre-Upload Validation through TRPC
        const result = await validateMutation.mutateAsync({ rows: parsed });
        setValidationResult(result);
      } else {
        // For .xlsx / .xls, dynamically load SheetJS from CDN or fallback
        if (typeof window !== "undefined" && !(window as any).XLSX) {
          const script = document.createElement("script");
          script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
          document.head.appendChild(script);
          await new Promise((res) => (script.onload = res));
        }

        const data = await file.arrayBuffer();
        const XLSX = (window as any).XLSX;
        if (!XLSX) {
          throw new Error("Excel reader library could not be loaded. Please convert to CSV and re-upload.");
        }

        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const formatted = jsonRows.map((row) => {
          const keys = Object.keys(row);
          const getVal = (colMatch: string) => {
            const foundKey = keys.find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, "").includes(colMatch));
            return foundKey ? String(row[foundKey]).trim() : "";
          };

          return {
            name: getVal("name"),
            phone: getVal("phone") || getVal("mobile") || getVal("contact"),
            alternatePhone: getVal("alt"),
            email: getVal("email"),
            city: getVal("city"),
            state: getVal("state"),
            course: getVal("course") || getVal("program"),
            source: getVal("source") || "EXCEL_IMPORT",
            campaign: getVal("campaign"),
            language: getVal("lang") || "Hindi",
            remarks: getVal("remark") || getVal("note"),
            consent: getVal("consent") || "YES",
            customFields: getVal("custom"),
          };
        }).filter((r) => Boolean(r.phone));

        setRawParsedRows(formatted);
        const result = await validateMutation.mutateAsync({ rows: formatted });
        setValidationResult(result);
      }
    } catch (err: any) {
      alert("Error parsing file: " + (err.message || "Unknown error"));
    } finally {
      setParsingFile(false);
    }
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    if (!validationResult || !validationResult.rows) return;

    try {
      const res = await createBatchMutation.mutateAsync({
        batchName: batchName.trim() || `SoftLab Global Batch - ${new Date().toLocaleDateString("en-IN")}`,
        fileName: uploadedFile?.name || "leads.csv",
        autoStart,
        callingHoursStart,
        callingHoursEnd,
        language,
        openingScript: openingScript.trim() || undefined,
        voiceProvider: "SIMULATOR",
        validatedRows: validationResult.rows,
      });

      setImportSuccessMessage(`Batch "${res.batchName}" created successfully! ${res.callableCount} callable leads queued.`);
      setUploadedFile(null);
      setValidationResult(null);
      setRawParsedRows([]);
      refetchBatches();
      setSelectedBatchId(res.batchId);
      setActiveTab("batches");
    } catch (err: any) {
      alert("Failed to create calling batch: " + err.message);
    }
  };

  // Batch action handlers
  const handleStartBatch = async (batchId: string) => {
    const res = await startBatchMutation.mutateAsync({ batchId });
    if (!res.success) alert(res.message);
    refetchBatches();
    if (selectedBatchId === batchId) refetchDetails();
  };

  const handlePauseBatch = async (batchId: string) => {
    await pauseBatchMutation.mutateAsync({ batchId });
    refetchBatches();
    if (selectedBatchId === batchId) refetchDetails();
  };

  const handleResumeBatch = async (batchId: string) => {
    const res = await resumeBatchMutation.mutateAsync({ batchId });
    if (!res.success) alert(res.message);
    refetchBatches();
    if (selectedBatchId === batchId) refetchDetails();
  };

  const handleStopBatch = async (batchId: string) => {
    if (confirm("Are you sure you want to stop this calling batch permanently?")) {
      await stopBatchMutation.mutateAsync({ batchId });
      refetchBatches();
      if (selectedBatchId === batchId) refetchDetails();
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (confirm("Are you sure you want to delete this batch and its queue history?")) {
      await deleteBatchMutation.mutateAsync({ batchId });
      refetchBatches();
      if (selectedBatchId === batchId) setSelectedBatchId(null);
    }
  };

  // Export Results
  const exportQuery = api.bulkCalling.exportBatchResults.useQuery(
    { batchId: selectedBatchId || "" },
    { enabled: false }
  );

  const handleExportBatchResults = async (batchId: string) => {
    setSelectedBatchId(batchId);
    const { data } = await exportQuery.refetch();
    if (!data || !data.rows || data.rows.length === 0) {
      alert("No calling records available to export.");
      return;
    }

    const headers = Object.keys(data.rows[0] || {}).join(",");
    const csvRows = data.rows
      .map((r: any) =>
        Object.values(r)
          .map((v) => `"${String(v || "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([`${headers}\n${csvRows}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", data.fileName || "Calling_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulator Run
  const handleRunSimulator = async () => {
    const res = await simulateCallMutation.mutateAsync({
      leadName: simLeadName,
      phone: simPhone,
      courseTitle: simCourse,
      scenario: simScenario,
      language: "Hindi",
    });
    setSimResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Role Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#0088cc]/10 text-[#0088cc]">
              <PhoneCall className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>AI Bulk Data Import & Outbound Calling Automation</span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
                  Active Isolated Module
                </Badge>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Role-based Excel ingestion, controlled one-by-one AI calling, LMS lead deduplication, and automated follow-ups.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-slate-900 text-white font-mono text-xs px-3 py-1">
            Role: {userRole}
          </Badge>
          <Button
            size="sm"
            onClick={handleDownloadTemplate}
            variant="outline"
            className="gap-1.5 text-xs font-bold border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-[#0088cc]" />
            <span>Download Excel Template</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveTab("import")}
            className="gap-1.5 text-xs font-bold bg-[#0088cc] hover:bg-[#0077b3] text-white shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New Batch</span>
          </Button>
        </div>
      </div>

      {importSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importSuccessMessage}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setImportSuccessMessage(null)}
            className="h-6 text-xs text-emerald-700 hover:bg-emerald-100"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200">
          <TabsTrigger value="batches" className="text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
            <span>Calling Batches ({batchesData?.total || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Upload className="w-3.5 h-3.5 text-[#0088cc]" />
            <span>New Bulk Import & Pre-Validation</span>
          </TabsTrigger>
          <TabsTrigger value="monitor" className="text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Queue & Live Calling Monitor</span>
          </TabsTrigger>
          <TabsTrigger value="simulator" className="text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI Call Simulator & Test Bench</span>
          </TabsTrigger>
          {isSuperAdminOrAdmin && (
            <TabsTrigger value="settings" className="text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Settings className="w-3.5 h-3.5 text-slate-700" />
              <span>Settings & Compliance</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* =================================================================== */}
        {/* TAB 1: CALLING BATCHES DASHBOARD */}
        {/* =================================================================== */}
        <TabsContent value="batches" className="space-y-4 pt-2">
          {loadingBatches ? (
            <div className="py-16 text-center text-xs text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0088cc] mb-2" />
              Loading calling batches...
            </div>
          ) : !batchesData?.items || batchesData.items.length === 0 ? (
            <Card className="border-dashed border-2 text-center py-16">
              <CardContent className="space-y-3">
                <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">No Calling Batches Uploaded Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload an Excel or CSV lead list to launch automated one-by-one AI outreach for SoftLab Global.
                </p>
                <Button
                  size="sm"
                  onClick={() => setActiveTab("import")}
                  className="bg-[#0088cc] text-white font-bold text-xs"
                >
                  Upload First Batch
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {batchesData.items.map((batch) => {
                const totalCallable = batch.callableRows || 1;
                const progress = Math.min(100, Math.round((batch.completedCalls / totalCallable) * 100));

                let badgeColor = "bg-slate-100 text-slate-700 border-slate-300";
                if (batch.status === "RUNNING") badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse";
                else if (batch.status === "PAUSED") badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
                else if (batch.status === "COMPLETED") badgeColor = "bg-blue-100 text-blue-800 border-blue-300";
                else if (batch.status === "STOPPED") badgeColor = "bg-rose-100 text-rose-800 border-rose-300";

                return (
                  <Card key={batch.id} className="border border-slate-200 hover:border-slate-300 shadow-sm transition-all">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-base">{batch.batchName}</span>
                            <Badge variant="outline" className={`text-[10px] font-extrabold px-2 py-0.5 ${badgeColor}`}>
                              {batch.status}
                            </Badge>
                            {batch.autoStart && (
                              <Badge className="bg-indigo-600 text-white text-[9.5px]">Auto-Start ON</Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            File: <span className="font-mono text-slate-700">{batch.fileName}</span> • Uploaded by:{" "}
                            <span className="font-semibold text-slate-700">
                              {batch.uploadedBy?.firstName} {batch.uploadedBy?.lastName} ({batch.uploadedBy?.roleCode})
                            </span>{" "}
                            • {new Date(batch.createdAt).toLocaleString("en-IN")}
                          </p>
                        </div>

                        {/* Batch Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          {batch.status === "READY" && (
                            <Button
                              size="sm"
                              onClick={() => handleStartBatch(batch.id)}
                              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Start Calling</span>
                            </Button>
                          )}
                          {batch.status === "RUNNING" && (
                            <Button
                              size="sm"
                              onClick={() => handlePauseBatch(batch.id)}
                              className="h-8 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white gap-1"
                            >
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pause</span>
                            </Button>
                          )}
                          {batch.status === "PAUSED" && (
                            <Button
                              size="sm"
                              onClick={() => handleResumeBatch(batch.id)}
                              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Resume</span>
                            </Button>
                          )}
                          {(batch.status === "RUNNING" || batch.status === "PAUSED") && (
                            <Button
                              size="sm"
                              onClick={() => handleStopBatch(batch.id)}
                              variant="outline"
                              className="h-8 text-xs font-bold border-rose-300 text-rose-700 hover:bg-rose-50 gap-1"
                            >
                              <Square className="w-3 h-3" />
                              <span>Stop</span>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBatchId(batch.id);
                              setActiveTab("monitor");
                            }}
                            className="h-8 text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-50 gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Queue</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportBatchResults(batch.id)}
                            className="h-8 text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-50 gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export CSV</span>
                          </Button>

                          {batch.status !== "RUNNING" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteBatch(batch.id)}
                              className="h-8 text-xs text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-1 space-y-3">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                          <span>
                            Progress: {batch.completedCalls} / {batch.callableRows} Completed ({progress}%)
                          </span>
                          <span>
                            {Math.max(0, batch.callableRows - batch.completedCalls)} Remaining in Queue
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full transition-all duration-500 ${
                              batch.status === "COMPLETED" ? "bg-blue-600" : "bg-emerald-500"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Stat Tiles */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Total Rows</span>
                          <span className="font-bold text-slate-900 text-sm">{batch.totalRows}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Callable</span>
                          <span className="font-bold text-slate-900 text-sm">{batch.callableRows}</span>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-emerald-800">
                          <span className="block text-[10px] uppercase font-semibold">🔥 Interested</span>
                          <span className="font-black text-sm">{batch.interestedCount}</span>
                        </div>
                        <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 text-amber-800">
                          <span className="block text-[10px] uppercase font-semibold">⏰ Follow-up</span>
                          <span className="font-black text-sm">{batch.followUpCount}</span>
                        </div>
                        <div className="bg-rose-50 p-2 rounded-lg border border-rose-200 text-rose-800">
                          <span className="block text-[10px] uppercase font-semibold">🚨 Handoffs</span>
                          <span className="font-black text-sm">{batch.humanHandoffCount}</span>
                        </div>
                        <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 text-slate-700">
                          <span className="block text-[10px] uppercase font-semibold">❌ Not Inter.</span>
                          <span className="font-black text-sm">{batch.notInterestedCount}</span>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-200 text-blue-800">
                          <span className="block text-[10px] uppercase font-semibold">Hours</span>
                          <span className="font-mono text-xs font-bold">
                            {batch.callingHoursStart}-{batch.callingHoursEnd}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* =================================================================== */}
        {/* TAB 2: NEW BULK IMPORT & PRE-UPLOAD VALIDATION */}
        {/* =================================================================== */}
        <TabsContent value="import" className="space-y-4 pt-2">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="p-5 border-b">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#0088cc]" />
                <span>Upload Excel / CSV Lead Dataset</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Supports .xlsx, .xls, and .csv files. Comprehensive validation checks phone format, internal duplicates, existing LMS leads, and DNC list before queueing.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-6">
              {/* File upload zone */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                <input
                  type="file"
                  id="excel-file-upload"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="excel-file-upload" className="cursor-pointer space-y-2 block">
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto text-[#0088cc] border border-slate-200">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-slate-800 text-sm">
                    {uploadedFile ? uploadedFile.name : "Click to select or drag & drop .xlsx, .xls, or .csv file"}
                  </p>
                  <p className="text-xs text-slate-400">
                    Minimum required field: Phone Number (10 digits). Optional: Name, Email, Course, Remarks, Consent.
                  </p>
                </label>
              </div>

              {parsingFile && (
                <div className="py-6 text-center text-xs font-semibold text-slate-600 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0088cc]" />
                  <span>Validating records against LMS database & compliance rules...</span>
                </div>
              )}

              {/* Pre-Upload Validation Summary */}
              {validationResult && (
                <div className="space-y-5 border-t pt-5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Pre-Upload Validation Results</span>
                    </h4>
                    <span className="text-xs font-semibold text-slate-500">
                      Total Analyzed: {validationResult.totalRows} Rows
                    </span>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-center text-xs">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900">
                      <span className="block text-[10px] font-bold uppercase text-emerald-700">Eligible to Call</span>
                      <span className="text-xl font-black">{validationResult.callableRows}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800">
                      <span className="block text-[10px] font-bold uppercase text-slate-500">Valid Rows</span>
                      <span className="text-xl font-black">{validationResult.validRows}</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">
                      <span className="block text-[10px] font-bold uppercase text-amber-700">Batch Duplicates</span>
                      <span className="text-xl font-black">{validationResult.duplicateRows}</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-900">
                      <span className="block text-[10px] font-bold uppercase text-blue-700">Existing LMS Leads</span>
                      <span className="text-xl font-black">{validationResult.duplicateLmsRows}</span>
                      <span className="block text-[9px] text-blue-600">Will update timeline</span>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900">
                      <span className="block text-[10px] font-bold uppercase text-rose-700">DNC / Opt-Out</span>
                      <span className="text-xl font-black">{validationResult.dncRows}</span>
                    </div>
                    <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-slate-600">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Skipped / Invalid</span>
                      <span className="text-xl font-black">{validationResult.invalidRows + validationResult.skippedRows}</span>
                    </div>
                  </div>

                  {/* Batch Settings Form */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Calling Batch Configuration
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Batch Name *</label>
                        <Input
                          value={batchName}
                          onChange={(e) => setBatchName(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Primary Language</label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="h-8 text-xs border rounded-md px-2 w-full bg-white font-medium"
                        >
                          <option value="Hindi">Hindi (Official SoftLab Global Voice)</option>
                          <option value="English">English</option>
                          <option value="Hinglish">Hinglish</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block font-semibold text-slate-700 mb-1">Calling Window (Start)</label>
                          <Input
                            type="time"
                            value={callingHoursStart}
                            onChange={(e) => setCallingHoursStart(e.target.value)}
                            className="h-8 text-xs bg-white font-mono"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block font-semibold text-slate-700 mb-1">Calling Window (End)</label>
                          <Input
                            type="time"
                            value={callingHoursEnd}
                            onChange={(e) => setCallingHoursEnd(e.target.value)}
                            className="h-8 text-xs bg-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-4">
                        <input
                          type="checkbox"
                          id="auto-start-toggle"
                          checked={autoStart}
                          onChange={(e) => setAutoStart(e.target.checked)}
                          className="w-4 h-4 rounded text-[#0088cc] cursor-pointer"
                        />
                        <label htmlFor="auto-start-toggle" className="cursor-pointer select-none">
                          <span className="font-bold text-slate-900 block">Auto-Start Calling</span>
                          <span className="text-[11px] text-slate-500">
                            Immediately start calling queue after import (within calling hours).
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Preview Table of First 8 Rows */}
                  <div>
                    <h5 className="font-bold text-xs text-slate-700 mb-2">Sample Preview (First 8 Rows):</h5>
                    <div className="border rounded-xl overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 border-b text-slate-600 font-semibold">
                          <tr>
                            <th className="p-2 w-8">#</th>
                            <th className="p-2">Name</th>
                            <th className="p-2">Phone</th>
                            <th className="p-2">Course</th>
                            <th className="p-2">City</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {validationResult.rows.slice(0, 8).map((r: any) => (
                            <tr key={r.index} className={!r.isCallable ? "bg-slate-50/50" : ""}>
                              <td className="p-2 font-mono text-slate-500">{r.index}</td>
                              <td className="p-2 font-semibold text-slate-900">{r.name}</td>
                              <td className="p-2 font-mono">{r.phone}</td>
                              <td className="p-2 text-slate-700">{r.matchedCourseTitle || r.course || "General"}</td>
                              <td className="p-2 text-slate-500">{r.city || "-"}</td>
                              <td className="p-2">
                                {r.isCallable ? (
                                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Callable</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
                                    Skipped
                                  </Badge>
                                )}
                              </td>
                              <td className="p-2 text-[11px] text-slate-500">
                                {r.skipReason || (r.isDuplicateInLms ? "Existing LMS Lead (Timeline Sync)" : "Valid")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Confirmation Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUploadedFile(null);
                        setValidationResult(null);
                      }}
                      className="text-xs h-9 text-slate-600"
                    >
                      Cancel & Re-Upload
                    </Button>
                    <Button
                      onClick={handleConfirmImport}
                      disabled={createBatchMutation.isPending}
                      className="h-9 text-xs font-bold bg-[#0088cc] hover:bg-[#0077b3] text-white gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Confirm & Import {validationResult.callableRows} Callable Leads
                      </span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* =================================================================== */}
        {/* TAB 3: QUEUE & LIVE CALLING MONITOR */}
        {/* =================================================================== */}
        <TabsContent value="monitor" className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-700">Select Batch to Monitor:</span>
              <select
                value={selectedBatchId || ""}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="h-8 text-xs border rounded-lg px-2 bg-white font-semibold"
              >
                <option value="">-- Choose Batch --</option>
                {batchesData?.items.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchName} ({b.status})
                  </option>
                ))}
              </select>
            </div>

            {selectedBatchId && batchDetails && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Calling Status:
                </span>
                <Badge className="text-xs font-extrabold uppercase">
                  {batchDetails.batch.status}
                </Badge>
                {batchDetails.batch.status === "RUNNING" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePauseBatch(batchDetails.batch.id)}
                    className="h-7 text-xs font-bold text-amber-700 border-amber-300"
                  >
                    Pause
                  </Button>
                )}
                {batchDetails.batch.status === "PAUSED" && (
                  <Button
                    size="sm"
                    onClick={() => handleResumeBatch(batchDetails.batch.id)}
                    className="h-7 text-xs font-bold bg-emerald-600 text-white"
                  >
                    Resume
                  </Button>
                )}
              </div>
            )}
          </div>

          {!selectedBatchId || !batchDetails ? (
            <Card className="text-center py-12">
              <CardContent className="space-y-2">
                <Volume2 className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-semibold">
                  Please select a calling batch above to monitor queue progress and inspect AI conversation records.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Batch Live Metrics Header */}
              <div className="bg-white p-4 rounded-xl border grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-lg border">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Queue Total</span>
                  <span className="font-bold text-base">{batchDetails.totalQueueItems}</span>
                </div>
                <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-emerald-900">
                  <span className="text-[10px] uppercase block font-semibold">Completed Calls</span>
                  <span className="font-black text-base">{batchDetails.batch.completedCalls}</span>
                </div>
                <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 text-amber-900">
                  <span className="text-[10px] uppercase block font-semibold">Interested</span>
                  <span className="font-black text-base">{batchDetails.batch.interestedCount}</span>
                </div>
                <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-200 text-indigo-900">
                  <span className="text-[10px] uppercase block font-semibold">Scheduled Follow-ups</span>
                  <span className="font-black text-base">{batchDetails.batch.followUpCount}</span>
                </div>
                <div className="bg-rose-50 p-2 rounded-lg border border-rose-200 text-rose-900">
                  <span className="text-[10px] uppercase block font-semibold">Human Handoffs</span>
                  <span className="font-black text-base">{batchDetails.batch.humanHandoffCount}</span>
                </div>
                <div className="bg-slate-100 p-2 rounded-lg border text-slate-700">
                  <span className="text-[10px] uppercase block font-semibold">Not Interested</span>
                  <span className="font-black text-base">{batchDetails.batch.notInterestedCount}</span>
                </div>
              </div>

              {/* Sequential Queue Table */}
              <Card className="border">
                <CardHeader className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Sequential Calling Order (Controlled Concurrency: 1 Outbound Call at a Time)
                    </CardTitle>
                    <span className="text-xs text-slate-500">
                      Showing Page {batchDetails.page} of {batchDetails.totalPages}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 border-b text-slate-600 font-semibold">
                        <tr>
                          <th className="p-2.5 w-10 text-center">Pos</th>
                          <th className="p-2.5">Candidate Name</th>
                          <th className="p-2.5">Phone</th>
                          <th className="p-2.5">Target Course</th>
                          <th className="p-2.5">Queue Status</th>
                          <th className="p-2.5">Call Outcome</th>
                          <th className="p-2.5">AI Intent</th>
                          <th className="p-2.5">Duration</th>
                          <th className="p-2.5">LMS Status</th>
                          <th className="p-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {batchDetails.queueItems.map((item) => {
                          let statusBadge = "bg-slate-100 text-slate-700";
                          if (item.status === "CALLING") statusBadge = "bg-emerald-500 text-white animate-pulse";
                          else if (item.status === "COMPLETED") statusBadge = "bg-emerald-100 text-emerald-800";
                          else if (item.status === "RETRYING") statusBadge = "bg-amber-100 text-amber-800";
                          else if (item.status === "DO_NOT_CALL") statusBadge = "bg-rose-100 text-rose-800";

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/70">
                              <td className="p-2.5 text-center font-mono font-bold text-slate-500">
                                {item.queuePosition}
                              </td>
                              <td className="p-2.5 font-bold text-slate-900">{item.name || "Prospective Learner"}</td>
                              <td className="p-2.5 font-mono">{item.phone}</td>
                              <td className="p-2.5 text-slate-700">{item.course || "General"}</td>
                              <td className="p-2.5">
                                <Badge variant="outline" className={`text-[9.5px] font-bold ${statusBadge}`}>
                                  {item.status}
                                </Badge>
                              </td>
                              <td className="p-2.5 font-semibold text-slate-800">
                                {item.callOutcome || "-"}
                              </td>
                              <td className="p-2.5">
                                {item.interestLevel ? (
                                  <Badge
                                    className={`text-[9px] ${
                                      item.interestLevel === "HOT"
                                        ? "bg-rose-600 text-white"
                                        : item.interestLevel === "WARM"
                                        ? "bg-amber-500 text-white"
                                        : "bg-slate-200 text-slate-700"
                                    }`}
                                  >
                                    {item.interestLevel}
                                  </Badge>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2.5 font-mono text-slate-600">
                                {item.callDurationSeconds ? `${item.callDurationSeconds}s` : "-"}
                              </td>
                              <td className="p-2.5 text-[11px]">
                                {item.leadId ? (
                                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {item.isExistingLead ? "Updated Lead" : "New Lead Created"}
                                  </span>
                                ) : item.skipReason ? (
                                  <span className="text-slate-400 italic">{item.skipReason}</span>
                                ) : (
                                  <span className="text-slate-400">Pending</span>
                                )}
                              </td>
                              <td className="p-2.5 text-right">
                                {item.transcript ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setViewingItem(item)}
                                    className="h-6 text-[10px] font-bold text-[#0088cc] border-[#0088cc]/30 hover:bg-[#0088cc]/10"
                                  >
                                    Transcript
                                  </Button>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* =================================================================== */}
        {/* TAB 4: AI CALL SIMULATOR & TEST BENCH */}
        {/* =================================================================== */}
        <TabsContent value="simulator" className="space-y-4 pt-2">
          <Card className="border shadow-sm">
            <CardHeader className="p-5 border-b">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>AI Call Simulator & Test Bench</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Test the SoftLab Global AI caller dialogue engine, Hindi/English responses, intent recognition, objection handling, and automatic lead creation without placing a physical call.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Candidate Name</label>
                  <Input
                    value={simLeadName}
                    onChange={(e) => setSimLeadName(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <Input
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course Inquired</label>
                  <Input
                    value={simCourse}
                    onChange={(e) => setSimCourse(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Test Scenario</label>
                  <select
                    value={simScenario}
                    onChange={(e) => setSimScenario(e.target.value)}
                    className="h-8 text-xs border rounded-md px-2 w-full bg-white font-semibold"
                  >
                    <option value="INTERESTED_STUDENT">1. Interested BCA Student (Demo Scheduled)</option>
                    <option value="WORKING_PRO_WEEKEND">2. Working Professional (Weekend Batch)</option>
                    <option value="CALL_BACK_TOMORROW">3. Callback Tomorrow (Driving)</option>
                    <option value="PRICE_QUERY">4. Fee & EMI Discount Query</option>
                    <option value="HUMAN_HANDOFF">5. Human Counselor Request</option>
                    <option value="NOT_INTERESTED">6. Not Interested (Form by Mistake)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleRunSimulator}
                  disabled={simulateCallMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 gap-1.5 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute Simulated Call</span>
                </Button>
              </div>

              {simResult && (
                <div className="border rounded-2xl p-5 bg-slate-50 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">Simulation Results:</span>
                      <Badge className="bg-emerald-600 text-white font-bold">{simResult.callOutcome}</Badge>
                      <Badge className="bg-amber-500 text-white font-bold">Intent: {simResult.interestLevel}</Badge>
                      {simResult.humanHandoffRequired && (
                        <Badge className="bg-rose-600 text-white font-bold">🚨 Human Handoff</Badge>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      Duration: {simResult.durationSeconds}s
                    </span>
                  </div>

                  {/* Summary & Recommended Action */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-white p-3 rounded-xl border">
                      <span className="font-bold text-slate-900 block mb-1">AI Conversation Summary:</span>
                      <p className="text-slate-600 leading-relaxed">{simResult.conversationSummary}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border">
                      <span className="font-bold text-slate-900 block mb-1">Recommended Telecaller Action:</span>
                      <p className="text-slate-600 leading-relaxed">{simResult.recommendedAction}</p>
                    </div>
                  </div>

                  {/* Dialogue Turns */}
                  <div className="bg-white p-4 rounded-xl border space-y-3">
                    <span className="font-bold text-xs text-slate-900 block">
                      Live Transcript (SoftLab Global Identity):
                    </span>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {simResult.transcript.map((t: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                            t.role === "agent"
                              ? "bg-[#0088cc]/10 text-slate-900 border border-[#0088cc]/20 ml-0 mr-auto"
                              : "bg-slate-100 text-slate-900 border border-slate-200 ml-auto mr-0 text-right"
                          }`}
                        >
                          <span className="block font-bold text-[10px] text-slate-500 mb-0.5">
                            {t.role === "agent" ? "🤖 SoftLab Global AI Assistant" : "👤 Candidate"} • {t.timestamp}
                          </span>
                          <p className="leading-snug">{t.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* =================================================================== */}
        {/* TAB 5: SETTINGS & COMPLIANCE (Super Admin & Admin Only) */}
        {/* =================================================================== */}
        {isSuperAdminOrAdmin && (
          <TabsContent value="settings" className="space-y-6 pt-2">
            {/* SECTION 1: GLOBAL CALLING & KNOWLEDGE CONFIG */}
            <Card className="border shadow-sm">
              <CardHeader className="p-5 border-b">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-slate-700" />
                    <span>Global AI Calling Configuration & Business Identity</span>
                  </div>
                  {configSaveStatus && (
                    <Badge className="bg-emerald-600 text-white text-xs">{configSaveStatus}</Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Configure calling windows, concurrency, telephony engine, and verified SoftLab Global Civil Lines Prayagraj claims.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                {globalConfig && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const getVal = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value;

                      await updateConfigMutation.mutateAsync({
                        callingHoursStart: getVal("callingHoursStart") || "10:00",
                        callingHoursEnd: getVal("callingHoursEnd") || "19:00",
                        defaultConcurrency: parseInt(getVal("defaultConcurrency") || "1", 10),
                        maxRetries: parseInt(getVal("maxRetries") || "3", 10),
                        retryDelayMinutes: parseInt(getVal("retryDelayMinutes") || "30", 10),
                        autoStartDefault: false,
                        defaultProvider: getVal("defaultProvider") || "SIMULATOR",
                        defaultLanguage: "hi-IN",
                        campusLocation: getVal("campusLocation") || "Civil Lines, Prayagraj, Uttar Pradesh",
                        corporateRecruitingPartnersCount: getVal("corporateRecruitingPartnersCount") || "1200+",
                        placementClaim: getVal("placementClaim") || "100% Placement Support & Dedicated Placement Cell",
                        practicalProjectClaim: getVal("practicalProjectClaim") || "Live Industry Projects & Git/GitHub Repositories",
                        websiteUrl: getVal("websiteUrl") || "https://softlabglobal.com",
                      });

                      setConfigSaveStatus("Configuration saved successfully!");
                      setTimeout(() => setConfigSaveStatus(null), 3500);
                      refetchConfig();
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Default Calling Hours (Start - End)
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            name="callingHoursStart"
                            defaultValue={globalConfig.callingHoursStart}
                            className="h-8 text-xs font-mono"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            name="callingHoursEnd"
                            defaultValue={globalConfig.callingHoursEnd}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Active Call Concurrency (Per Queue)
                        </label>
                        <Input
                          type="number"
                          name="defaultConcurrency"
                          defaultValue={globalConfig.defaultConcurrency}
                          min={1}
                          max={10}
                          className="h-8 text-xs font-mono"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Default is 1 (Strict sequential calling).
                        </span>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Max Retry Attempts
                        </label>
                        <Input
                          type="number"
                          name="maxRetries"
                          defaultValue={globalConfig.maxRetries}
                          min={1}
                          max={5}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Claims and Business Identity Sub-Grid */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#0088cc]" />
                        <span>Verified SoftLab Global Business Claims & Pitch Identity</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Campus Location
                          </label>
                          <Input
                            name="campusLocation"
                            defaultValue={globalConfig.campusLocation || "Civil Lines, Prayagraj, Uttar Pradesh"}
                            className="h-8 text-xs"
                          />
                          <span className="text-[10px] text-slate-500">
                            Strict location: Civil Lines, Prayagraj (Zero Noida references permitted)
                          </span>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Corporate Recruiting Partners Count
                          </label>
                          <Input
                            name="corporateRecruitingPartnersCount"
                            defaultValue={globalConfig.corporateRecruitingPartnersCount || "1200+"}
                            className="h-8 text-xs font-mono font-bold"
                          />
                          <span className="text-[10px] text-slate-500">
                            Verified website count (e.g. 1200+). Dynamically spoken in AI pitch.
                          </span>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Placement Support Claim
                          </label>
                          <Input
                            name="placementClaim"
                            defaultValue={globalConfig.placementClaim || "100% Placement Support & Dedicated Placement Cell"}
                            className="h-8 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Practical Training Claim
                          </label>
                          <Input
                            name="practicalProjectClaim"
                            defaultValue={globalConfig.practicalProjectClaim || "Live Industry Projects & Git/GitHub Repositories"}
                            className="h-8 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Voice Telephony Engine
                          </label>
                          <select
                            name="defaultProvider"
                            defaultValue={globalConfig.defaultProvider || "SIMULATOR"}
                            className="w-full h-8 text-xs border rounded-md px-2 bg-white font-mono"
                          >
                            <option value="SIMULATOR">SIMULATOR (High-Fidelity Dialogue Test Engine)</option>
                            <option value="TWILIO">TWILIO (Production Telephony)</option>
                            <option value="EXOTEL">EXOTEL (Indian Telephony)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Website Link
                          </label>
                          <Input
                            name="websiteUrl"
                            defaultValue={globalConfig.websiteUrl || "https://softlabglobal.com"}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-xs"
                      >
                        Save Global Configuration
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* SECTION 2: AI CALLING IDENTITIES & ROLE PROFILES */}
            <Card className="border shadow-sm">
              <CardHeader className="p-5 border-b">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-indigo-600" />
                    <span>Counselor & Telecaller AI Calling Identities</span>
                  </div>
                  {identitySaveStatus && (
                    <Badge className="bg-emerald-600 text-white text-xs">{identitySaveStatus}</Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Role-based dynamic caller ID. When AI calls on behalf of a counselor or telecaller, their official phone number is dynamically presented as Caller ID. Missing numbers skip with <code>CALLER_NUMBER_NOT_CONFIGURED</code>.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 border-b text-slate-700 font-bold">
                      <tr>
                        <th className="p-3">User & Email</th>
                        <th className="p-3">LMS Role</th>
                        <th className="p-3">Profile Phone</th>
                        <th className="p-3">Official AI Caller Number</th>
                        <th className="p-3">Verification Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {identitiesData && identitiesData.length > 0 ? (
                        identitiesData.map((u) => {
                          const isEditing = editingUserId === u.userId;
                          const hasNumber = Boolean(u.officialNumber);

                          return (
                            <tr key={u.userId} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-semibold text-slate-900">
                                <div>{u.name}</div>
                                <div className="text-[11px] text-slate-400 font-normal">{u.email}</div>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline" className="font-mono text-[10px] font-bold">
                                  {u.roleCode}
                                </Badge>
                              </td>
                              <td className="p-3 font-mono text-slate-600">
                                {u.profilePhone || u.profileCallingNumber || "—"}
                              </td>
                              <td className="p-3">
                                {isEditing ? (
                                  <Input
                                    value={editOfficialNumber}
                                    onChange={(e) => setEditOfficialNumber(e.target.value)}
                                    placeholder="+91..."
                                    className="h-7 text-xs font-mono w-36"
                                  />
                                ) : (
                                  <span className={`font-mono font-bold ${hasNumber ? "text-slate-800" : "text-rose-500 italic"}`}>
                                    {u.officialNumber || "Not Configured"}
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                {isEditing ? (
                                  <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value as any)}
                                    className="h-7 text-xs border rounded px-1.5 bg-white font-semibold"
                                  >
                                    <option value="VERIFIED">VERIFIED</option>
                                    <option value="PENDING_VERIFICATION">PENDING</option>
                                    <option value="UNVERIFIED">UNVERIFIED</option>
                                  </select>
                                ) : (
                                  <Badge
                                    className={`text-[10px] font-bold ${
                                      u.verificationStatus === "VERIFIED"
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                        : u.verificationStatus === "PENDING_VERIFICATION"
                                        ? "bg-amber-100 text-amber-800 border-amber-300"
                                        : "bg-rose-100 text-rose-800 border-rose-300"
                                    }`}
                                  >
                                    {u.verificationStatus}
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                {isEditing ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        await upsertIdentityMutation.mutateAsync({
                                          userId: u.userId,
                                          officialNumber: editOfficialNumber,
                                          verificationStatus: editStatus,
                                        });
                                        setEditingUserId(null);
                                        setIdentitySaveStatus(`Identity updated for ${u.name}`);
                                        setTimeout(() => setIdentitySaveStatus(null), 3000);
                                        refetchIdentities();
                                      }}
                                      className="h-6 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingUserId(null)}
                                      className="h-6 text-[10px] text-slate-500"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingUserId(u.userId);
                                      setEditOfficialNumber(u.officialNumber || u.profilePhone || "");
                                      setEditStatus(u.verificationStatus as any || "VERIFIED");
                                    }}
                                    className="h-6 text-[10px] font-semibold"
                                  >
                                    Edit Number
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400">
                            Loading caller identities...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 3: DNC COMPLIANCE REGISTRY */}
            <Card className="border shadow-sm">
              <CardHeader className="p-5 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-rose-600" />
                      <span>Do-Not-Call (DNC) Compliance Registry</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Numbers in this registry are automatically skipped from outbound calling with zero attempt.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono font-bold">
                    {dncData?.total || 0} Registered Numbers
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 max-w-md">
                  <Input
                    placeholder="Add 10-digit phone to DNC..."
                    value={newDncPhone}
                    onChange={(e) => setNewDncPhone(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                  <Input
                    placeholder="Reason (e.g. Opt-out request)..."
                    value={newDncReason}
                    onChange={(e) => setNewDncReason(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!newDncPhone.trim()) return;
                      await addDncMutation.mutateAsync({
                        phone: newDncPhone,
                        reason: newDncReason.trim() || undefined,
                      });
                      setNewDncPhone("");
                      setNewDncReason("");
                      refetchDnc();
                    }}
                    className="h-8 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shrink-0"
                  >
                    Add to DNC
                  </Button>
                </div>

                {dncData?.items && dncData.items.length > 0 && (
                  <div className="border rounded-xl max-h-48 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 border-b text-slate-600 font-semibold">
                        <tr>
                          <th className="p-2">Phone</th>
                          <th className="p-2">Reason</th>
                          <th className="p-2">Added On</th>
                          <th className="p-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {dncData.items.map((dnc) => (
                          <tr key={dnc.id}>
                            <td className="p-2 font-mono font-bold text-slate-800">{dnc.phone}</td>
                            <td className="p-2 text-slate-600">{dnc.reason || "Manual opt-out"}</td>
                            <td className="p-2 text-slate-400 font-mono">
                              {new Date(dnc.createdAt).toLocaleDateString("en-IN")}
                            </td>
                            <td className="p-2 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  await removeDncMutation.mutateAsync({ phone: dnc.phone });
                                  refetchDnc();
                                }}
                                className="h-6 text-[10px] text-rose-600 hover:bg-rose-50"
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Transcript Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Call Record: {viewingItem.name || "Candidate"} ({viewingItem.phone})
                </h4>
                <p className="text-xs text-slate-500">
                  Course: {viewingItem.course || "General"} • Duration: {viewingItem.callDurationSeconds || 0}s • Outcome:{" "}
                  <span className="font-semibold text-emerald-700">{viewingItem.callOutcome}</span>
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewingItem(null)}
                className="h-7 text-xs"
              >
                ✕ Close
              </Button>
            </div>

            {viewingItem.conversationSummary && (
              <div className="bg-slate-50 p-3 rounded-xl border text-xs">
                <span className="font-bold text-slate-800 block mb-1">AI Conversation Summary:</span>
                <p className="text-slate-600 leading-relaxed">{viewingItem.conversationSummary}</p>
              </div>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
              <span className="font-bold text-slate-800 block mb-1">Transcript:</span>
              {Array.isArray(viewingItem.transcript) &&
                viewingItem.transcript.map((t: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl max-w-[85%] ${
                      t.role === "agent"
                        ? "bg-[#0088cc]/10 text-slate-900 border border-[#0088cc]/20 ml-0 mr-auto"
                        : "bg-slate-100 text-slate-900 border border-slate-200 ml-auto mr-0 text-right"
                    }`}
                  >
                    <span className="block font-bold text-[10px] text-slate-500 mb-0.5">
                      {t.role === "agent" ? "🤖 SoftLab Global AI" : "👤 Candidate"} • {t.timestamp}
                    </span>
                    <p className="leading-snug">{t.text}</p>
                  </div>
                ))}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button
                size="sm"
                onClick={() => setViewingItem(null)}
                className="bg-slate-900 text-white font-bold text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
