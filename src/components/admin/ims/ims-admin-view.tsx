"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api as trpc } from "@/lib/trpc/react";
import type { ImsEnquiryRecord } from "@/server/services/ims.service";
import {
  type ImsBoqLineItem,
  type ImsCatalogItem,
  type ImsEstimationRules,
  DEFAULT_IMS_ESTIMATION_RULES,
} from "@/lib/constants/ims-catalog";
import { ImsQuotationPdfModal } from "./ims-quotation-pdf-modal";
import {
  Server,
  FileText,
  Package,
  Sliders,
  ShieldCheck,
  CalendarClock,
  Plus,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Search,
  Building2,
  MapPin,
  Phone,
  Mail,
  Wrench,
  Save,
  Trash2,
  ArrowLeft,
  Eye,
  Lock,
} from "lucide-react";

const RULE_METADATA: { key: keyof ImsEstimationRules; label: string; description: string; unit: string }[] = [
  { key: "avgCableMetersPerCamera", label: "Average Cable per Camera", description: "Meters per CCTV camera run", unit: "m" },
  { key: "avgCableMetersPerNetworkPoint", label: "Average Cable per LAN Point", description: "Meters per structured cabling node", unit: "m" },
  { key: "avgCableMetersPerBiometric", label: "Average Cable per Biometric Device", description: "Meters per access control device", unit: "m" },
  { key: "floorCableMultiplierPercent", label: "Floor Multiplier", description: "Extra cable per building floor", unit: "%" },
  { key: "conduitMetersPerCableMeter", label: "Conduit Ratio", description: "PVC pipe / casing per meter of cable", unit: "m/m" },
  { key: "bncConnectorsPerHdCamera", label: "BNC Connectors per HD Camera", description: "Connectors required per analog camera", unit: "Nos" },
  { key: "dcConnectorsPerHdCamera", label: "DC Pins per HD Camera", description: "Power connectors per camera", unit: "Nos" },
  { key: "rj45JacksPerIpCamera", label: "RJ-45 Connectors per IP Camera", description: "Network terminations per IP camera", unit: "Nos" },
  { key: "rj45JacksPerNetworkPoint", label: "RJ-45 Connectors per LAN Port", description: "Terminations per workstation node", unit: "Nos" },
  { key: "switchPortBufferPercent", label: "Switch Port Buffer", description: "Reserve capacity for future expansion", unit: "%" },
  { key: "defaultGstPercent", label: "Default GST Rate", description: "Goods and Services Tax percentage", unit: "%" },
];

type AdminTab = "enquiries" | "boq" | "catalogue" | "rules" | "amc";

