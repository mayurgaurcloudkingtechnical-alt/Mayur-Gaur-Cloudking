"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api as trpc } from "@/lib/trpc/react";
import { IMS_SERVICES_LIST, type ImsBoqLineItem } from "@/lib/constants/ims-catalog";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  AlertTriangle,
  Building2,
  MapPin,
  Wrench,
  Calculator,
  PhoneCall,
  Trash2,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";

const ENGAGEMENT_TYPES = [
  { id: "NEW_INSTALLATION", label: "New Installation", desc: "Fresh setup & turnkey deployment" },
  { id: "EXPANSION", label: "Expansion / Upgrade", desc: "Add capacity to existing setup" },
  { id: "REPAIR", label: "Repair & Troubleshooting", desc: "Fix faults or degraded systems" },
  { id: "REPLACEMENT", label: "Hardware Replacement", desc: "Replace aging or faulty equipment" },
  { id: "AMC", label: "Annual Maintenance (AMC)", desc: "Preventive & on-call IT support" },
] as const;

export function ImsQuoteRequestForm() {
  const searchParams = useSearchParams();
  const initialServiceSlug = searchParams.get("service");

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [engagementType, setEngagementType] = useState<
    "NEW_INSTALLATION" | "EXPANSION" | "REPAIR" | "REPLACEMENT" | "AMC"
  >("NEW_INSTALLATION");

  // Contact & Organization
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Site & Location Details
  const [city, setCity] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [siteType, setSiteType] = useState("Corporate Office");
  const [buildingFloors, setBuildingFloors] = useState<number>(1);
  const [approxCableLengthMeters, setApproxCableLengthMeters] = useState<number | "">("");

  // Service-Specific Quantities
  const [cameraCount, setCameraCount] = useState<number>(0);
  const [cameraType, setCameraType] = useState<"IP" | "HD" | "MIXED">("IP");
  const [recordingDays, setRecordingDays] = useState<number>(30);

  const [serverCount, setServerCount] = useState<number>(0);
  const [serverType, setServerType] = useState<"RACK" | "TOWER" | "VIRTUALIZATION">("RACK");

  const [networkPoints, setNetworkPoints] = useState<number>(0);
  const [wifiAccessPoints, setWifiAccessPoints] = useState<number>(0);

  const [computerCount, setComputerCount] = useState<number>(0);
  const [upsRequired, setUpsRequired] = useState<boolean>(false);

  const [biometricCount, setBiometricCount] = useState<number>(0);
  const [doorAccessCount, setDoorAccessCount] = useState<number>(0);

  // Additional Preferences & Attachments
  const [preferredEquipment, setPreferredEquipment] = useState("");
  const [technicalRequirements, setTechnicalRequirements] = useState("");
  const [timeline, setTimeline] = useState("Within 2-4 Weeks");
  const [budgetRange, setBudgetRange] = useState("Need Itemized Estimate First");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [siteAttachments, setSiteAttachments] = useState<
    { fileName: string; fileType: string; fileSizeKb: number; dataUrl: string }[]
  >([]);

  // Honeypot anti-spam
  const [websiteHp, setWebsiteHp] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Submission Result
  const [submissionResult, setSubmissionResult] = useState<{
    referenceNumber: string;
    quotationNumber: string;
    provisionalStatus: string;
    itemCount: number;
    lineItems: ImsBoqLineItem[];
    subtotalExclTax: number;
    gstTotal: number;
    grandTotal: number;
    hasPendingPrices: boolean;
    hasUnverifiedQuantities: boolean;
  } | null>(null);

  useEffect(() => {
    if (initialServiceSlug) {
      const exists = IMS_SERVICES_LIST.some((s) => s.slug === initialServiceSlug);
      if (exists && !selectedServices.includes(initialServiceSlug)) {
        setSelectedServices([initialServiceSlug]);
      }
    }
  }, [initialServiceSlug]);

  const toggleService = (slug: string) => {
    setSelectedServices((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  };

  // Determine which dynamic quantity sections to display
  const showCctvFields =
    selectedServices.includes("cctv-installation") ||
    selectedServices.includes("hardware-supply") ||
    selectedServices.includes("it-infrastructure") ||
    selectedServices.includes("amc-managed-it");

  const showServerFields =
    selectedServices.includes("server-installation") ||
    selectedServices.includes("computer-lab-setup") ||
    selectedServices.includes("hardware-supply") ||
    selectedServices.includes("it-infrastructure") ||
    selectedServices.includes("amc-managed-it");

  const showNetworkFields =
    selectedServices.includes("networking") ||
    selectedServices.includes("computer-lab-setup") ||
    selectedServices.includes("it-infrastructure") ||
    selectedServices.includes("amc-managed-it");

  const showComputerLabFields =
    selectedServices.includes("computer-lab-setup") ||
    selectedServices.includes("hardware-supply") ||
    selectedServices.includes("it-infrastructure") ||
    selectedServices.includes("amc-managed-it");

  const showAccessControlFields =
    selectedServices.includes("access-control") ||
    selectedServices.includes("it-infrastructure") ||
    selectedServices.includes("amc-managed-it");

  const submitMutation = trpc.ims.submitRequirement.useMutation({
    onSuccess: (data) => {
      setFormError(null);
      setSubmissionResult(data as any);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err) => {
      setFormError(err.message || "Unable to submit requirement. Please verify your inputs.");
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 4 * 1024 * 1024) {
        setFormError(`File "${file.name}" exceeds the 4MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setSiteAttachments((prev) => [
            ...prev.slice(0, 3),
            {
              fileName: file.name,
              fileType: file.type || "application/octet-stream",
              fileSizeKb: Math.round(file.size / 1024),
              dataUrl: reader.result as string,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (websiteHp) {
      // Bot honeypot triggered silently
      return;
    }

    if (selectedServices.length === 0) {
      setFormError("Please select at least one IMS service required for your project.");
      return;
    }

    if (!name.trim() || !email.trim() || !phone.trim() || !city.trim() || !projectLocation.trim()) {
      setFormError("Please complete your contact details and project location.");
      return;
    }

    submitMutation.mutate({
      fullName: name.trim(),
      companyName: company.trim() || undefined,
      email: email.trim(),
      phone: phone.trim(),
      siteAddress: projectLocation.trim(),
      city: city.trim(),
      selectedServices,
      engagementType,
      siteType,
      buildingFloors: Number(buildingFloors) || 1,
      approxCableLengthMeters:
        approxCableLengthMeters === "" ? undefined : Number(approxCableLengthMeters),
      cameraCount: showCctvFields ? Number(cameraCount) || 0 : 0,
      cameraType,
      recordingDays: Number(recordingDays) || 30,
      serverCount: showServerFields ? Number(serverCount) || 0 : 0,
      serverType,
      networkPoints: showNetworkFields ? Number(networkPoints) || 0 : 0,
      wifiAccessPoints: showNetworkFields ? Number(wifiAccessPoints) || 0 : 0,
      computerCount: showComputerLabFields ? Number(computerCount) || 0 : 0,
      upsRequired,
      biometricCount: showAccessControlFields ? Number(biometricCount) || 0 : 0,
      doorAccessCount: showAccessControlFields ? Number(doorAccessCount) || 0 : 0,
      preferredEquipment: preferredEquipment.trim() || undefined,
      technicalRequirements: technicalRequirements.trim() || undefined,
      timeline,
      budgetRange,
      additionalNotes: additionalNotes.trim() || undefined,
      siteAttachments,
    } as any);
  };

  if (submissionResult) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#071630] via-[#0B2247] to-[#123163] p-8 sm:p-10 text-white">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-4">
              <CheckCircle2 className="w-4 h-4" /> Requirement Logged & Provisional BOQ Generated
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
              Thank You, {name}! Your IMS Technical Request is Registered.
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-3xl">
              Our IT Infrastructure & Managed Services engineering desk has generated an itemized
              provisional Bill of Quantities (BOQ) based on your parameters.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
                  Enquiry Reference Number
                </span>
                <span className="text-lg font-black text-amber-400 font-mono">
                  {submissionResult.referenceNumber}
                </span>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
                  Provisional Quotation No.
                </span>
                <span className="text-lg font-black text-white font-mono">
                  {submissionResult.quotationNumber}
                </span>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
                  Quotation Status
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 mt-1">
                  <AlertTriangle className="w-4 h-4" /> Provisional (Pending Verification)
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Important Technical & Commercial Note:</p>
                <p className="text-amber-800 mt-0.5">
                  Quantities marked with <strong>Site Verification Required</strong> (such as cable
                  runs, conduits, and accessories) are calculated from standard engineering norms.
                  Items marked <strong>Pending Management Verification</strong> require OEM model
                  selection and final commercial authorization before a formal tax invoice or binding
                  quote is issued.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                Itemized Provisional Bill of Quantities ({submissionResult.lineItems.length} Line
                Items)
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase">
                      <th className="py-3.5 px-4 font-bold">#</th>
                      <th className="py-3.5 px-4 font-bold">Item & Technical Specification</th>
                      <th className="py-3.5 px-4 font-bold text-center">Qty</th>
                      <th className="py-3.5 px-4 font-bold text-center">Unit</th>
                      <th className="py-3.5 px-4 font-bold text-right">Unit Rate</th>
                      <th className="py-3.5 px-4 font-bold text-right">Amount (Excl. GST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {submissionResult.lineItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">{idx + 1}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.specification}</div>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {item.requiresSiteVerification && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                                Site Verification Required
                              </span>
                            )}
                            {item.pricePending && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                                Price Pending OEM / Management Verification
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs text-slate-500">
                          {item.unit}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs">
                          {item.pricePending || item.unitPrice === null ? (
                            <span className="text-amber-700 font-semibold">Pending Input</span>
                          ) : (
                            `₹${item.unitPrice.toLocaleString("en-IN")}`
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                          {item.pricePending || item.lineSubtotal === null || item.lineSubtotal === undefined ? (
                            <span className="text-amber-700 text-xs">To Be Verified</span>
                          ) : (
                            `₹${item.lineSubtotal.toLocaleString("en-IN")}`
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                Need immediate assistance or an urgent on-site survey? Call our IMS Desk or reference{" "}
                <strong className="text-slate-800">{submissionResult.referenceNumber}</strong>.
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/services"
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors"
                >
                  Back to Services
                </Link>
                <button
                  type="button"
                  onClick={() => setSubmissionResult(null)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Services
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" /> IT Infrastructure & Managed Services (IMS)
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Request an Itemized IT Infrastructure Quote & Site Survey
        </h1>
        <p className="text-slate-600 mt-2 max-w-3xl">
          Select one or more IMS services below and specify your site parameters. Our modular BOQ
          engine will log your requirement and generate an instant provisional Bill of Quantities.
        </p>
      </div>

      {formError && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Honeypot field */}
        <input
          type="text"
          name="company_website_hp"
          value={websiteHp}
          onChange={(e) => setWebsiteHp(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        {/* STEP 1: Select IMS Services */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              Select Required IMS Services (One or Multiple)
            </h2>
            <span className="text-xs font-semibold text-blue-600">
              {selectedServices.length} Selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {IMS_SERVICES_LIST.map((service) => {
              const isSelected = selectedServices.includes(service.slug);
              return (
                <button
                  key={service.slug}
                  type="button"
                  onClick={() => toggleService(service.slug)}
                  className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20"
                      : "border-slate-200 hover:border-blue-300 bg-white"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                        {service.badge}
                      </span>
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm leading-snug">
                      {service.title}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                    {service.shortDescription}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2: Engagement Type */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            Project Requirement Type
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ENGAGEMENT_TYPES.map((type) => {
              const active = engagementType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setEngagementType(type.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    active
                      ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-bold text-xs sm:text-sm text-slate-900">{type.label}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{type.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 3: Dynamic Service-Specific Technical Quantities */}
        {selectedServices.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                Hardware, Cabling & Technical Quantities
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Showing technical fields relevant to your selected services. Leave 0 if unsure; our
                site survey team will verify on-site.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {showCctvFields && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                    CCTV & Surveillance Parameters
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        No. of Cameras
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={cameraCount}
                        onChange={(e) => setCameraCount(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Camera Technology
                      </label>
                      <select
                        value={cameraType}
                        onChange={(e) => setCameraType(e.target.value as "IP" | "HD" | "MIXED")}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                      >
                        <option value="IP">IP Network (PoE)</option>
                        <option value="HD">HD Analog (DVR)</option>
                        <option value="MIXED">Mixed / Unsure</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Recording Backup
                      </label>
                      <select
                        value={recordingDays}
                        onChange={(e) => setRecordingDays(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                      >
                        <option value={15}>15 Days</option>
                        <option value={30}>30 Days</option>
                        <option value={60}>60 Days</option>
                        <option value={90}>90 Days</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {showServerFields && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                    Server & Storage Parameters
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        No. of Servers
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={serverCount}
                        onChange={(e) => setServerCount(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Server Form Factor
                      </label>
                      <select
                        value={serverType}
                        onChange={(e) =>
                          setServerType(e.target.value as "RACK" | "TOWER" | "VIRTUALIZATION")
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                      >
                        <option value="RACK">Rack Server</option>
                        <option value="TOWER">Tower Server</option>
                        <option value="VIRTUALIZATION">Virtualization Cluster</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {showNetworkFields && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                    Networking & Wi-Fi Parameters
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        LAN Data Points (Nodes)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={networkPoints}
                        onChange={(e) => setNetworkPoints(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Wi-Fi Access Points
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={wifiAccessPoints}
                        onChange={(e) => setWifiAccessPoints(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {showComputerLabFields && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                    Computers & Power Backup
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Desktops / Workstations
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={computerCount}
                        onChange={(e) => setComputerCount(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div className="pt-4">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={upsRequired}
                          onChange={(e) => setUpsRequired(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          Include Online UPS Power Backup
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {showAccessControlFields && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                    Biometric & Door Access Control
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Biometric Attendance Terminals
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={biometricCount}
                        onChange={(e) => setBiometricCount(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Electronic Door Locks (EM/Strike)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={doorAccessCount}
                        onChange={(e) => setDoorAccessCount(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Site & Building Details */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              4
            </span>
            Project Location, Building Floors & Site Specifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City / District *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Prayagraj, Lucknow, Noida"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Site Address / Landmark *
              </label>
              <input
                type="text"
                required
                placeholder="Building / Campus / Industrial Area address"
                value={projectLocation}
                onChange={(e) => setProjectLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Premises Type
              </label>
              <select
                value={siteType}
                onChange={(e) => setSiteType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="Corporate Office">Corporate Office</option>
                <option value="School / College / University">School / College / University</option>
                <option value="Hospital / Healthcare">Hospital / Healthcare</option>
                <option value="Warehouse / Factory">Warehouse / Factory</option>
                <option value="Retail / Commercial Complex">Retail / Commercial Complex</option>
                <option value="Residential Society">Residential Society</option>
                <option value="Government / Institutional">Government / Institutional</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Number of Floors
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={buildingFloors}
                onChange={(e) => setBuildingFloors(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Approx. Cable Length (Meters)
              </label>
              <input
                type="number"
                min={0}
                placeholder="Auto-estimated if blank"
                value={approxCableLengthMeters}
                onChange={(e) =>
                  setApproxCableLengthMeters(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Timeline
              </label>
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="Immediate / Urgent (Within 7 Days)">
                  Immediate / Urgent (Within 7 Days)
                </option>
                <option value="Within 2-4 Weeks">Within 2-4 Weeks</option>
                <option value="1-2 Months">1-2 Months</option>
                <option value="Planning / Budgeting Phase">Planning / Budgeting Phase</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Budget Range
              </label>
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="Need Itemized Estimate First">Need Itemized Estimate First</option>
                <option value="Under ₹50,000">Under ₹50,000</option>
                <option value="₹50,000 – ₹2,00,000">₹50,000 – ₹2,00,000</option>
                <option value="₹2,00,000 – ₹5,00,000">₹2,00,000 – ₹5,00,000</option>
                <option value="₹5,00,000 – ₹15,00,000">₹5,00,000 – ₹15,00,000</option>
                <option value="Above ₹15,00,000">Above ₹15,00,000</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred OEM / Equipment Brands (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Hikvision, CP Plus, Dell, HP, Cisco, D-Link, eSSL"
                value={preferredEquipment}
                onChange={(e) => setPreferredEquipment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specific Technical Requirements / Notes
              </label>
              <input
                type="text"
                placeholder="e.g., Night vision, PoE switches, firewall, fiber backbone, AMC SLA"
                value={technicalRequirements}
                onChange={(e) => setTechnicalRequirements(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Optional Site Plan / Photographs Upload */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Upload Optional Site Layout Plan, Floor Map or Site Photographs (Max 4MB per file)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-blue-400 bg-blue-50/40 hover:bg-blue-50 text-blue-700 text-xs font-semibold cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                Attach Site Plan / Photo
                <input
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {siteAttachments.map((att, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span className="truncate max-w-[160px]">{att.fileName}</span>
                  <span className="text-[10px] text-slate-400">({att.fileSizeKb} KB)</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSiteAttachments((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STEP 5: Customer Contact Details */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              5
            </span>
            Your Contact & Organization Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company / Institution Name
              </label>
              <input
                type="text"
                placeholder="Organization, school, college, or business name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone / WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Project Notes or Site Survey Instructions (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Share preferred site visit timings, existing infrastructure details, or special compliance needs..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Generates a unique reference ID & itemized provisional BOQ immediately upon
                submission.
              </span>
            </div>
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating Itemized BOQ...
                </>
              ) : (
                <>
                  Submit Requirement & Generate Provisional BOQ
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
