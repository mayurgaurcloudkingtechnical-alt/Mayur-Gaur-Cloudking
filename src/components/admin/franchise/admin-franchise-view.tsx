"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LeadStatus,
  FollowUpType,
  PaymentMethod,
  FranchisePackageType,
  FranchiseStatus,
  FeePaymentStatus,
} from "@prisma/client";
import {
  Building2,
  Search,
  RefreshCw,
  PhoneCall,
  MessageSquare,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MapPin,
  Layers,
  X,
  UserCheck,
  Loader2,
  Eye,
  FileText,
  Plus,
  Edit,
  Trash2,
  Briefcase,
  IndianRupee,
  Check,
  Sparkles,
} from "lucide-react";

const PIPELINE_STATUSES: Array<{ key: LeadStatus; label: string; color: string }> = [
  { key: LeadStatus.NEW, label: "New Application", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: LeadStatus.CONTACTED, label: "Contacted", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { key: LeadStatus.DISCUSSION, label: "In Discussion", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { key: LeadStatus.LOCATION_EVALUATION, label: "Site Evaluation", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { key: LeadStatus.PROPOSAL_SENT, label: "Proposal Sent", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { key: LeadStatus.APPROVED, label: "Approved", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { key: LeadStatus.AGREEMENT, label: "Agreement Signed", color: "bg-teal-100 text-teal-800 border-teal-200" },
  { key: LeadStatus.SETUP, label: "Center Setup", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { key: LeadStatus.LAUNCHED, label: "Launched & Active", color: "bg-green-100 text-green-800 border-green-200" },
  { key: LeadStatus.ON_HOLD, label: "On Hold", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { key: LeadStatus.LOST, label: "Closed / Lost", color: "bg-red-100 text-red-800 border-red-200" },
];

export function AdminFranchiseView() {
  const [activeTab, setActiveTab] = useState<"enquiries" | "partners" | "sales">("enquiries");
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | "ALL">("ALL");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  // Modals state
  const [newEnquiryOpen, setNewEnquiryOpen] = useState(false);
  const [editEnquiryOpen, setEditEnquiryOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<any | null>(null);
  const [leadToConvert, setLeadToConvert] = useState<any | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // New Enquiry Form State
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("Uttar Pradesh");
  const [newPreferredLocation, setNewPreferredLocation] = useState("");
  const [newProfile, setNewProfile] = useState("Entrepreneur");
  const [newInvestmentCapacity, setNewInvestmentCapacity] = useState("₹10 Lakh - ₹15 Lakh");
  const [newExistingInstitute, setNewExistingInstitute] = useState(false);
  const [newExperience, setNewExperience] = useState("");
  const [newLaunchTimeline, setNewLaunchTimeline] = useState("Within 30 Days");
  const [newNotes, setNewNotes] = useState("");

  // Edit Enquiry Form State
  const [editId, setEditId] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editPreferredLocation, setEditPreferredLocation] = useState("");
  const [editProfile, setEditProfile] = useState("");
  const [editInvestmentCapacity, setEditInvestmentCapacity] = useState("");
  const [editExistingInstitute, setEditExistingInstitute] = useState(false);
  const [editExperience, setEditExperience] = useState("");
  const [editLaunchTimeline, setEditLaunchTimeline] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Convert to Sale Form State
  const [centerName, setCenterName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [centerAddress, setCenterAddress] = useState("");
  const [centerCity, setCenterCity] = useState("");
  const [centerState, setCenterState] = useState("");
  const [centerPincode, setCenterPincode] = useState("");
  const [packageType, setPackageType] = useState<FranchisePackageType>(FranchisePackageType.STANDARD_ATC);
  const [packageName, setPackageName] = useState("Authorized Training Center (ATC) License");
  const [totalAmountRupees, setTotalAmountRupees] = useState("500000");
  const [discountAmountRupees, setDiscountAmountRupees] = useState("0");
  const [paidAmountRupees, setPaidAmountRupees] = useState("200000");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [paymentReference, setPaymentReference] = useState("");
  const [agreementDate, setAgreementDate] = useState(new Date().toISOString().split("T")[0]);
  const [validUntilDate, setValidUntilDate] = useState(
    new Date(Date.now() + 365 * 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [saleNotes, setSaleNotes] = useState("");

  // Follow-up form state
  const [followUpType, setFollowUpType] = useState<FollowUpType>(FollowUpType.CALL);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpNextDate, setFollowUpNextDate] = useState("");
  const [followUpNewStatus, setFollowUpNewStatus] = useState<LeadStatus | "">("");

  // Status update form state
  const [quickStatus, setQuickStatus] = useState<LeadStatus | "">("");
  const [statusNotes, setStatusNotes] = useState("");

  const utils = api.useUtils();

  // Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } =
    api.crm.getFranchiseStats.useQuery();

  const { data: salesOverview, refetch: refetchSalesOverview } =
    api.crm.getFranchiseSalesOverview.useQuery();

  const { data: leadsData, isLoading: leadsLoading, refetch: refetchLeads, isFetching } =
    api.crm.listFranchiseLeads.useQuery({
      status: selectedStatus === "ALL" ? undefined : selectedStatus,
      state: selectedState === "ALL" ? undefined : selectedState,
      search: search.trim() || undefined,
      page,
      limit: 25,
    });

  const { data: partnersData, isLoading: partnersLoading, refetch: refetchPartners } =
    api.crm.listFranchisePartners.useQuery({
      search: search.trim() || undefined,
      page,
      limit: 25,
    });

  const { data: salesData, isLoading: salesLoading, refetch: refetchSales } =
    api.crm.listFranchiseSales.useQuery({
      search: search.trim() || undefined,
      page,
      limit: 25,
    });

  const { data: counselors } = api.crm.listCounselors.useQuery();
  const [assigneeId, setAssigneeId] = useState("");

  React.useEffect(() => {
    if (selectedLead) {
      setAssigneeId(selectedLead.assignedToId || "");
    }
  }, [selectedLead?.id, selectedLead?.assignedToId]);

  // Edit Sale Modal State
  const [editSaleModalOpen, setEditSaleModalOpen] = useState(false);
  const [editSaleId, setEditSaleId] = useState("");
  const [editSaleInvoiceNo, setEditSaleInvoiceNo] = useState("");
  const [editSaleCenterName, setEditSaleCenterName] = useState("");
  const [editSalePackageName, setEditSalePackageName] = useState("");
  const [editSaleTotalRupees, setEditSaleTotalRupees] = useState("");
  const [editSaleDiscountRupees, setEditSaleDiscountRupees] = useState("");
  const [editSalePaidRupees, setEditSalePaidRupees] = useState("");
  const [editSalePendingRupees, setEditSalePendingRupees] = useState("");
  const [editSalePaymentStatus, setEditSalePaymentStatus] = useState<FeePaymentStatus>(FeePaymentStatus.PENDING);
  const [editSalePaymentMethod, setEditSalePaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [editSaleReference, setEditSaleReference] = useState("");
  const [editSaleNotes, setEditSaleNotes] = useState("");

  // Mutations
  const createEnquiryMutation = api.crm.createFranchiseEnquiry.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "Franchise enquiry registered successfully!" });
      setNewEnquiryOpen(false);
      resetNewEnquiryForm();
      utils.crm.listFranchiseLeads.invalidate();
      utils.crm.getFranchiseStats.invalidate();
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to create franchise enquiry." });
    },
  });

  const updateEnquiryMutation = api.crm.updateFranchiseEnquiry.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "Franchise enquiry updated successfully!" });
      setEditEnquiryOpen(false);
      utils.crm.listFranchiseLeads.invalidate();
      utils.crm.getFranchiseStats.invalidate();
      if (selectedLead) {
        setSelectedLead((prev: any) => ({ ...prev, fullName: editFullName, email: editEmail, phone: editPhone, city: editCity }));
      }
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to update enquiry." });
    },
  });

  const deleteEnquiryMutation = api.crm.deleteFranchiseEnquiry.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "Franchise enquiry deleted successfully." });
      setDeleteConfirmOpen(false);
      setLeadToDelete(null);
      if (selectedLead?.id === leadToDelete?.id) {
        setSelectedLead(null);
      }
      utils.crm.listFranchiseLeads.invalidate();
      utils.crm.getFranchiseStats.invalidate();
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to delete enquiry." });
    },
  });

  const convertToSaleMutation = api.crm.convertFranchiseToSale.useMutation({
    onSuccess: (res) => {
      setNotification({
        type: "success",
        message: `Successfully converted to Franchise Center: ${res.franchise.centerName} (${res.franchise.code})! Invoice: ${res.sale.saleInvoiceNo}`,
      });
      setConvertModalOpen(false);
      setLeadToConvert(null);
      setSelectedLead(null);
      utils.crm.listFranchiseLeads.invalidate();
      utils.crm.getFranchiseStats.invalidate();
      utils.crm.listFranchisePartners.invalidate();
      utils.crm.listFranchiseSales.invalidate();
      utils.crm.getFranchiseSalesOverview.invalidate();
      setActiveTab("partners");
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to convert franchise." });
    },
  });

  const updateStatusMutation = api.crm.updateFranchiseStatus.useMutation({
    onSuccess: () => {
      utils.crm.listFranchiseLeads.invalidate();
      utils.crm.getFranchiseStats.invalidate();
      setStatusNotes("");
      if (selectedLead && quickStatus) {
        setSelectedLead((prev: any) => (prev ? { ...prev, status: quickStatus } : null));
      }
    },
  });

  const addFollowUpMutation = api.crm.addFranchiseFollowUp.useMutation({
    onSuccess: () => {
      utils.crm.listFranchiseLeads.invalidate();
      utils.crm.getFranchiseStats.invalidate();
      setFollowUpNotes("");
      setFollowUpNextDate("");
      setFollowUpNewStatus("");
      refetchLeads();
    },
  });

  const assignEnquiryMutation = api.crm.assignFranchiseLead.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "Franchise enquiry assigned successfully!" });
      utils.crm.listFranchiseLeads.invalidate();
      if (selectedLead) {
        const assignedStaff = counselors?.find((c: any) => c.id === assigneeId);
        setSelectedLead((prev: any) =>
          prev
            ? {
                ...prev,
                assignedToId: assigneeId || null,
                assignedTo: assignedStaff
                  ? { id: assignedStaff.id, firstName: assignedStaff.firstName, lastName: assignedStaff.lastName, email: assignedStaff.email }
                  : null,
              }
            : null
        );
      }
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to assign franchise enquiry." });
    },
  });

  const updateSaleMutation = api.crm.updateFranchiseSale.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "Franchise sale record updated successfully!" });
      setEditSaleModalOpen(false);
      utils.crm.listFranchiseSales.invalidate();
      utils.crm.getFranchiseSalesOverview.invalidate();
      utils.crm.listFranchisePartners.invalidate();
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to update franchise sale." });
    },
  });

  const openEditSaleModal = (sale: any) => {
    setEditSaleId(sale.id);
    setEditSaleInvoiceNo(sale.saleInvoiceNo || "");
    setEditSaleCenterName(sale.franchise?.centerName || "");
    setEditSalePackageName(sale.packageName || "");
    setEditSaleTotalRupees((sale.totalAmount / 100).toString());
    setEditSaleDiscountRupees(((sale.discountAmount || 0) / 100).toString());
    setEditSalePaidRupees(((sale.paidAmount || 0) / 100).toString());
    setEditSalePendingRupees(((sale.pendingAmount || 0) / 100).toString());
    setEditSalePaymentStatus(sale.paymentStatus || FeePaymentStatus.PENDING);
    setEditSalePaymentMethod(sale.paymentMethod || PaymentMethod.BANK_TRANSFER);
    setEditSaleReference(sale.referenceNumber || "");
    setEditSaleNotes(sale.notes || "");
    setEditSaleModalOpen(true);
  };

  const resetNewEnquiryForm = () => {
    setNewFullName("");
    setNewEmail("");
    setNewPhone("");
    setNewCity("");
    setNewState("Uttar Pradesh");
    setNewPreferredLocation("");
    setNewProfile("Entrepreneur");
    setNewInvestmentCapacity("₹10 Lakh - ₹15 Lakh");
    setNewExistingInstitute(false);
    setNewExperience("");
    setNewLaunchTimeline("Within 30 Days");
    setNewNotes("");
  };

  const openEditModal = (lead: any) => {
    setEditId(lead.id);
    setEditFullName(lead.fullName || "");
    setEditEmail(lead.email || "");
    setEditPhone(lead.phone || "");
    setEditCity(lead.city || "");
    setEditState(lead.franchiseState || "Uttar Pradesh");
    setEditPreferredLocation(lead.franchisePreferredLocation || "");
    setEditProfile(lead.franchiseProfile || "Entrepreneur");
    setEditInvestmentCapacity(lead.franchiseInvestmentCapacity || "Under ₹10 Lakh");
    setEditExistingInstitute(!!lead.franchiseExistingInstitute);
    setEditExperience(lead.franchiseExperience || "");
    setEditLaunchTimeline(lead.franchiseLaunchTimeline || "Within 30 Days");
    setEditNotes(lead.notes || "");
    setEditEnquiryOpen(true);
  };

  const openConvertModal = (lead: any) => {
    setLeadToConvert(lead);
    setCenterName(`${lead.city || "Regional"} Excellence Center`);
    setLegalName(lead.fullName ? `${lead.fullName} & Associates` : "");
    setContactPerson(lead.fullName || "");
    setContactEmail(lead.email || "");
    setContactPhone(lead.phone || "");
    setAlternatePhone("");
    setCenterAddress(lead.franchisePreferredLocation || lead.city || "Commercial Hub");
    setCenterCity(lead.city || "Prayagraj");
    setCenterState(lead.franchiseState || "Uttar Pradesh");
    setCenterPincode("211001");
    setPackageType(FranchisePackageType.STANDARD_ATC);
    setPackageName("Authorized Training Center (ATC) License");
    setTotalAmountRupees("500000");
    setDiscountAmountRupees("0");
    setPaidAmountRupees("200000");
    setPaymentMethod(PaymentMethod.BANK_TRANSFER);
    setPaymentReference("");
    setSaleNotes("");
    setConvertModalOpen(true);
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !quickStatus) return;
    updateStatusMutation.mutate({
      leadId: selectedLead.id,
      status: quickStatus as LeadStatus,
      notes: statusNotes.trim() || undefined,
    });
  };

  const handleAddFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !followUpNotes.trim()) return;
    addFollowUpMutation.mutate({
      leadId: selectedLead.id,
      type: followUpType,
      notes: followUpNotes.trim(),
      nextFollowUpDate: followUpNextDate ? new Date(followUpNextDate) : undefined,
      newStatus: followUpNewStatus ? (followUpNewStatus as LeadStatus) : undefined,
    });
  };

  const handleCreateEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim() || !newPhone.trim() || !newCity.trim() || !newState.trim()) {
      setNotification({ type: "error", message: "Name, email, phone, city, and state are required." });
      return;
    }
    createEnquiryMutation.mutate({
      fullName: newFullName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      city: newCity.trim(),
      franchiseState: newState.trim(),
      franchisePreferredLocation: newPreferredLocation.trim() || undefined,
      franchiseProfile: newProfile,
      franchiseInvestmentCapacity: newInvestmentCapacity,
      franchiseExistingInstitute: newExistingInstitute,
      franchiseExperience: newExperience.trim() || undefined,
      franchiseLaunchTimeline: newLaunchTimeline,
      notes: newNotes.trim() || undefined,
    });
  };

  const handleUpdateEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim() || !editEmail.trim() || !editPhone.trim() || !editCity.trim() || !editState.trim()) {
      setNotification({ type: "error", message: "Name, email, phone, city, and state are required." });
      return;
    }
    updateEnquiryMutation.mutate({
      id: editId,
      fullName: editFullName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      city: editCity.trim(),
      franchiseState: editState.trim(),
      franchisePreferredLocation: editPreferredLocation.trim() || undefined,
      franchiseProfile: editProfile,
      franchiseInvestmentCapacity: editInvestmentCapacity,
      franchiseExistingInstitute: editExistingInstitute,
      franchiseExperience: editExperience.trim() || undefined,
      franchiseLaunchTimeline: editLaunchTimeline,
      notes: editNotes.trim() || undefined,
    });
  };

  const handleConvertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadToConvert) return;
    const totalPaise = Math.round(parseFloat(totalAmountRupees) * 100);
    const discountPaise = Math.round(parseFloat(discountAmountRupees || "0") * 100);
    const paidPaise = Math.round(parseFloat(paidAmountRupees || "0") * 100);

    if (isNaN(totalPaise) || totalPaise <= 0) {
      setNotification({ type: "error", message: "Total franchise fee must be greater than zero." });
      return;
    }

    convertToSaleMutation.mutate({
      leadId: leadToConvert.id,
      centerName: centerName.trim(),
      legalName: legalName.trim() || undefined,
      contactPerson: contactPerson.trim(),
      email: contactEmail.trim(),
      phone: contactPhone.trim(),
      alternatePhone: alternatePhone.trim() || undefined,
      address: centerAddress.trim(),
      city: centerCity.trim(),
      state: centerState.trim(),
      pincode: centerPincode.trim(),
      packageType,
      packageName: packageName.trim(),
      totalAmountPaise: totalPaise,
      discountAmountPaise: discountPaise,
      paidAmountPaise: paidPaise,
      paymentMethod,
      referenceNumber: paymentReference.trim() || undefined,
      agreementDate: agreementDate ? new Date(agreementDate) : undefined,
      validUntil: validUntilDate ? new Date(validUntilDate) : undefined,
      notes: saleNotes.trim() || undefined,
    });
  };

  const formatRupees = (paise: number) => {
    return (paise / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  const getStatusBadge = (status: LeadStatus) => {
    const config = PIPELINE_STATUSES.find((p: any) => p.key === status);
    if (!config) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
          {status}
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. TOP METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Enquiries
            </span>
            <div className="text-2xl font-extrabold text-slate-900">
              {statsLoading ? "..." : stats?.total || 0}
            </div>
            <span className="text-[10px] text-slate-400">All prospect records</span>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
              In Discussion
            </span>
            <div className="text-2xl font-extrabold text-blue-900">
              {statsLoading ? "..." : stats?.pipeline?.DISCUSSION || 0}
            </div>
            <span className="text-[10px] text-blue-600">Active dialogue</span>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700">
              Proposal / Site
            </span>
            <div className="text-2xl font-extrabold text-purple-900">
              {statsLoading
                ? "..."
                : (stats?.pipeline?.LOCATION_EVALUATION || 0) + (stats?.pipeline?.PROPOSAL_SENT || 0)}
            </div>
            <span className="text-[10px] text-purple-600">Feasibility evaluation</span>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Active Centers
            </span>
            <div className="text-2xl font-extrabold text-emerald-900">
              {salesOverview?.activeCenters ?? (stats?.pipeline?.LAUNCHED || 0)}
            </div>
            <span className="text-[10px] text-emerald-600">Operating partners</span>
          </CardContent>
        </Card>

        <Card className="border-teal-200 bg-teal-50/50">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
              Revenue Collected
            </span>
            <div className="text-xl font-black text-teal-900">
              {formatRupees(salesOverview?.totalCollectedPaise || 0)}
            </div>
            <span className="text-[10px] text-teal-600">Franchise license paid</span>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
              Pending Dues
            </span>
            <div className="text-xl font-black text-amber-900">
              {formatRupees(salesOverview?.totalPendingPaise || 0)}
            </div>
            <span className="text-[10px] text-amber-600">Balance receivable</span>
          </CardContent>
        </Card>
      </div>

      {/* 2. TABBED CONTROLS & HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("enquiries")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "enquiries"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Enquiries & Pipeline ({stats?.total || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("partners")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "partners"
                ? "bg-emerald-800 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Franchise Partners / Centers ({salesOverview?.totalCenters || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sales")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "sales"
                ? "bg-teal-800 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <IndianRupee className="h-4 w-4" />
            <span>Sales & Invoices ({salesOverview?.totalSalesCount || 0})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setNewEnquiryOpen(true)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-3 gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Franchise Enquiry</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchLeads();
              refetchStats();
              refetchPartners();
              refetchSales();
              refetchSalesOverview();
            }}
            disabled={isFetching}
            className="h-9 px-2.5 text-xs text-slate-600"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* 3. TAB 1: ENQUIRIES & PIPELINE */}
      {activeTab === "enquiries" && (
        <div className="space-y-6">
          {/* Analytics Overview Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-slate-200 bg-white shadow-xs">
              <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>Applications by State</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                {stats?.stateBreakdown && stats.stateBreakdown.length > 0 ? (
                  stats.stateBreakdown.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                      <span className="text-slate-700 font-medium">{item.state}</span>
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        {item.count}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">No state metrics recorded yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-xs">
              <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <span>Applicant Profile Mix</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                {stats?.profileBreakdown && stats.profileBreakdown.length > 0 ? (
                  stats.profileBreakdown.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                      <span className="text-slate-700 font-medium truncate max-w-[200px]">
                        {item.profile}
                      </span>
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        {item.count}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">No profile metrics recorded yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-xs">
              <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span>Investment Capacity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                {stats?.investmentBreakdown && stats.investmentBreakdown.length > 0 ? (
                  stats.investmentBreakdown.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                      <span className="text-slate-700 font-medium truncate max-w-[200px]">
                        {item.capacity}
                      </span>
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        {item.count}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">No capacity metrics recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Search & Filters */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search applicant name, phone, email, city, or territory..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9 text-xs h-9"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value as any);
                      setPage(1);
                    }}
                    className="h-9 text-xs rounded-md border border-input bg-background px-3 py-1 font-medium"
                  >
                    <option value="ALL">All Pipeline Stages</option>
                    {PIPELINE_STATUSES.map((st: any) => (
                      <option key={st.key} value={st.key}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5 font-bold">Reference / Applicant</th>
                    <th className="p-3.5 font-bold">Target Location</th>
                    <th className="p-3.5 font-bold">Profile & Investment</th>
                    <th className="p-3.5 font-bold">Pipeline Stage</th>
                    <th className="p-3.5 font-bold">Applied On</th>
                    <th className="p-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leadsLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        <span>Loading franchise applications...</span>
                      </td>
                    </tr>
                  ) : leadsData?.leads && leadsData.leads.length > 0 ? (
                    leadsData.leads.map((lead) => {
                      const refNo = `SLG-FRN-2026-${lead.id.slice(-4).toUpperCase()}`;
                      return (
                        <tr
                          key={lead.id}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedLead(lead);
                            setQuickStatus(lead.status);
                          }}
                        >
                          <td className="p-3.5">
                            <div className="font-mono text-[11px] font-bold text-emerald-800">
                              {refNo}
                            </div>
                            <div className="font-bold text-slate-900 mt-0.5">{lead.fullName}</div>
                            <div className="text-[11px] text-slate-500">{lead.phone} • {lead.email}</div>
                          </td>

                          <td className="p-3.5">
                            <div className="font-medium text-slate-900">
                              {lead.city || "N/A"}{lead.franchiseState ? `, ${lead.franchiseState}` : ""}
                            </div>
                            {lead.franchisePreferredLocation && (
                              <div className="text-[11px] text-slate-500">
                                Locality: {lead.franchisePreferredLocation}
                              </div>
                            )}
                          </td>

                          <td className="p-3.5">
                            <div className="text-slate-800 font-medium">{lead.franchiseProfile || "General"}</div>
                            <div className="text-[11px] text-emerald-700 font-semibold">
                              {lead.franchiseInvestmentCapacity || "Under ₹10 Lakh"}
                            </div>
                          </td>

                          <td className="p-3.5">
                            {getStatusBadge(lead.status)}
                          </td>

                          <td className="p-3.5 text-slate-500 text-[11px]">
                            <div>{new Date(lead.createdAt).toLocaleDateString("en-IN")}</div>
                            <div className="text-[10px] text-slate-400">
                              {lead._count?.followUps || 0} follow-up(s)
                            </div>
                            {lead.assignedTo && (
                              <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">
                                Assigned: {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                              </div>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openConvertModal(lead)}
                                className="text-xs h-8 px-2.5 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              >
                                <Sparkles className="h-3.5 w-3.5 mr-1" />
                                <span>Convert</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(lead)}
                                className="text-xs h-8 px-2 text-slate-600 hover:bg-slate-100"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setLeadToDelete(lead);
                                  setDeleteConfirmOpen(true);
                                }}
                                className="text-xs h-8 px-2 text-red-600 hover:bg-red-50 border-red-200"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setQuickStatus(lead.status);
                                }}
                                className="text-xs h-8 px-2.5 border-slate-300 text-slate-700 hover:bg-slate-50"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                <span>Review</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        <Building2 className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700">No franchise applications found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Applications submitted via the public /franchise page or added manually will appear here.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 4. TAB 2: FRANCHISE PARTNERS / CENTERS */}
      {activeTab === "partners" && (
        <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Institutional Partner Centers</h3>
              <p className="text-xs text-slate-500">
                Official operational SoftLab Global authorized training & university admission centers nationwide.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search center code, name, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 font-bold">Center Code / Name</th>
                  <th className="p-3.5 font-bold">Contact Person</th>
                  <th className="p-3.5 font-bold">Territory / Location</th>
                  <th className="p-3.5 font-bold">License Package</th>
                  <th className="p-3.5 font-bold">Agreement Valid Until</th>
                  <th className="p-3.5 font-bold text-right">Revenue Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partnersLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      <span>Loading franchise centers...</span>
                    </td>
                  </tr>
                ) : partnersData?.partners && partnersData.partners.length > 0 ? (
                  partnersData.partners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-slate-50/80">
                      <td className="p-3.5">
                        <div className="font-mono text-[11px] font-bold text-emerald-800">{partner.code}</div>
                        <div className="font-bold text-slate-900 text-sm mt-0.5">{partner.centerName}</div>
                        {partner.legalName && (
                          <div className="text-[11px] text-slate-400">Legal: {partner.legalName}</div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{partner.contactPerson}</div>
                        <div className="text-[11px] text-slate-500">{partner.phone} • {partner.email}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-slate-800">{partner.city}, {partner.state}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{partner.address}</div>
                      </td>
                      <td className="p-3.5">
                        <Badge className="bg-slate-100 text-slate-800 border-slate-300 text-[10px] font-mono">
                          {partner.packageType.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {partner.validUntil
                          ? new Date(partner.validUntil).toLocaleDateString("en-IN")
                          : "3 Years Standard"}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-800 text-sm">
                        {formatRupees(partner.totalRevenue)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700">No converted franchise centers yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Use the "Convert" button on any qualified application in Tab 1 to activate a partner center.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 5. TAB 3: FRANCHISE SALES & INVOICES */}
      {activeTab === "sales" && (
        <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Franchise Expansion Sales Ledger</h3>
              <p className="text-xs text-slate-500">
                Authoritative transaction ledger for initial center license fees, expansion packages, and renewals.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search invoice number, package..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 font-bold">Invoice No / Date</th>
                  <th className="p-3.5 font-bold">Partner Center</th>
                  <th className="p-3.5 font-bold">Package Name</th>
                  <th className="p-3.5 font-bold">Total License Fee</th>
                  <th className="p-3.5 font-bold">Paid / Pending</th>
                  <th className="p-3.5 font-bold">Payment Status</th>
                  <th className="p-3.5 font-bold">Mode / Ref</th>
                  <th className="p-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      <span>Loading franchise sales invoices...</span>
                    </td>
                  </tr>
                ) : salesData?.sales && salesData.sales.length > 0 ? (
                  salesData.sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80">
                      <td className="p-3.5">
                        <div className="font-mono text-[11px] font-bold text-teal-800">{sale.saleInvoiceNo}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(sale.createdAt).toLocaleDateString("en-IN")}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{sale.franchise.centerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{sale.franchise.code}</div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">{sale.packageName}</td>
                      <td className="p-3.5 font-mono font-semibold text-slate-900">
                        {formatRupees(sale.totalAmount)}
                      </td>
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-emerald-700">{formatRupees(sale.paidAmount)}</div>
                        {sale.pendingAmount > 0 ? (
                          <div className="text-[10px] text-amber-600 font-mono">
                            Pending: {formatRupees(sale.pendingAmount)}
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-600 font-semibold">Fully Cleared</div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          className={`text-[10px] font-bold ${
                            sale.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : sale.paymentStatus === "PARTIAL"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }`}
                        >
                          {sale.paymentStatus}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-600">
                        <div>{sale.paymentMethod}</div>
                        {sale.referenceNumber && (
                          <div className="text-[10px] text-slate-400">Ref: {sale.referenceNumber}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditSaleModal(sale)}
                          className="text-[10px] h-7 px-2.5 gap-1 border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit / Update Payment</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      <IndianRupee className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700">No franchise sales recorded yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        When an enquiry is converted, the associated franchise sale invoice will display here.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL 1: NEW FRANCHISE ENQUIRY */}
      {newEnquiryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Franchise Enquiry</h3>
                <p className="text-xs text-slate-500">Manually record a new institutional partner application</p>
              </div>
              <button
                type="button"
                onClick={() => setNewEnquiryOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEnquiry} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Applicant Full Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Ramesh Chandra Verma"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Contact Number *</Label>
                  <Input
                    required
                    placeholder="10 digit mobile"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Email Address *</Label>
                  <Input
                    required
                    type="email"
                    placeholder="e.g. partner@institute.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Target City *</Label>
                  <Input
                    required
                    placeholder="e.g. Varanasi / Kanpur"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">State *</Label>
                  <Input
                    required
                    placeholder="e.g. Uttar Pradesh"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Preferred Territory / Locality</Label>
                  <Input
                    placeholder="e.g. Civil Lines, Main Market"
                    value={newPreferredLocation}
                    onChange={(e) => setNewPreferredLocation(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Applicant Background</Label>
                  <select
                    value={newProfile}
                    onChange={(e) => setNewProfile(e.target.value)}
                    className="w-full h-9 mt-1 rounded-md border border-input bg-white px-3 py-1 text-xs"
                  >
                    <option value="Entrepreneur">Entrepreneur</option>
                    <option value="Existing Institute Owner">Existing Institute Owner</option>
                    <option value="IT Corporate Professional">IT Corporate Professional</option>
                    <option value="Academician / Faculty">Academician / Faculty</option>
                    <option value="Investor">Investor</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Investment Capacity</Label>
                  <select
                    value={newInvestmentCapacity}
                    onChange={(e) => setNewInvestmentCapacity(e.target.value)}
                    className="w-full h-9 mt-1 rounded-md border border-input bg-white px-3 py-1 text-xs"
                  >
                    <option value="Under ₹10 Lakh">Under ₹10 Lakh</option>
                    <option value="₹10 Lakh - ₹15 Lakh">₹10 Lakh - ₹15 Lakh</option>
                    <option value="₹15 Lakh - ₹25 Lakh">₹15 Lakh - ₹25 Lakh</option>
                    <option value="Above ₹25 Lakh">Above ₹25 Lakh</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Timeline to Launch</Label>
                  <select
                    value={newLaunchTimeline}
                    onChange={(e) => setNewLaunchTimeline(e.target.value)}
                    className="w-full h-9 mt-1 rounded-md border border-input bg-white px-3 py-1 text-xs"
                  >
                    <option value="Immediate">Immediate (&lt; 15 Days)</option>
                    <option value="Within 30 Days">Within 30 Days</option>
                    <option value="1 - 3 Months">1 - 3 Months</option>
                    <option value="Exploring Feasibility">Exploring Feasibility</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="existingInstCheck"
                    checked={newExistingInstitute}
                    onChange={(e) => setNewExistingInstitute(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <Label htmlFor="existingInstCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Has Existing Educational Institute / Setup
                  </Label>
                </div>
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-700">Relevant Experience / Current Setup</Label>
                <Input
                  placeholder="e.g. 5+ years managing vocational training center in Allahabad"
                  value={newExperience}
                  onChange={(e) => setNewExperience(e.target.value)}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-700">Internal Counsel Notes</Label>
                <textarea
                  rows={2}
                  placeholder="Initial inquiry details, caller feedback, territory feasibility notes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full mt-1 rounded-md border border-input bg-white px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewEnquiryOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createEnquiryMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {createEnquiryMutation.isPending ? "Creating..." : "Save Franchise Enquiry"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT FRANCHISE ENQUIRY */}
      {editEnquiryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Franchise Enquiry</h3>
                <p className="text-xs text-slate-500">Update applicant and territory records</p>
              </div>
              <button
                type="button"
                onClick={() => setEditEnquiryOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateEnquiry} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Applicant Full Name *</Label>
                  <Input
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Contact Number *</Label>
                  <Input
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Email Address *</Label>
                  <Input
                    required
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">City *</Label>
                  <Input
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">State *</Label>
                  <Input
                    required
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Preferred Location</Label>
                  <Input
                    value={editPreferredLocation}
                    onChange={(e) => setEditPreferredLocation(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-700">Internal Counsel Notes</Label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full mt-1 rounded-md border border-input bg-white px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditEnquiryOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateEnquiryMutation.isPending}
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {updateEnquiryMutation.isPending ? "Updating..." : "Update Enquiry"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONVERT TO SALE / PARTNER */}
      {convertModalOpen && leadToConvert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-base font-bold text-slate-900">
                    Convert to Authorized Franchise Partner
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Creates operational center record, generates official license invoice, and records payment
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConvertModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConvertSubmit} className="p-6 space-y-4 text-xs">
              {/* Section 1: Center Identity */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Center Identity & Ownership</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">Center Name *</Label>
                    <Input
                      required
                      placeholder="e.g. SoftLab Global Varanasi Center"
                      value={centerName}
                      onChange={(e) => setCenterName(e.target.value)}
                      className="mt-1 h-9 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">Legal Entity / Registered Name</Label>
                    <Input
                      placeholder="e.g. Kashi Edutech Pvt. Ltd."
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      className="mt-1 h-9 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">Key Contact Person *</Label>
                    <Input
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="mt-1 h-9 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">Phone *</Label>
                    <Input
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="mt-1 h-9 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">Email *</Label>
                    <Input
                      required
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="mt-1 h-9 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <Label className="text-[11px] font-semibold text-slate-700">Center Physical Address *</Label>
                    <Input
                      required
                      placeholder="e.g. 2nd Floor, Grand Plaza, Sigra"
                      value={centerAddress}
                      onChange={(e) => setCenterAddress(e.target.value)}
                      className="mt-1 h-9 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">Pincode *</Label>
                    <Input
                      required
                      value={centerPincode}
                      onChange={(e) => setCenterPincode(e.target.value)}
                      className="mt-1 h-9 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Package & Commercials */}
              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Franchise License Commercials</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">Package Tier</Label>
                    <select
                      value={packageType}
                      onChange={(e) => {
                        const val = e.target.value as FranchisePackageType;
                        setPackageType(val);
                        if (val === "PREMIUM_HUB") {
                          setTotalAmountRupees("800000");
                          setPackageName("Premium Tech Hub & University Admission Center");
                        } else if (val === "DISTRICT_PARTNER") {
                          setTotalAmountRupees("1200000");
                          setPackageName("District Master Partner License");
                        } else {
                          setTotalAmountRupees("500000");
                          setPackageName("Authorized Training Center (ATC) License");
                        }
                      }}
                      className="w-full h-9 mt-1 rounded-md border border-input bg-white px-3 py-1 text-xs"
                    >
                      <option value={FranchisePackageType.STANDARD_ATC}>Standard Authorized Training Center (ATC)</option>
                      <option value={FranchisePackageType.PREMIUM_HUB}>Premium Tech Hub & Admission Hub</option>
                      <option value={FranchisePackageType.DISTRICT_PARTNER}>District Master Franchise</option>
                      <option value={FranchisePackageType.STATE_MASTER}>State Master Expansion Partner</option>
                      <option value={FranchisePackageType.CUSTOM}>Custom Strategic Agreement</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">Invoice Package Name</Label>
                    <Input
                      required
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      className="mt-1 h-9 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">Total License Fee (₹) *</Label>
                    <Input
                      required
                      type="number"
                      value={totalAmountRupees}
                      onChange={(e) => setTotalAmountRupees(e.target.value)}
                      className="mt-1 h-9 text-xs bg-white font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">Discount / Waiver (₹)</Label>
                    <Input
                      type="number"
                      value={discountAmountRupees}
                      onChange={(e) => setDiscountAmountRupees(e.target.value)}
                      className="mt-1 h-9 text-xs bg-white font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">Amount Paid Today (₹) *</Label>
                    <Input
                      required
                      type="number"
                      value={paidAmountRupees}
                      onChange={(e) => setPaidAmountRupees(e.target.value)}
                      className="mt-1 h-9 text-xs bg-white font-mono font-bold text-emerald-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">Payment Mode *</Label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full h-9 mt-1 rounded-md border border-input bg-white px-3 py-1 text-xs"
                    >
                      <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer (NEFT / RTGS / IMPS)</option>
                      <option value={PaymentMethod.UPI}>UPI / Corporate QR</option>
                      <option value={PaymentMethod.CHEQUE}>Demand Draft / Cheque</option>
                      <option value={PaymentMethod.CASH}>Cash Deposit</option>
                      <option value={PaymentMethod.CARD}>Corporate Card</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">Transaction ID / UTR / Cheque No.</Label>
                    <Input
                      placeholder="e.g. UTR-9821839021 or Cheque #102931"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="mt-1 h-9 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">Agreement Date</Label>
                    <Input
                      type="date"
                      value={agreementDate}
                      onChange={(e) => setAgreementDate(e.target.value)}
                      className="mt-1 h-9 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">License Valid Until</Label>
                    <Input
                      type="date"
                      value={validUntilDate}
                      onChange={(e) => setValidUntilDate(e.target.value)}
                      className="mt-1 h-9 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-700">Notes & Special Territorial Grants</Label>
                <textarea
                  rows={2}
                  placeholder="e.g. Exclusive pin-code territory grant for 36 months; university admission stream included."
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  className="w-full mt-1 rounded-md border border-input bg-white px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConvertModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={convertToSaleMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {convertToSaleMutation.isPending ? "Converting..." : "Complete Conversion & Generate Invoice"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION */}
      {deleteConfirmOpen && leadToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Franchise Enquiry?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently remove the application for{" "}
                <span className="font-bold text-slate-800">{leadToDelete.fullName}</span>? This action is logged.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={deleteEnquiryMutation.isPending}
                onClick={() => deleteEnquiryMutation.mutate({ id: leadToDelete.id })}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteEnquiryMutation.isPending ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT FRANCHISE SALE / UPDATE PAYMENT */}
      {editSaleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Franchise Sale / Payment</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{editSaleInvoiceNo} • {editSaleCenterName}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditSaleModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const totalPaise = Math.round(parseFloat(editSaleTotalRupees || "0") * 100);
                const discountPaise = Math.round(parseFloat(editSaleDiscountRupees || "0") * 100);
                const paidPaise = Math.round(parseFloat(editSalePaidRupees || "0") * 100);
                const pendingPaise = Math.round(parseFloat(editSalePendingRupees || "0") * 100);

                updateSaleMutation.mutate({
                  saleId: editSaleId,
                  packageName: editSalePackageName.trim(),
                  totalAmount: totalPaise,
                  discountAmount: discountPaise,
                  paidAmount: paidPaise,
                  pendingAmount: pendingPaise,
                  paymentStatus: editSalePaymentStatus,
                  paymentMethod: editSalePaymentMethod,
                  referenceNumber: editSaleReference.trim() || undefined,
                  notes: editSaleNotes.trim() || undefined,
                });
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div>
                <Label className="text-[11px] font-semibold text-slate-700">Package Name</Label>
                <Input
                  value={editSalePackageName}
                  onChange={(e) => setEditSalePackageName(e.target.value)}
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Total License Fee (₹)</Label>
                  <Input
                    type="number"
                    value={editSaleTotalRupees}
                    onChange={(e) => {
                      setEditSaleTotalRupees(e.target.value);
                      const tot = parseFloat(e.target.value) || 0;
                      const disc = parseFloat(editSaleDiscountRupees) || 0;
                      const paid = parseFloat(editSalePaidRupees) || 0;
                      setEditSalePendingRupees(Math.max(0, tot - disc - paid).toString());
                    }}
                    className="mt-1 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Discount (₹)</Label>
                  <Input
                    type="number"
                    value={editSaleDiscountRupees}
                    onChange={(e) => {
                      setEditSaleDiscountRupees(e.target.value);
                      const tot = parseFloat(editSaleTotalRupees) || 0;
                      const disc = parseFloat(e.target.value) || 0;
                      const paid = parseFloat(editSalePaidRupees) || 0;
                      setEditSalePendingRupees(Math.max(0, tot - disc - paid).toString());
                    }}
                    className="mt-1 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Paid Amount (₹)</Label>
                  <Input
                    type="number"
                    value={editSalePaidRupees}
                    onChange={(e) => {
                      setEditSalePaidRupees(e.target.value);
                      const tot = parseFloat(editSaleTotalRupees) || 0;
                      const disc = parseFloat(editSaleDiscountRupees) || 0;
                      const paid = parseFloat(e.target.value) || 0;
                      const pend = Math.max(0, tot - disc - paid);
                      setEditSalePendingRupees(pend.toString());
                      if (paid >= tot - disc && tot - disc > 0) {
                        setEditSalePaymentStatus(FeePaymentStatus.PAID);
                      } else if (paid > 0) {
                        setEditSalePaymentStatus(FeePaymentStatus.PARTIAL);
                      } else {
                        setEditSalePaymentStatus(FeePaymentStatus.PENDING);
                      }
                    }}
                    className="mt-1 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Pending Amount (₹)</Label>
                  <Input
                    type="number"
                    value={editSalePendingRupees}
                    onChange={(e) => setEditSalePendingRupees(e.target.value)}
                    className="mt-1 text-xs font-mono bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Payment Status</Label>
                  <select
                    value={editSalePaymentStatus}
                    onChange={(e) => setEditSalePaymentStatus(e.target.value as FeePaymentStatus)}
                    className="w-full h-9 px-3 mt-1 rounded-md border border-slate-300 text-xs bg-white"
                  >
                    <option value={FeePaymentStatus.PENDING}>PENDING</option>
                    <option value={FeePaymentStatus.PARTIAL}>PARTIAL</option>
                    <option value={FeePaymentStatus.PAID}>PAID</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-700">Payment Mode</Label>
                  <select
                    value={editSalePaymentMethod}
                    onChange={(e) => setEditSalePaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full h-9 px-3 mt-1 rounded-md border border-slate-300 text-xs bg-white"
                  >
                    <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value={PaymentMethod.UPI}>UPI Transfer</option>
                    <option value={PaymentMethod.CHEQUE}>Cheque / Demand Draft</option>
                    <option value={PaymentMethod.CASH}>Cash Deposit</option>
                    <option value={PaymentMethod.CARD}>Credit / Debit Card</option>
                    <option value={PaymentMethod.OTHER}>Other / Gateway</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-700">Transaction Reference / UTR Number</Label>
                <Input
                  value={editSaleReference}
                  onChange={(e) => setEditSaleReference(e.target.value)}
                  placeholder="e.g. UTR12345678 or Cheque #8912"
                  className="mt-1 text-xs font-mono"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-700">Audit / Accounting Notes</Label>
                <textarea
                  value={editSaleNotes}
                  onChange={(e) => setEditSaleNotes(e.target.value)}
                  placeholder="Notes regarding franchise payment installment, verification..."
                  rows={2}
                  className="w-full p-2.5 mt-1 rounded-md border border-slate-300 text-xs bg-white resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditSaleModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateSaleMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  {updateSaleMutation.isPending ? "Updating..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. SIDE DRAWER REVIEW PANEL FOR SELECTED LEAD */}
      {selectedLead && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-emerald-400 font-bold">
                    SLG-FRN-2026-{selectedLead.id.slice(-4).toUpperCase()}
                  </div>
                  <h3 className="text-base font-bold text-white">{selectedLead.fullName}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Top Quick Actions Bar */}
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-xs text-emerald-950 font-medium">
                  Ready to finalize territory license with {selectedLead.fullName}?
                </div>
                <Button
                  size="sm"
                  onClick={() => openConvertModal(selectedLead)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 gap-1 shadow-sm shrink-0"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Convert to Center</span>
                </Button>
              </div>

              {/* Applicant Contact & Location Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Contact Number</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedLead.phone}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium"
                    >
                      <PhoneCall className="h-3 w-3" />
                      <span>Call</span>
                    </a>
                    <span>•</span>
                    <a
                      href={`https://wa.me/91${selectedLead.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 font-medium"
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Official Email</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedLead.email}</div>
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="mt-1 inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 font-medium"
                  >
                    <Mail className="h-3 w-3" />
                    <span>Send Mail</span>
                  </a>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target Market</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {selectedLead.city || "N/A"}{selectedLead.franchiseState ? `, ${selectedLead.franchiseState}` : ""}
                  </div>
                  {selectedLead.franchisePreferredLocation && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {selectedLead.franchisePreferredLocation}
                    </div>
                  )}
                </div>
              </div>

              {/* Franchise Profile Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Profile</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {selectedLead.franchiseProfile || "General"}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Investment Tier</span>
                  <div className="font-bold text-emerald-800 mt-0.5">
                    {selectedLead.franchiseInvestmentCapacity || "Under ₹10 Lakh"}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Launch Timeline</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {selectedLead.franchiseLaunchTimeline || "Immediate"}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Existing Institute</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {selectedLead.franchiseExistingInstitute ? "Yes (Active)" : "No (New)"}
                  </div>
                </div>
              </div>

              {/* Notes & Requirements */}
              {(selectedLead.franchiseExperience || selectedLead.notes) && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Application Details & Background
                  </span>
                  {selectedLead.franchiseExperience && (
                    <p className="text-slate-700">
                      <strong>Experience:</strong> {selectedLead.franchiseExperience}
                    </p>
                  )}
                  {selectedLead.notes && (
                    <div className="pt-2 border-t border-slate-200/60 whitespace-pre-line text-slate-600 font-mono text-[11px]">
                      {selectedLead.notes}
                    </div>
                  )}
                </div>
              )}

              {/* Assign Opportunity / Territory Manager */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <span className="font-bold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-blue-700" />
                  <span>Assign Franchise Enquiry / Territory Manager</span>
                </span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    value={assigneeId || selectedLead.assignedToId || ""}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="flex-1 text-xs h-9 px-3 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">-- Unassigned (Central Desk) --</option>
                    {counselors?.map((staff: any) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.firstName} {staff.lastName} ({staff.roleCode})
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    disabled={assignEnquiryMutation.isPending}
                    onClick={() => {
                      if (!selectedLead) return;
                      assignEnquiryMutation.mutate({
                        leadId: selectedLead.id,
                        assignedToId: assigneeId || null,
                      });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-3 shrink-0 font-semibold"
                  >
                    {assignEnquiryMutation.isPending ? "Assigning..." : "Assign"}
                  </Button>
                </div>
                {selectedLead.assignedTo && (
                  <div className="text-[11px] text-blue-800 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                    <span>
                      Currently Assigned: <strong>{selectedLead.assignedTo.firstName} {selectedLead.assignedTo.lastName}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Status Update Section */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-emerald-700" />
                  <span>Update Franchise Pipeline Stage</span>
                </span>
                <form onSubmit={handleUpdateStatus} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Pipeline Stage</Label>
                      <select
                        value={quickStatus}
                        onChange={(e) => setQuickStatus(e.target.value as LeadStatus)}
                        className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs"
                      >
                        {PIPELINE_STATUSES.map((st: any) => (
                          <option key={st.key} value={st.key}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Change Note (Optional)</Label>
                      <Input
                        placeholder="e.g. Introductory call completed; sent prospectus."
                        value={statusNotes}
                        onChange={(e) => setStatusNotes(e.target.value)}
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateStatusMutation.isPending || quickStatus === selectedLead.status}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 px-4"
                  >
                    {updateStatusMutation.isPending ? "Updating..." : "Save Pipeline Stage"}
                  </Button>
                </form>
              </div>

              {/* Follow-up Logging Section */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <PhoneCall className="h-4 w-4 text-slate-600" />
                  <span>Log Follow-Up & Next Scheduled Action</span>
                </span>
                <form onSubmit={handleAddFollowUp} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Action Type</Label>
                      <select
                        value={followUpType}
                        onChange={(e) => setFollowUpType(e.target.value as FollowUpType)}
                        className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs"
                      >
                        <option value={FollowUpType.CALL}>Phone Call</option>
                        <option value={FollowUpType.MESSAGE}>WhatsApp / Message</option>
                        <option value={FollowUpType.COUNSELLING_SESSION}>Video / In-person Meeting</option>
                        <option value={FollowUpType.NOTE}>Internal Review Note</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Next Follow-Up Date</Label>
                      <Input
                        type="datetime-local"
                        value={followUpNextDate}
                        onChange={(e) => setFollowUpNextDate(e.target.value)}
                        className="h-9 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Advance Stage (Optional)</Label>
                      <select
                        value={followUpNewStatus}
                        onChange={(e) => setFollowUpNewStatus(e.target.value as LeadStatus)}
                        className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs"
                      >
                        <option value="">Keep Current Stage</option>
                        {PIPELINE_STATUSES.map((st: any) => (
                          <option key={st.key} value={st.key}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700">Discussion Notes *</Label>
                    <textarea
                      rows={2}
                      placeholder="Enter specific points discussed, commercial queries, territory boundaries..."
                      value={followUpNotes}
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={addFollowUpMutation.isPending}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 px-4"
                  >
                    {addFollowUpMutation.isPending ? "Saving..." : "Log Follow-Up History"}
                  </Button>
                </form>
              </div>

              {/* Follow-up Timeline */}
              {selectedLead.followUps && selectedLead.followUps.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Recent Follow-Up Activity
                  </span>
                  <div className="space-y-2">
                    {selectedLead.followUps.map((fu: any) => (
                      <div key={fu.id} className="p-3 rounded-xl border border-slate-100 bg-white text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-bold text-slate-700">
                            {fu.type} by {fu.performedBy?.firstName || "Team"}
                          </span>
                          <span>{new Date(fu.createdAt).toLocaleString("en-IN")}</span>
                        </div>
                        <p className="text-slate-700 text-xs">{fu.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