export function ImsAdminView() {
  const [activeTab, setActiveTab] = useState<AdminTab>("enquiries");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [pdfModalRecord, setPdfModalRecord] = useState<ImsEnquiryRecord | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.ims.getAdminDashboardData.useQuery();

  // BOQ Editor State
  const [editableLineItems, setEditableLineItems] = useState<ImsBoqLineItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [validityDays, setValidityDays] = useState<number>(15);
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [assumptionsAndExclusions, setAssumptionsAndExclusions] = useState("");
  const [warrantyAndAmcTerms, setWarrantyAndAmcTerms] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [enquiryStatus, setEnquiryStatus] = useState<ImsEnquiryRecord["status"]>("BOQ_PREPARED");

  // Catalogue Editor State
  const [catalogueDraft, setCatalogueDraft] = useState<ImsCatalogItem[] | null>(null);
  // Rules Editor State
  const [rulesDraft, setRulesDraft] = useState<ImsEstimationRules | null>(null);

  // AMC Form State
  const [amcClientName, setAmcClientName] = useState("");
  const [amcCompany, setAmcCompany] = useState("");
  const [amcPhone, setAmcPhone] = useState("");
  const [amcEmail, setAmcEmail] = useState("");
  const [amcLocation, setAmcLocation] = useState("");
  const [amcScope, setAmcScope] = useState("CCTV + Server + Networking Comprehensive AMC");
  const [amcStartDate, setAmcStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [amcEndDate, setAmcEndDate] = useState(
    new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10)
  );
  const [amcNextVisit, setAmcNextVisit] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
  );
  const [amcFrequency, setAmcFrequency] = useState<"MONTHLY" | "QUARTERLY" | "BI_ANNUAL">("QUARTERLY");
  const [amcValue, setAmcValue] = useState<number>(25000);

  const updateQuotationMutation = trpc.ims.updateQuotation.useMutation({
    onSuccess: (updated) => {
      utils.ims.getAdminDashboardData.invalidate();
      setStatusMessage(
        `Quotation ${updated.quotation.quotationNumber} saved (${updated.quotation.status}).`
      );
      setTimeout(() => setStatusMessage(null), 4000);
    },
  });

  const saveCatalogueMutation = trpc.ims.saveCatalog.useMutation({
    onSuccess: () => {
      utils.ims.getAdminDashboardData.invalidate();
      setStatusMessage("IMS Product, Material & Labour Catalogue updated successfully.");
      setTimeout(() => setStatusMessage(null), 4000);
    },
  });

  const saveRulesMutation = trpc.ims.saveEstimationRules.useMutation({
    onSuccess: () => {
      utils.ims.getAdminDashboardData.invalidate();
      setStatusMessage("IMS Engineering Estimation Rules updated successfully.");
      setTimeout(() => setStatusMessage(null), 4000);
    },
  });

  const upsertAmcMutation = trpc.ims.upsertAmcContract.useMutation({
    onSuccess: () => {
      utils.ims.getAdminDashboardData.invalidate();
      setAmcClientName("");
      setAmcCompany("");
      setStatusMessage("AMC Contract & Renewal Schedule saved.");
      setTimeout(() => setStatusMessage(null), 4000);
    },
  });

  if (isLoading || !data) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Loading IT Infrastructure & Managed Services (IMS) Command Center...
      </div>
    );
  }

  const { enquiries, catalog, rules, amcContracts, canManagePricing } = data;
  const currentCatalog = catalogueDraft ?? catalog;
  const currentRules: ImsEstimationRules = rulesDraft ?? (rules as unknown as ImsEstimationRules) ?? DEFAULT_IMS_ESTIMATION_RULES;

  const selectedRecord =
    enquiries.find((e) => e.id === selectedRecordId) || enquiries[0] || null;

  const openBoqEditor = (record: ImsEnquiryRecord) => {
    setSelectedRecordId(record.id);
    setEditableLineItems(JSON.parse(JSON.stringify(record.quotation.lineItems)));
    setDiscountAmount(record.quotation.discountAmount);
    setValidityDays(record.quotation.validityDays);
    setScopeOfWork(record.quotation.scopeOfWork);
    setAssumptionsAndExclusions(record.quotation.assumptionsAndExclusions);
    setWarrantyAndAmcTerms(record.quotation.warrantyAndAmcTerms);
    setPaymentTerms(record.quotation.paymentTerms);
    setEnquiryStatus(record.status);
    setActiveTab("boq");
  };

  const filteredEnquiries = enquiries.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.referenceNumber.toLowerCase().includes(q) ||
      item.customer.name.toLowerCase().includes(q) ||
      (item.customer.company || "").toLowerCase().includes(q) ||
      item.customer.city.toLowerCase().includes(q) ||
      item.quotation.quotationNumber.toLowerCase().includes(q)
    );
  });

  const handleLineItemChange = (
    idx: number,
    field: keyof ImsBoqLineItem,
    value: string | number | boolean | null
  ) => {
    setEditableLineItems((prev) => {
      const next = [...prev];
      const item = { ...next[idx], [field]: value };
      if (field === "unitPrice") {
        item.pricePending = value === null || value === "";
      }
      next[idx] = item;
      return next;
    });
  };

  const addCustomBoqLineItem = () => {
    setEditableLineItems((prev) => [
      ...prev,
      {
        id: `BOQ-CUSTOM-${Date.now()}`,
        sku: `SLG-CUST-${prev.length + 1}`,
        category: "CONNECTORS_CONDUITS_ACCESSORIES",
        name: "Additional Hardware / Installation Material",
        specification: "Site-specific requirement",
        unit: "Nos",
        quantity: 1,
        unitPrice: 0,
        supplierCost: 0,
        gstPercent: 18,
        pricePending: false,
        requiresSiteVerification: false,
        lineSubtotal: 0,
        lineGstAmount: 0,
        lineTotal: 0,
      },
    ]);
  };

  const removeBoqLineItem = (idx: number) => {
    setEditableLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#071630] via-[#0B2247] to-[#123163] p-6 rounded-3xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
            <Server className="w-4 h-4" /> SoftLab Global — IMS Division
          </div>
          <h1 className="text-2xl font-extrabold">
            IT Infrastructure & Managed Services (IMS) Admin
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Manage IMS technical enquiries, site surveys, itemized BOQs, supplier pricing,
            estimation rules, and AMC renewals.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/services"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Services CRM
          </Link>
          <Link
            href="/services/request-quote"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Public IMS Quote Form
          </Link>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Total IMS Enquiries</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{enquiries.length}</div>
          <span className="text-[11px] text-blue-600 font-semibold">
            With Auto-Generated BOQs
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Approved Quotations</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {enquiries.filter((e) => e.quotation.status === "APPROVED_FINAL_QUOTE").length}
          </div>
          <span className="text-[11px] text-slate-500">Commercial Quotes Ready</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">IMS Catalogue SKUs</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{currentCatalog.length}</div>
          <span className="text-[11px] text-slate-500">
            Hardware, Cabling, Racks & Labour
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold">Active AMC Contracts</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{amcContracts.length}</div>
          <span className="text-[11px] text-slate-500">Scheduled Preventive Visits</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "enquiries", label: "IMS Enquiries & Site Details", icon: FileText },
          { id: "boq", label: "BOQ & Quotation Approval", icon: ShieldCheck },
          { id: "catalogue", label: "Product, Material & Labour Catalogue", icon: Package },
          { id: "rules", label: "BOQ Estimation Rules", icon: Sliders },
          { id: "amc", label: "Projects & AMC Renewals", icon: CalendarClock },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === "boq" && selectedRecord && editableLineItems.length === 0) {
                  openBoqEditor(selectedRecord);
                } else {
                  setActiveTab(tab.id as AdminTab);
                }
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: IMS ENQUIRIES & SITE DETAILS */}
      {activeTab === "enquiries" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900">
              IMS Requirement Submissions & Site Survey Queue
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Ref No, client, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          {filteredEnquiries.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">
              No IMS enquiries found yet. New requests from{" "}
              <code className="text-blue-600">/services/request-quote</code> will appear here
              automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                    <th className="py-3 px-4 font-bold">Ref No & Date</th>
                    <th className="py-3 px-4 font-bold">Customer & Company</th>
                    <th className="py-3 px-4 font-bold">Site Location & Scope</th>
                    <th className="py-3 px-4 font-bold">Key Quantities</th>
                    <th className="py-3 px-4 font-bold">BOQ Status & Value</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredEnquiries.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-blue-700">
                          {rec.referenceNumber}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(rec.createdAt).toLocaleDateString("en-IN")}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{rec.customer.name}</div>
                        {rec.customer.company && (
                          <div className="text-slate-600">{rec.customer.company}</div>
                        )}
                        <div className="text-slate-500 text-[11px]">{rec.customer.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {rec.customer.city} — {rec.requirements.siteType}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate max-w-xs">
                          {rec.requirements.siteAddress || rec.customer.city} ({rec.requirements.buildingFloors} Floors)
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.requirements.selectedServices.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-600 space-y-0.5">
                        {(rec.requirements.cameraCount ?? 0) > 0 && (
                          <div>Cameras: {rec.requirements.cameraCount}</div>
                        )}
                        {(rec.requirements.serverCount ?? 0) > 0 && (
                          <div>Servers: {rec.requirements.serverCount}</div>
                        )}
                        {(rec.requirements.networkPoints ?? 0) > 0 && (
                          <div>LAN Nodes: {rec.requirements.networkPoints}</div>
                        )}
                        {(rec.requirements.computerCount ?? 0) > 0 && (
                          <div>Computers: {rec.requirements.computerCount}</div>
                        )}
                        {(rec.requirements.biometricCount ?? 0) > 0 && (
                          <div>Biometrics: {rec.requirements.biometricCount}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.quotation.status === "APPROVED_FINAL_QUOTE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {rec.quotation.status}
                        </span>
                        <div className="font-mono font-bold text-slate-900 mt-1">
                          ₹{rec.quotation.grandTotal.toLocaleString("en-IN")}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openBoqEditor(rec)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
                        >
                          Edit BOQ / Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setPdfModalRecord(rec)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BOQ & QUOTATION EDITOR / APPROVAL */}
      {activeTab === "boq" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
          {!selectedRecord ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Select an enquiry from the Enquiries tab to edit its itemized BOQ and quotation.
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600 text-sm">
                      {selectedRecord.quotation.quotationNumber}
                    </span>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="font-mono text-xs text-slate-600">
                      Ref: {selectedRecord.referenceNumber}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedRecord.customer.name}{" "}
                    {selectedRecord.customer.company
                      ? `(${selectedRecord.customer.company})`
                      : ""}{" "}
                    — {selectedRecord.customer.city}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPdfModalRecord(selectedRecord)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700"
                  >
                    <Printer className="w-4 h-4" /> Preview / Download PDF Quotation
                  </button>
                  <button
                    type="button"
                    onClick={addCustomBoqLineItem}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white"
                  >
                    <Plus className="w-4 h-4" /> Add BOQ Line Item
                  </button>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                      <th className="py-3 px-3 font-bold">Item & Specification</th>
                      <th className="py-3 px-3 font-bold w-24">Qty</th>
                      <th className="py-3 px-3 font-bold w-20">Unit</th>
                      {canManagePricing && (
                        <th className="py-3 px-3 font-bold w-28 text-amber-800">
                          Supplier Cost (₹)
                        </th>
                      )}
                      <th className="py-3 px-3 font-bold w-32">Client Unit Price (₹)</th>
                      <th className="py-3 px-3 font-bold w-20">GST %</th>
                      <th className="py-3 px-3 font-bold w-28">Site Verify?</th>
                      <th className="py-3 px-3 font-bold w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {editableLineItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3 space-y-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleLineItemChange(idx, "name", e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold"
                          />
                          <input
                            type="text"
                            value={item.specification}
                            onChange={(e) =>
                              handleLineItemChange(idx, "specification", e.target.value)
                            }
                            className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] text-slate-600"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min={0}
                            value={item.quantity}
                            onChange={(e) =>
                              handleLineItemChange(idx, "quantity", Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-center"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleLineItemChange(idx, "unit", e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-center"
                          />
                        </td>
                        {canManagePricing && (
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min={0}
                              placeholder="Confidential"
                              value={item.supplierCost ?? ""}
                              onChange={(e) =>
                                handleLineItemChange(
                                  idx,
                                  "supplierCost",
                                  e.target.value === "" ? null : Number(e.target.value)
                                )
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50/40 font-mono"
                            />
                          </td>
                        )}
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min={0}
                            disabled={!canManagePricing}
                            placeholder="Pending Input"
                            value={item.unitPrice ?? ""}
                            onChange={(e) =>
                              handleLineItemChange(
                                idx,
                                "unitPrice",
                                e.target.value === "" ? null : Number(e.target.value)
                              )
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min={0}
                            max={28}
                            value={item.gstPercent}
                            onChange={(e) =>
                              handleLineItemChange(idx, "gstPercent", Number(e.target.value))
                            }
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-center"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.requiresSiteVerification}
                            onChange={(e) =>
                              handleLineItemChange(
                                idx,
                                "requiresSiteVerification",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 rounded text-amber-600"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeBoqLineItem(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Terms, Discount & Management Approval Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project Workflow Status
                  </label>
                  <select
                    value={enquiryStatus}
                    onChange={(e) =>
                      setEnquiryStatus(e.target.value as ImsEnquiryRecord["status"])
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                  >
                    <option value="NEW">NEW ENQUIRY</option>
                    <option value="SITE_SURVEY_PENDING">SITE SURVEY PENDING</option>
                    <option value="PROVISIONAL_BOQ_READY">PROVISIONAL BOQ READY</option>
                    <option value="QUOTATION_APPROVED">COMMERCIAL QUOTATION APPROVED</option>
                    <option value="INSTALLATION_IN_PROGRESS">INSTALLATION IN PROGRESS</option>
                    <option value="COMPLETED">COMMISSIONED & COMPLETED</option>
                    <option value="AMC_ACTIVE">AMC CONTRACT ACTIVE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Amount (₹) {!canManagePricing && "(Admin Only)"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    disabled={!canManagePricing}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quotation Validity (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={validityDays}
                    onChange={(e) => setValidityDays(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Scope of Work
                  </label>
                  <textarea
                    rows={2}
                    value={scopeOfWork}
                    onChange={(e) => setScopeOfWork(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assumptions & Exclusions
                  </label>
                  <textarea
                    rows={2}
                    value={assumptionsAndExclusions}
                    onChange={(e) => setAssumptionsAndExclusions(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Warranty & AMC Terms
                  </label>
                  <textarea
                    rows={2}
                    value={warrantyAndAmcTerms}
                    onChange={(e) => setWarrantyAndAmcTerms(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Terms
                  </label>
                  <textarea
                    rows={2}
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  disabled={updateQuotationMutation.isPending}
                  onClick={() =>
                    updateQuotationMutation.mutate({
                      enquiryId: selectedRecord.id,
                      lineItems: editableLineItems,
                      discountAmount,
                      validityDays,
                      scopeOfWork,
                      assumptionsAndExclusions,
                      warrantyAndAmcTerms,
                      paymentTerms,
                      approveFinal: false,
                      enquiryStatus,
                    })
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs"
                >
                  <Save className="w-4 h-4" /> Save Draft / Provisional BOQ
                </button>
                {canManagePricing && (
                  <button
                    type="button"
                    disabled={updateQuotationMutation.isPending}
                    onClick={() =>
                      updateQuotationMutation.mutate({
                        enquiryId: selectedRecord.id,
                        lineItems: editableLineItems,
                        discountAmount,
                        validityDays,
                        scopeOfWork,
                        assumptionsAndExclusions,
                        warrantyAndAmcTerms,
                        paymentTerms,
                        approveFinal: true,
                        enquiryStatus: "QUOTATION_APPROVED",
                      })
                    }
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4" /> Verify & Approve Final Commercial Quotation
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: PRODUCT, MATERIAL & LABOUR CATALOGUE */}
      {activeTab === "catalogue" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                IMS Product, Cabling, Rack & Labour Catalogue
              </h2>
              <p className="text-xs text-slate-500">
                Confidential supplier costs are visible only to authorized management. Leave Selling
                Price blank (`null`) if item requires per-project OEM quote.
              </p>
            </div>
            {canManagePricing && (
              <button
                type="button"
                disabled={saveCatalogueMutation.isPending}
                onClick={() => saveCatalogueMutation.mutate({ items: currentCatalog })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                <Save className="w-4 h-4" /> Save Catalogue Changes
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                  <th className="py-3 px-3 font-bold">SKU</th>
                  <th className="py-3 px-3 font-bold">Category</th>
                  <th className="py-3 px-3 font-bold">Item Name & Spec</th>
                  <th className="py-3 px-3 font-bold">Unit</th>
                  {canManagePricing && (
                    <th className="py-3 px-3 font-bold text-amber-800">Supplier Cost (₹)</th>
                  )}
                  <th className="py-3 px-3 font-bold">Selling Price (₹)</th>
                  <th className="py-3 px-3 font-bold">GST %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentCatalog.map((item, idx) => (
                  <tr key={item.id || item.code || item.sku || idx}>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{item.code || item.sku}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500">{item.specification || item.notes}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{item.unit}</td>
                    {canManagePricing && (
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          placeholder="Confidential"
                          value={item.supplierCost ?? ""}
                          onChange={(e) => {
                            const next = [...currentCatalog];
                            next[idx] = {
                              ...item,
                              supplierCost:
                                e.target.value === "" ? null : Number(e.target.value),
                            };
                            setCatalogueDraft(next);
                          }}
                          className="w-28 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50/40 font-mono"
                        />
                      </td>
                    )}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        disabled={!canManagePricing}
                        placeholder="Pending Quote"
                        value={item.sellingPrice ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : Number(e.target.value);
                          const next = [...currentCatalog];
                          next[idx] = {
                            ...item,
                            sellingPrice: val,
                            priceStatus: val === null ? "PENDING_MANAGEMENT_INPUT" : "VERIFIED_CONFIGURED",
                          };
                          setCatalogueDraft(next);
                        }}
                        className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono">{item.gstPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BOQ ESTIMATION RULES */}
      {activeTab === "rules" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Engineering Estimation Rules & Material Multipliers
              </h2>
              <p className="text-xs text-slate-500">
                Used by the modular BOQ generator to calculate cable runs, connectors, conduits, and
                rack sizing from customer inputs.
              </p>
            </div>
            {canManagePricing && (
              <button
                type="button"
                disabled={saveRulesMutation.isPending}
                onClick={() => saveRulesMutation.mutate({ rules: currentRules })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                <Save className="w-4 h-4" /> Save Estimation Rules
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RULE_METADATA.map((meta) => {
              const val = currentRules[meta.key] ?? 0;
              return (
                <div
                  key={meta.key}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{meta.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{meta.description}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      disabled={!canManagePricing}
                      value={val}
                      onChange={(e) => {
                        setRulesDraft({
                          ...currentRules,
                          [meta.key]: Number(e.target.value),
                        });
                      }}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-xs text-center"
                    />
                    <span className="text-xs text-slate-500 font-semibold">{meta.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: PROJECTS & AMC RENEWAL SCHEDULING */}
      {activeTab === "amc" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Register New AMC Contract / Preventive Schedule
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client Name *</label>
                <input
                  type="text"
                  value={amcClientName}
                  onChange={(e) => setAmcClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Campus</label>
                <input
                  type="text"
                  value={amcCompany}
                  onChange={(e) => setAmcCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="text"
                    value={amcPhone}
                    onChange={(e) => setAmcPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={amcEmail}
                    onChange={(e) => setAmcEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Site Location *</label>
                <input
                  type="text"
                  value={amcLocation}
                  onChange={(e) => setAmcLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Covered Assets</label>
                <input
                  type="text"
                  value={amcScope}
                  onChange={(e) => setAmcScope(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={amcStartDate}
                    onChange={(e) => setAmcStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Renewal Date</label>
                  <input
                    type="date"
                    value={amcEndDate}
                    onChange={(e) => setAmcEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Next PM Visit</label>
                  <input
                    type="date"
                    value={amcNextVisit}
                    onChange={(e) => setAmcNextVisit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Annual Value (₹)</label>
                  <input
                    type="number"
                    value={amcValue}
                    onChange={(e) => setAmcValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <button
                type="button"
                disabled={!amcClientName || !amcPhone || !amcEmail || !amcLocation}
                onClick={() =>
                  upsertAmcMutation.mutate({
                    clientName: amcClientName,
                    company: amcCompany || undefined,
                    phone: amcPhone,
                    email: amcEmail,
                    siteLocation: amcLocation,
                    coveredServices: [amcScope],
                    startDate: amcStartDate,
                    endDate: amcEndDate,
                    nextPreventiveVisitDate: amcNextVisit,
                    visitFrequency: amcFrequency,
                    annualContractValue: amcValue,
                    status: "ACTIVE",
                  })
                }
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold"
              >
                Save AMC Contract & Schedule
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Active AMC Contracts & Renewal Reminders
            </h2>
            {amcContracts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No AMC contracts registered yet. Add an AMC contract using the form on the left.
              </div>
            ) : (
              <div className="space-y-3">
                {amcContracts.map((amc) => (
                  <div
                    key={amc.id}
                    className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {amc.contractNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {amc.status}
                        </span>
                      </div>
                      <div className="font-bold text-sm text-slate-900 mt-1">
                        {amc.clientName} {amc.company ? `— ${amc.company}` : ""}
                      </div>
                      <div className="text-xs text-slate-500">{amc.siteLocation}</div>
                    </div>
                    <div className="text-xs text-right space-y-1">
                      <div>
                        <strong>Next Preventive Visit:</strong>{" "}
                        <span className="text-amber-700 font-bold">
                          {amc.nextPreventiveVisitDate}
                        </span>
                      </div>
                      <div>
                        <strong>Renewal Due:</strong> {amc.endDate}
                      </div>
                      <div className="font-mono font-bold text-slate-900">
                        ₹{(amc.annualContractValue ?? (amc as any).contractValue ?? 0).toLocaleString("en-IN")} / yr
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printable PDF Quotation Modal */}
      {pdfModalRecord && (
        <ImsQuotationPdfModal
          record={pdfModalRecord}
          onClose={() => setPdfModalRecord(null)}
        />
      )}
    </div>
  );
}
