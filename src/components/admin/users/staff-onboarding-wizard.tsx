"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/trpc/react";
import {
  UserCheck,
  Building2,
  FileText,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
  Briefcase,
  Upload,
  Calendar,
  Clock,
  Sparkles,
  Phone,
  Mail,
  User,
  CreditCard,
  MapPin,
  Copy,
  Send,
  Eye,
  Trash2,
  Plus,
  Download,
  ExternalLink,
  Check,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StaffDepartment, UserRoleCode } from "@prisma/client";
import { StaffIdCardModal } from "../staff/staff-id-card-modal";
import { DocumentPreviewModal } from "@/components/common/document-preview-modal";

export const DOCUMENT_CATEGORIES = [
  {
    category: "Identity Proof",
    type: "IDENTITY_PROOF",
    options: [
      { code: "AADHAAR", label: "Aadhaar Card (UIDAI)" },
      { code: "PAN", label: "Permanent Account Number (PAN Card)" },
      { code: "PASSPORT", label: "Indian Passport" },
      { code: "VOTER_ID", label: "Election Commission Voter ID" },
    ],
  },
  {
    category: "Address Proof",
    type: "ADDRESS_PROOF",
    options: [
      { code: "AADHAAR_ADDR", label: "Aadhaar Card with Residential Address" },
      { code: "UTILITY_BILL", label: "Electricity / Water / Gas Bill" },
      { code: "RENT_AGREEMENT", label: "Registered Rent Agreement / Domicile" },
    ],
  },
  {
    category: "Academic Qualification",
    type: "ACADEMIC_PROOF",
    options: [
      { code: "DEGREE_CERT", label: "Highest Degree / Graduation Certificate" },
      { code: "MARKSHEET", label: "Final Year / Consolidated Marksheet" },
      { code: "CLASS_10_12", label: "10th / 12th Board Passing Certificate" },
    ],
  },
  {
    category: "Experience & Relieving",
    type: "EXPERIENCE_PROOF",
    options: [
      { code: "RELIEVING_LETTER", label: "Relieving Letter from Previous Employer" },
      { code: "EXPERIENCE_CERT", label: "Work Experience Certificate" },
      { code: "PREV_PAYSLIP", label: "Previous 3 Months Salary Slips" },
    ],
  },
  {
    category: "Bank & Financial KYC",
    type: "BANK_KYC",
    options: [
      { code: "CANCELLED_CHEQUE", label: "Cancelled Cheque (Name Printed)" },
      { code: "PASSBOOK", label: "Bank Passbook First Page with Photo" },
      { code: "BANK_STATEMENT", label: "Latest 3 Months Bank Statement" },
    ],
  },
  {
    category: "Official Institutional Letters",
    type: "OFFICIAL_LETTER",
    options: [
      { code: "OFFER_LETTER", label: "Signed SoftLab Offer Letter" },
      { code: "APPOINTMENT_LETTER", label: "Signed Appointment Letter" },
      { code: "RESUME_CV", label: "Signed Curriculum Vitae (Resume)" },
    ],
  },
];

export interface UploadedDocItem {
  id?: string;
  category: string;
  documentType: string;
  title: string;
  documentUrl: string;
  fileName?: string | null;
  fileSize?: number | null;
  isVerified?: boolean;
}

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
    roleCode?: string;
  } | null;
  initialStaff?: any | null; // For editing existing staff member
}

export function StaffOnboardingWizard({
  isOpen,
  onClose,
  onSuccess,
  initialUser,
  initialStaff,
}: WizardProps) {
  const isEditMode = Boolean(initialStaff);
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Profile Details
  const [employeeId, setEmployeeId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [officialEmail, setOfficialEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [residentialAddress, setResidentialAddress] = useState("");
  const [gender, setGender] = useState("MALE");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [employmentType, setEmploymentType] = useState("FULL_TIME");
  const [probationMonths, setProbationMonths] = useState(3);
  const [department, setDepartment] = useState<StaffDepartment>(StaffDepartment.COUNSELING);
  const [designation, setDesignation] = useState("Senior Academic Counselor");
  const [reportingManagerId, setReportingManagerId] = useState<string>("");
  const [branch, setBranch] = useState("PRAYAGRAJ_MAIN");
  const [workLocation, setWorkLocation] = useState("PRAYAGRAJ_CAMPUS");
  const [shiftId, setShiftId] = useState<string>("");
  const [baseSalaryInRs, setBaseSalaryInRs] = useState("45000");
  const [isActiveStatus, setIsActiveStatus] = useState(true);

  // Step 2: Documentation & KYC
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [documentsList, setDocumentsList] = useState<UploadedDocItem[]>([]);

  // Add Document state
  const [newDocCategory, setNewDocCategory] = useState(DOCUMENT_CATEGORIES[0].category);
  const [newDocType, setNewDocType] = useState(DOCUMENT_CATEGORIES[0].options[0].code);
  const [newDocTitle, setNewDocTitle] = useState(DOCUMENT_CATEGORIES[0].options[0].label);

  // Step 3: Account & Access
  const [roleCode, setRoleCode] = useState<UserRoleCode>(UserRoleCode.COUNSELOR);
  const [password, setPassword] = useState("SoftLab@2026!");
  const [crmAccess, setCrmAccess] = useState(true);
  const [hrmsAccess, setHrmsAccess] = useState(true);
  const [lmsAccess, setLmsAccess] = useState(true);
  const [callingNumber, setCallingNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [sendInviteEmail, setSendInviteEmail] = useState(true);

  // Step 4: Checklist Pre-acknowledgements
  const [checklist, setChecklist] = useState({
    docVerificationDone: false,
    offerLetterAckDone: true,
    roleAssignmentDone: true,
    crmAccessVerified: true,
    hrmsProfileDone: true,
    attendancePolicyAckDone: true,
    trainingInductionDone: false,
    managerApprovalDone: true,
  });

  // Post-onboarding Success Hub state & Modals
  const [onboardSuccessData, setOnboardSuccessData] = useState<any>(null);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    documentType?: string;
    documentUrl: string;
    fileName?: string | null;
    fileSize?: number | null;
  } | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingDocIndex, setReplacingDocIndex] = useState<number | null>(null);

  const utils = api.useUtils();

  // Queries
  const { data: managers } = api.staffErp.listReportingManagers.useQuery();
  const { data: shifts } = api.staffErp.listShifts.useQuery();
  const { data: generatedIdData } = api.staffErp.generateUniqueEmployeeId.useQuery(undefined, {
    enabled: isOpen && !employeeId && !isEditMode,
  });

  // Query full staff profile in edit mode if needed
  const { data: fullStaffData } = api.staffErp.getFullStaffProfile.useQuery(
    { staffId: initialStaff?.id || "" },
    { enabled: isOpen && Boolean(initialStaff?.id) }
  );

  useEffect(() => {
    if (generatedIdData && !employeeId && !isEditMode) {
      setEmployeeId(generatedIdData);
    }
  }, [generatedIdData, employeeId, isEditMode]);

  // Sync category change to update default type and label
  const handleCategoryChange = (catName: string) => {
    setNewDocCategory(catName);
    const catObj = DOCUMENT_CATEGORIES.find((c) => c.category === catName);
    if (catObj && catObj.options.length > 0) {
      setNewDocType(catObj.options[0].code);
      setNewDocTitle(catObj.options[0].label);
    }
  };

  const handleDocTypeChange = (code: string) => {
    setNewDocType(code);
    const catObj = DOCUMENT_CATEGORIES.find((c) => c.category === newDocCategory);
    const opt = catObj?.options.find((o) => o.code === code);
    if (opt) setNewDocTitle(opt.label);
  };

  // Populate data when opening in Edit Mode or Promoting User
  useEffect(() => {
    if (!isOpen) return;

    if (initialStaff) {
      const staffSource = fullStaffData || initialStaff;
      setEmployeeId(staffSource.employeeId || "");
      setFirstName(staffSource.user?.firstName || "");
      setLastName(staffSource.user?.lastName || "");
      setOfficialEmail(staffSource.user?.email || "");
      setPersonalEmail(staffSource.personalEmail || staffSource.user?.email || "");
      setPhone(staffSource.user?.phone || staffSource.personalPhone || "");
      setCallingNumber(staffSource.user?.callingNumber || staffSource.user?.phone || "");
      setWhatsappNumber(staffSource.user?.whatsappNumber || staffSource.user?.phone || "");
      setProfilePhoto(staffSource.profilePhoto || staffSource.user?.avatarUrl || "");
      setEmergencyContactName(staffSource.emergencyContactName || "");
      setEmergencyContactPhone(staffSource.emergencyContactPhone || "");
      setResidentialAddress(staffSource.residentialAddress || "");
      setGender(staffSource.gender || "MALE");
      if (staffSource.dateOfBirth) {
        setDateOfBirth(new Date(staffSource.dateOfBirth).toISOString().slice(0, 10));
      }
      if (staffSource.joiningDate) {
        setJoiningDate(new Date(staffSource.joiningDate).toISOString().slice(0, 10));
      }
      setEmploymentType(staffSource.employmentType || "FULL_TIME");
      setProbationMonths(staffSource.probationMonths ?? 3);
      setDepartment(staffSource.department || StaffDepartment.COUNSELING);
      setDesignation(staffSource.designation || "");
      setReportingManagerId(staffSource.reportingManagerId || "");
      setBranch(staffSource.branch || "PRAYAGRAJ_MAIN");
      setWorkLocation(staffSource.workLocation || "PRAYAGRAJ_CAMPUS");
      setShiftId(staffSource.shiftId || "");
      setBaseSalaryInRs(String(Math.round((staffSource.baseSalary || 3000000) / 100)));
      setBankAccountNumber(staffSource.bankAccountNumber || "");
      setBankIfsc(staffSource.bankIfsc || "");
      setPanNumber(staffSource.panNumber || "");
      setIsActiveStatus(staffSource.isActive !== false);

      if (staffSource.user?.roleCode) {
        setRoleCode(staffSource.user.roleCode as UserRoleCode);
      }

      // Populate documents
      if (staffSource.documents && Array.isArray(staffSource.documents)) {
        const formattedDocs: UploadedDocItem[] = staffSource.documents.map((d: any) => {
          const matchedCategory =
            DOCUMENT_CATEGORIES.find((c) =>
              c.options.some((opt) => opt.code === d.documentType)
            )?.category || "Institutional KYC";
          return {
            id: d.id,
            category: matchedCategory,
            documentType: d.documentType,
            title: d.title,
            documentUrl: d.documentUrl,
            fileName: d.fileName || `${d.title}.pdf`,
            fileSize: d.fileSize || 102400,
            isVerified: d.isVerified,
          };
        });
        setDocumentsList(formattedDocs);
      }
    } else if (initialUser) {
      setFirstName(initialUser.firstName || "");
      setLastName(initialUser.lastName || "");
      setPersonalEmail(initialUser.email || "");
      setOfficialEmail(initialUser.email || "");
      setPhone(initialUser.phone || "");
      setCallingNumber(initialUser.phone || "");
      setWhatsappNumber(initialUser.phone || "");
      if (initialUser.avatarUrl) {
        setProfilePhoto(initialUser.avatarUrl);
      }
      if (initialUser.roleCode) {
        setRoleCode(initialUser.roleCode as any);
      }
    }
  }, [initialStaff, fullStaffData, initialUser, isOpen]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Direct File Upload handler for documents
  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultDataUrl = reader.result as string;
      const newDoc: UploadedDocItem = {
        category: newDocCategory,
        documentType: newDocType,
        title: newDocTitle || file.name,
        documentUrl: resultDataUrl,
        fileName: file.name,
        fileSize: file.size,
        isVerified: false,
      };

      setDocumentsList((prev) => [...prev, newDoc]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  // Replace existing document file
  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replacingDocIndex === null) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultDataUrl = reader.result as string;
      setDocumentsList((prev) =>
        prev.map((doc, idx) =>
          idx === replacingDocIndex
            ? {
                ...doc,
                documentUrl: resultDataUrl,
                fileName: file.name,
                fileSize: file.size,
              }
            : doc
        )
      );
      setReplacingDocIndex(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (index: number) => {
    setDocumentsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Mutations
  const onboardMutation = api.staffErp.onboardEmployee.useMutation({
    onSuccess: (data: any) => {
      utils.staffErp.listStaff.invalidate();
      utils.admin.listUsers.invalidate();
      if (onSuccess) onSuccess();
      setOnboardSuccessData(data);
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to complete onboarding.");
    },
  });

  const updateStaffMutation = api.staffErp.updateStaffProfile.useMutation({
    onSuccess: () => {
      utils.staffErp.listStaff.invalidate();
      utils.staffErp.getFullStaffProfile.invalidate();
      utils.crm.getMyReportingHierarchy.invalidate();
      if (onSuccess) onSuccess();
      alert("Staff profile and documents updated successfully!");
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to update staff member.");
    },
  });

  if (!isOpen) return null;

  const handleNext = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setErrorMsg("Please enter first and last name.");
        return;
      }
      if (!personalEmail.trim() || !phone.trim()) {
        setErrorMsg("Personal email and mobile phone are required.");
        return;
      }
      if (!designation.trim()) {
        setErrorMsg("Designation is required.");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinalSubmit = (status: "ACTIVE" | "DRAFT") => {
    setErrorMsg(null);
    const salaryPaise = Math.round(parseFloat(baseSalaryInRs || "0") * 100);

    const formattedDocs = documentsList.map((d) => ({
      id: d.id,
      documentType: d.documentType,
      title: d.title,
      documentUrl: d.documentUrl,
      fileName: d.fileName || undefined,
      fileSize: d.fileSize || undefined,
      isVerified: d.isVerified,
    }));

    if (isEditMode && initialStaff) {
      updateStaffMutation.mutate({
        staffId: initialStaff.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: officialEmail.trim() || personalEmail.trim(),
        phone: phone.trim(),
        callingNumber: callingNumber.trim() || undefined,
        whatsappNumber: whatsappNumber.trim() || undefined,
        personalEmail: personalEmail.trim() || undefined,
        personalPhone: phone.trim() || undefined,
        department,
        designation: designation.trim(),
        baseSalary: salaryPaise,
        employmentType,
        workLocation,
        branch,
        residentialAddress: residentialAddress.trim() || undefined,
        profilePhoto: profilePhoto.trim() || undefined,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        bankIfsc: bankIfsc.trim().toUpperCase() || undefined,
        panNumber: panNumber.trim().toUpperCase() || undefined,
        reportingManagerId: reportingManagerId || null,
        shiftId: shiftId || null,
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        isActive: isActiveStatus,
        documents: formattedDocs,
      });
    } else {
      onboardMutation.mutate({
        existingUserId: initialUser?.id || undefined,
        employeeId: employeeId.trim() || undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        personalEmail: personalEmail.trim(),
        officialEmail: officialEmail.trim() || undefined,
        phone: phone.trim(),
        profilePhoto: profilePhoto.trim() || undefined,
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined,
        residentialAddress: residentialAddress.trim() || undefined,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        employmentType,
        probationMonths: Number(probationMonths) || 3,
        department,
        designation: designation.trim(),
        reportingManagerId: reportingManagerId || undefined,
        branch,
        workLocation,
        shiftId: shiftId || undefined,
        baseSalary: salaryPaise,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        bankIfsc: bankIfsc.trim().toUpperCase() || undefined,
        panNumber: panNumber.trim().toUpperCase() || undefined,
        documents: formattedDocs,
        roleCode,
        password: password.trim() || undefined,
        sendInviteEmail,
        callingNumber: callingNumber.trim() || undefined,
        whatsappNumber: whatsappNumber.trim() || undefined,
        initialChecklist: checklist,
        status,
      });
    }
  };

  const isSaving = onboardMutation.isPending || updateStaffMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-6">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                <UserCheck className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold">
                {isEditMode ? "Staff Profile & Credentials Master Studio (Edit Mode)" : "Enterprise Staff Onboarding Wizard"}
              </h2>
              <Badge className="bg-indigo-600 text-white font-mono text-[10px]">
                {employeeId || (isEditMode ? "Staff Member" : "Auto-Generating...")}
              </Badge>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {isEditMode
                ? "Full editing authority: Update personal details, official credentials, reporting manager, and uploaded KYC documents."
                : "Multi-step verified institutional employee onboarding, credential provisioning, document KYC & direct file uploads."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {onboardSuccessData ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900">
                Staff Member Onboarded Successfully!
              </h3>
              <p className="text-sm text-slate-600 max-w-lg mx-auto">
                <span className="font-bold text-slate-900">{onboardSuccessData.user?.name || `${firstName} ${lastName}`}</span> has been
                provisioned in the system with Employee ID{" "}
                <span className="font-mono font-bold text-indigo-700">{onboardSuccessData.employeeId}</span>.
              </p>
            </div>

            {/* Notification Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-blue-900">Welcome Email Dispatched</p>
                  <p className="text-blue-700">{onboardSuccessData.credentials?.email || personalEmail}</p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-emerald-900">WhatsApp Credentials Sent</p>
                  <p className="text-emerald-700">{phone || whatsappNumber}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowIdCardModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:from-blue-700 hover:to-indigo-700 transition"
              >
                <CreditCard className="w-4 h-4" /> View & Print Official 4K ID Card
              </button>

              <button
                type="button"
                onClick={() => {
                  const msg = `🌟 *WELCOME TO SOFTLAB GLOBAL* 🌟\n\nDear *${firstName} ${lastName}*,\n\nWelcome to SoftLab Global as *${designation}*!\n\n🔑 *YOUR LOGIN CREDENTIALS*:\n• Employee ID: \`${onboardSuccessData.employeeId}\`\n• Portal: https://lms.softlabglobal.com\n• Username: \`${officialEmail || personalEmail}\`\n• Temporary Password: \`${password}\`\n\nWarm regards,\n*SOFTLAB GLOBAL*`;
                  navigator.clipboard.writeText(msg);
                  setCopiedWhatsApp(true);
                  setTimeout(() => setCopiedWhatsApp(false), 3000);
                }}
                className="px-4 py-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition"
              >
                <Copy className="w-4 h-4" />
                {copiedWhatsApp ? "Copied to Clipboard!" : "Copy WhatsApp Card"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOnboardSuccessData(null);
                  onClose();
                }}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition"
              >
                Done & Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {initialUser && !isEditMode && (
              <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-indigo-50 border-b border-indigo-200 p-3 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    {initialUser.firstName?.[0] || "U"}{initialUser.lastName?.[0] || ""}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-950">Promoting Registered User to Institutional Staff</span>
                      <Badge variant="outline" className="text-[10px] bg-white text-indigo-700 border-indigo-300 font-mono">
                        User ID: {initialUser.id.slice(0, 10)}...
                      </Badge>
                    </div>
                    <p className="text-[11px] text-indigo-800 font-medium mt-0.5">
                      {initialUser.firstName} {initialUser.lastName} ({initialUser.email}) — Pre-filled from User Management.
                    </p>
                  </div>
                </div>
                <Badge className="bg-indigo-600 text-white text-[10px] shrink-0 font-semibold shadow-xs">
                  Account Linked
                </Badge>
              </div>
            )}

            {/* Stepper Progress Bar */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
              <div className="flex items-center justify-between">
                {[
                  { num: 1, label: "Profile" },
                  { num: 2, label: "Documents & Bank" },
                  { num: 3, label: "Account Access" },
                  { num: 4, label: "Checklist" },
                  { num: 5, label: isEditMode ? "Save Changes" : "Confirmation" },
                ].map((s) => (
                  <div
                    key={s.num}
                    onClick={() => setCurrentStep(s.num)}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        currentStep === s.num
                          ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200"
                          : currentStep > s.num
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
                      }`}
                    >
                      {currentStep > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                    </div>
                    <span
                      className={`text-xs font-semibold hidden sm:inline ${
                        currentStep === s.num ? "text-indigo-900" : "text-slate-500"
                      }`}
                    >
                      {s.label}
                    </span>
                    {s.num < 5 && <div className="w-8 md:w-16 h-0.5 bg-slate-200 hidden sm:block" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div className="m-4 sm:m-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step Body */}
            <div className="p-4 sm:p-6 max-h-[65vh] overflow-y-auto space-y-4">
              {/* STEP 1: Employee Profile */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    Step 1: Employee Identity, Contacts & Designation
                  </h3>

                  {/* Photo Upload & Preview for 4K ID Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 via-sky-400 to-blue-700 shadow-md flex-shrink-0">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white border border-white">
                        {profilePhoto ? (
                          <img src={profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                            <User className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5 flex-1 text-center sm:text-left">
                      <input
                        type="file"
                        ref={photoInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                        >
                          <Upload className="w-3.5 h-3.5" /> Upload Passport Photo
                        </button>
                        {profilePhoto && (
                          <button
                            type="button"
                            onClick={() => setProfilePhoto("")}
                            className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Official picture for 4K PVC Employee ID Card auto-generation and staff directory.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Employee ID</Label>
                      <Input
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        disabled={isEditMode}
                        className="font-mono text-xs bg-slate-50 font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">First Name *</Label>
                      <Input
                        placeholder="e.g. Ramesh"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Last Name *</Label>
                      <Input
                        placeholder="e.g. Verma"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Official Login Email *</Label>
                      <Input
                        type="email"
                        placeholder="staff@softlabglobal.com"
                        value={officialEmail}
                        onChange={(e) => setOfficialEmail(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Personal Email *</Label>
                      <Input
                        type="email"
                        placeholder="candidate@gmail.com"
                        value={personalEmail}
                        onChange={(e) => setPersonalEmail(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Primary Contact Phone *</Label>
                      <Input
                        placeholder="+91 9876543210"
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPhone(val);
                          if (!callingNumber) setCallingNumber(val);
                          if (!whatsappNumber) setWhatsappNumber(val);
                        }}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Gender</Label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full h-9 rounded-md border border-slate-300 text-xs px-2.5 bg-white"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Date of Birth</Label>
                      <Input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Employment Type</Label>
                      <select
                        value={employmentType}
                        onChange={(e) => setEmploymentType(e.target.value)}
                        className="w-full h-9 rounded-md border border-slate-300 text-xs px-2.5 bg-white"
                      >
                        <option value="FULL_TIME">Full Time Regular</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contractual / Consulting</option>
                        <option value="INTERN">Internship / Trainee</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Department *</Label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value as StaffDepartment)}
                        className="w-full h-9 rounded-md border border-slate-300 text-xs px-2.5 bg-white font-medium"
                      >
                        {Object.values(StaffDepartment).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Official Designation *</Label>
                      <Input
                        placeholder="e.g. Senior Academic Counselor"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-indigo-950 flex items-center justify-between">
                        <span>Reporting Manager (Live Hierarchy)</span>
                        <span className="text-[10px] text-indigo-600 font-normal">Direct Supervisor</span>
                      </Label>
                      <select
                        value={reportingManagerId}
                        onChange={(e) => setReportingManagerId(e.target.value)}
                        className="w-full h-9 rounded-md border border-indigo-300 text-xs px-2.5 bg-indigo-50/40 font-medium"
                      >
                        <option value="">-- Direct Head Office / Director --</option>
                        {managers
                          ?.filter((m) => !initialStaff || m.id !== initialStaff.id)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.user?.firstName} {m.user?.lastName} ({m.employeeId} - {m.designation})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Branch Location</Label>
                      <Input
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Date of Joining</Label>
                      <Input
                        type="date"
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Probation Period (Months)</Label>
                      <Input
                        type="number"
                        value={probationMonths}
                        onChange={(e) => setProbationMonths(Number(e.target.value))}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Base Monthly Salary (₹)</Label>
                      <Input
                        type="number"
                        value={baseSalaryInRs}
                        onChange={(e) => setBaseSalaryInRs(e.target.value)}
                        className="text-xs font-mono font-bold text-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Emergency Contact Name</Label>
                      <Input
                        placeholder="e.g. Suresh Verma (Father)"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Emergency Contact Phone</Label>
                      <Input
                        placeholder="9876500000"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Work Shift</Label>
                      <select
                        value={shiftId}
                        onChange={(e) => setShiftId(e.target.value)}
                        className="w-full h-9 rounded-md border border-slate-300 text-xs px-2.5 bg-white"
                      >
                        <option value="">Default General Shift (09:30 AM - 06:30 PM)</option>
                        {shifts?.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.startTime} - {s.endTime})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Permanent / Residential Address</Label>
                    <Input
                      placeholder="Complete residential address with landmark and PIN..."
                      value={residentialAddress}
                      onChange={(e) => setResidentialAddress(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  {isEditMode && (
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <p className="font-bold text-slate-800 text-xs">Active Staff Status</p>
                        <p className="text-slate-500 text-[11px]">Allow employee institutional portal login and daily punches</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isActiveStatus}
                        onChange={(e) => setIsActiveStatus(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Documentation & KYC (DIRECT FILE UPLOAD & DROPDOWN SELECTION) */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        Step 2: Employment Documentation, File Uploads & Payroll Bank KYC
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select standard document categories, pick official type, and upload files directly from your computer/device.
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-xs">
                      {documentsList.length} Uploaded Files
                    </Badge>
                  </div>

                  {/* Bank & Tax Details */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Bank & Statutory Tax Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs font-semibold">Bank Account Number</Label>
                        <Input
                          placeholder="Account number..."
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          className="text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">IFSC Code</Label>
                        <Input
                          placeholder="HDFC0001234"
                          value={bankIfsc}
                          onChange={(e) => setBankIfsc(e.target.value)}
                          className="text-xs font-mono uppercase"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">PAN Card Number</Label>
                        <Input
                          placeholder="ABCDE1234F"
                          value={panNumber}
                          onChange={(e) => setPanNumber(e.target.value)}
                          className="text-xs font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* DOCUMENT UPLOAD STUDIO: CATEGORY & TYPE SELECTION + DIRECT LOCAL FILE PICKER */}
                  <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/70 border border-indigo-200 rounded-2xl shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-indigo-600" />
                        <span>Direct Document Upload Studio</span>
                      </h4>
                      <span className="text-[11px] text-indigo-700 font-medium">
                        Accepts Images (JPG, PNG) & PDF Documents
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Category Selection Dropdown */}
                      <div>
                        <Label className="text-xs font-semibold text-slate-700">1. Document Category</Label>
                        <select
                          value={newDocCategory}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full h-9 rounded-lg border border-slate-300 text-xs px-2.5 bg-white font-medium"
                        >
                          {DOCUMENT_CATEGORIES.map((c) => (
                            <option key={c.category} value={c.category}>
                              {c.category}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Document Type Dropdown (2-3 options per category) */}
                      <div>
                        <Label className="text-xs font-semibold text-slate-700">2. Document Type (Official)</Label>
                        <select
                          value={newDocType}
                          onChange={(e) => handleDocTypeChange(e.target.value)}
                          className="w-full h-9 rounded-lg border border-slate-300 text-xs px-2.5 bg-white font-medium"
                        >
                          {DOCUMENT_CATEGORIES.find((c) => c.category === newDocCategory)?.options.map((opt) => (
                            <option key={opt.code} value={opt.code}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Direct Upload Button */}
                      <div>
                        <Label className="text-xs font-semibold text-slate-700">3. Select & Upload File</Label>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleDirectFileUpload}
                          accept="image/*,application/pdf"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
                        >
                          <Upload className="w-3.5 h-3.5" /> Browse & Upload From Device
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hidden input for replace */}
                  <input
                    type="file"
                    ref={replaceFileInputRef}
                    onChange={handleReplaceFile}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />

                  {/* UPLOADED DOCUMENTS MASTER LIST (CLICKABLE, EDITABLE, REPLACEABLE) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Uploaded Staff Documents ({documentsList.length})
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Click any document to view or download high-resolution preview
                      </span>
                    </div>

                    {documentsList.length === 0 ? (
                      <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2 bg-slate-50/50">
                        <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">No documents uploaded yet</p>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                          Use the Document Upload Studio above to upload Aadhaar, PAN, Degree Certificate, Offer Letter, or Cancelled Cheque.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {documentsList.map((doc, idx) => {
                          const isPdf =
                            doc.documentUrl.startsWith("data:application/pdf") ||
                            doc.documentUrl.toLowerCase().endsWith(".pdf") ||
                            doc.fileName?.toLowerCase().endsWith(".pdf");

                          return (
                            <div
                              key={doc.id || idx}
                              className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-indigo-400 transition flex flex-col justify-between group"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div
                                    onClick={() => setPreviewDoc(doc)}
                                    className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 cursor-pointer hover:bg-indigo-100 transition shadow-xs"
                                    title="Click to preview file"
                                  >
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div
                                      onClick={() => setPreviewDoc(doc)}
                                      className="font-bold text-xs text-slate-900 truncate hover:text-indigo-600 cursor-pointer flex items-center gap-1.5"
                                      title={doc.title}
                                    >
                                      <span className="truncate">{doc.title}</span>
                                      <Eye className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                                    </div>
                                    <p className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                                      {doc.fileName || "Uploaded file"}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-600 border-slate-200 font-mono">
                                        {doc.documentType}
                                      </Badge>
                                      {doc.isVerified && (
                                        <Badge className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                                          Verified
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Document Action Controls */}
                              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(doc)}
                                  className="px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 rounded flex items-center gap-1 transition"
                                >
                                  <Eye className="w-3 h-3" /> View / Download
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplacingDocIndex(idx);
                                    replaceFileInputRef.current?.click();
                                  }}
                                  className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded flex items-center gap-1 transition"
                                >
                                  <Upload className="w-3 h-3" /> Replace
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDoc(idx)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: System Account & Access */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-indigo-600" />
                    Step 3: Portal Credentials & Role-Based Access Control
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Primary Platform Role *</Label>
                      <select
                        value={roleCode}
                        onChange={(e) => setRoleCode(e.target.value as UserRoleCode)}
                        className="w-full h-9 rounded-md border border-slate-300 text-xs px-2.5 bg-white font-medium"
                      >
                        {[
                          UserRoleCode.COUNSELOR,
                          UserRoleCode.TELECALLER,
                          UserRoleCode.ADMIN,
                          UserRoleCode.HR,
                          UserRoleCode.ACCOUNTANT,
                          UserRoleCode.TRAINER,
                          UserRoleCode.DIRECTOR,
                        ].map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Initial Password {isEditMode && "(Leave as-is to preserve)"}</Label>
                      <Input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Dedicated Business Calling Number</Label>
                      <Input
                        placeholder="e.g. +91 9876501234"
                        value={callingNumber}
                        onChange={(e) => setCallingNumber(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Business WhatsApp Routing Number</Label>
                      <Input
                        placeholder="e.g. +91 9876501234"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500">Module Access Configuration</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={crmAccess}
                          onChange={(e) => setCrmAccess(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        CRM & Lead Pipeline
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hrmsAccess}
                          onChange={(e) => setHrmsAccess(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        HRMS & Attendance Portal
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lmsAccess}
                          onChange={(e) => setLmsAccess(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        LMS Faculty / Trainer Portal
                      </label>
                    </div>
                  </div>

                  {!isEditMode && (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="sendInvite"
                        checked={sendInviteEmail}
                        onChange={(e) => setSendInviteEmail(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="sendInvite" className="text-xs text-slate-700 font-semibold cursor-pointer">
                        Dispatch official welcome email with portal credentials upon activation
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Onboarding Checklist */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Step 4: Institutional Onboarding & Induction Checklist
                  </h3>

                  <p className="text-xs text-slate-500">
                    Track compliance tasks required before employee can undertake independent CRM / LMS operations.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: "offerLetterAckDone", label: "Offer & Appointment Letter Signed & Acknowledged" },
                      { key: "docVerificationDone", label: "KYC & Identity Documents Verified" },
                      { key: "roleAssignmentDone", label: "RBAC Role & Departmental Permissions Configured" },
                      { key: "crmAccessVerified", label: "CRM Pipeline & Calling Channels Linked" },
                      { key: "hrmsProfileDone", label: "HRMS Profile, Shift & Branch Assigned" },
                      { key: "attendancePolicyAckDone", label: "Attendance & Leave Policies Signed" },
                      { key: "trainingInductionDone", label: "Platform Induction & Process Training Completed" },
                      { key: "managerApprovalDone", label: "Department Head / Director Sign-off" },
                    ].map((item) => (
                      <div
                        key={item.key}
                        onClick={() =>
                          setChecklist((prev) => ({
                            ...prev,
                            [item.key]: !(prev as any)[item.key],
                          }))
                        }
                        className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                          (checklist as any)[item.key]
                            ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>{item.label}</span>
                        <input
                          type="checkbox"
                          checked={(checklist as any)[item.key]}
                          readOnly
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 5: Confirmation */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    Step 5: {isEditMode ? "Review & Save Master Profile" : "Review & Authorize Onboarding"}
                  </h3>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Employee ID</span>
                        <span className="font-bold font-mono text-indigo-900">{employeeId}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Full Name</span>
                        <span className="font-bold text-slate-900">{firstName} {lastName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Department</span>
                        <span className="font-bold text-slate-900">{department}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Designation</span>
                        <span className="font-bold text-slate-900">{designation}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Official Email</span>
                        <span className="font-mono text-slate-900">{officialEmail || personalEmail}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Phone</span>
                        <span className="font-mono text-slate-900">{phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">System Role</span>
                        <Badge variant="outline" className="font-mono">{roleCode}</Badge>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Base Salary</span>
                        <span className="font-bold font-mono text-emerald-700">₹{baseSalaryInRs} / mo</span>
                      </div>
                    </div>

                    {/* Documents summary in review */}
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">Uploaded KYC Documents ({documentsList.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {documentsList.map((d, i) => (
                          <div
                            key={d.id || i}
                            onClick={() => setPreviewDoc(d)}
                            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-indigo-700 flex items-center gap-1.5 cursor-pointer hover:border-indigo-400 shadow-xs"
                          >
                            <FileText className="w-3 h-3 text-indigo-600" />
                            <span>{d.title}</span>
                            <Eye className="w-2.5 h-2.5 text-slate-400" />
                          </div>
                        ))}
                        {documentsList.length === 0 && (
                          <span className="text-xs text-slate-400 italic">No documents attached</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-900 text-xs">
                    <h4 className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {isEditMode ? "Ready to save profile changes" : "Ready to activate employee"}
                    </h4>
                    <p className="mt-1">
                      {isEditMode
                        ? "All changes to credentials, contacts, supervisor, and KYC documents will take effect immediately across CRM and HRMS."
                        : "Upon authorized submission, an audit log will be written, leave balances allocated, and credentials sent to the employee."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-slate-50 px-4 sm:px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    className="text-xs font-semibold flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentStep < 5 ? (
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    Next Step
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <>
                    {!isEditMode && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSaving}
                        onClick={() => handleFinalSubmit("DRAFT")}
                        className="text-xs font-semibold"
                      >
                        Save as Draft
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={isSaving}
                      onClick={() => handleFinalSubmit("ACTIVE")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
                    >
                      {isSaving
                        ? "Saving Changes..."
                        : isEditMode
                        ? "Save & Update Staff Profile"
                        : "Approve & Activate Employee"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 4K Official ID Card Modal */}
      {showIdCardModal && onboardSuccessData && (
        <StaffIdCardModal
          isOpen={showIdCardModal}
          onClose={() => setShowIdCardModal(false)}
          initialData={{
            fullName: `${firstName} ${lastName}`,
            designation,
            employeeId: onboardSuccessData.employeeId,
            department,
            contactNo: phone || "+91 9196596975",
            email: officialEmail || personalEmail,
            workLocation: workLocation || "Head Office, Prayagraj",
            photoUrl: profilePhoto,
          }}
        />
      )}

      {/* Document High-Resolution Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          document={previewDoc}
        />
      )}
    </div>
  );
}
