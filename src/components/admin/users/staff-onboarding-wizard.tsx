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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StaffDepartment, UserRoleCode } from "@prisma/client";
import { StaffIdCardModal } from "../staff/staff-id-card-modal";

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function StaffOnboardingWizard({ isOpen, onClose, onSuccess }: WizardProps) {
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

  // Post-onboarding Success Hub state
  const [onboardSuccessData, setOnboardSuccessData] = useState<any>(null);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  // Step 2: Documentation & KYC
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [offerLetterUrl, setOfferLetterUrl] = useState("");
  const [appointmentLetterUrl, setAppointmentLetterUrl] = useState("");
  const [aadhaarUrl, setAadhaarUrl] = useState("");
  const [certificatesUrl, setCertificatesUrl] = useState("");

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

  const utils = api.useUtils();

  // Queries
  const { data: managers } = api.staffErp.listStaff.useQuery();
  const { data: shifts } = api.staffErp.listShifts.useQuery();
  const { data: generatedIdData } = api.staffErp.generateUniqueEmployeeId.useQuery(undefined, {
    enabled: isOpen && !employeeId,
  });

  useEffect(() => {
    if (generatedIdData && !employeeId) {
      setEmployeeId(generatedIdData);
    }
  }, [generatedIdData, employeeId]);

  const onboardMutation = api.staffErp.onboardEmployee.useMutation({
    onSuccess: (data: any) => {
      utils.staffErp.listStaff.invalidate();
      if (onSuccess) onSuccess();
      setOnboardSuccessData(data);
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to complete onboarding.");
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
    const documents = [];
    if (resumeUrl.trim()) documents.push({ documentType: "RESUME", title: "Candidate Resume", documentUrl: resumeUrl.trim() });
    if (offerLetterUrl.trim()) documents.push({ documentType: "OFFER_LETTER", title: "Signed Offer Letter", documentUrl: offerLetterUrl.trim() });
    if (appointmentLetterUrl.trim()) documents.push({ documentType: "APPOINTMENT_LETTER", title: "Appointment Letter", documentUrl: appointmentLetterUrl.trim() });
    if (aadhaarUrl.trim()) documents.push({ documentType: "AADHAAR", title: "Government Identity Proof", documentUrl: aadhaarUrl.trim() });
    if (certificatesUrl.trim()) documents.push({ documentType: "CERTIFICATE", title: "Educational Certificates", documentUrl: certificatesUrl.trim() });

    const salaryPaise = Math.round(parseFloat(baseSalaryInRs || "0") * 100);

    onboardMutation.mutate({
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
      documents,
      roleCode,
      password: password.trim() || undefined,
      sendInviteEmail,
      callingNumber: callingNumber.trim() || undefined,
      whatsappNumber: whatsappNumber.trim() || undefined,
      initialChecklist: checklist,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                <UserCheck className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold">Enterprise Staff Onboarding Wizard</h2>
              <Badge className="bg-indigo-600 text-white font-mono text-[10px]">
                {employeeId || "Generating ID..."}
              </Badge>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Multi-step verified institutional employee onboarding, credential provisioning, and KYC checklist.
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
                <span className="font-bold text-slate-900">{onboardSuccessData.user?.name}</span> has been
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
            {/* Stepper Progress Bar */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Profile" },
              { num: 2, label: "Documents & Bank" },
              { num: 3, label: "Account Access" },
              { num: 4, label: "Checklist" },
              { num: 5, label: "Confirmation" },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    currentStep === s.num
                      ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200"
                      : currentStep > s.num
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-500"
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
          <div className="m-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
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
                    High-definition picture for 4K PVC Employee ID Card auto-generation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Employee ID (Auto-Generated)</Label>
                  <Input
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
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
                  <Label className="text-xs font-semibold">Personal Email *</Label>
                  <Input
                    type="email"
                    placeholder="candidate@gmail.com"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Official Email</Label>
                  <Input
                    type="email"
                    placeholder="ramesh@softlabglobal.com"
                    value={officialEmail}
                    onChange={(e) => setOfficialEmail(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Mobile Phone *</Label>
                  <Input
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Department *</Label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as StaffDepartment)}
                    className="w-full h-9 rounded-md border border-slate-300 text-xs px-2.5 bg-white"
                  >
                    {Object.values(StaffDepartment).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Designation *</Label>
                  <Input
                    placeholder="e.g. Admissions Lead"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Reporting Manager</Label>
                  <select
                    value={reportingManagerId}
                    onChange={(e) => setReportingManagerId(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 text-xs px-2.5 bg-white"
                  >
                    <option value="">None / Direct to Director</option>
                    {managers?.items?.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.user?.firstName} {m.user?.lastName} ({m.designation})
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
                    className="text-xs font-mono font-bold"
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
                <Label className="text-xs font-semibold">Residential Address</Label>
                <Input
                  placeholder="Complete permanent or current residential address..."
                  value={residentialAddress}
                  onChange={(e) => setResidentialAddress(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Documentation & KYC */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Step 2: Employment Documentation & Payroll Bank Details
              </h3>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Sensitive employee KYC and bank documents are encrypted with role-restricted access.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase text-slate-500">Document Records & Secure URLs</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">Resume / CV Document URL</Label>
                    <Input
                      placeholder="https://storage.../resume.pdf"
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Offer Letter Document URL</Label>
                    <Input
                      placeholder="https://storage.../offer-letter.pdf"
                      value={offerLetterUrl}
                      onChange={(e) => setOfferLetterUrl(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Signed Appointment Letter URL</Label>
                    <Input
                      placeholder="https://storage.../appointment-letter.pdf"
                      value={appointmentLetterUrl}
                      onChange={(e) => setAppointmentLetterUrl(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Identity Proof (Aadhaar / Voter ID) URL</Label>
                    <Input
                      placeholder="https://storage.../aadhaar.pdf"
                      value={aadhaarUrl}
                      onChange={(e) => setAadhaarUrl(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Educational & Experience Certificates URL</Label>
                  <Input
                    placeholder="https://storage.../certificates-bundle.pdf"
                    value={certificatesUrl}
                    onChange={(e) => setCertificatesUrl(e.target.value)}
                    className="text-xs"
                  />
                </div>
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
                  <Label className="text-xs font-semibold">System User Role *</Label>
                  <select
                    value={roleCode}
                    onChange={(e) => setRoleCode(e.target.value as UserRoleCode)}
                    className="w-full h-9 rounded-md border border-slate-300 text-xs px-2.5 bg-white font-semibold"
                  >
                    {[
                      UserRoleCode.COUNSELOR,
                      UserRoleCode.TELECALLER,
                      UserRoleCode.TRAINER,
                      UserRoleCode.PLACEMENT_OFFICER,
                      UserRoleCode.HR,
                      UserRoleCode.ACCOUNTANT,
                      UserRoleCode.MANAGER,
                      UserRoleCode.ADMIN,
                      UserRoleCode.DIRECTOR,
                    ].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Initial Temporary Password</Label>
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
                Step 5: Review & Authorize Onboarding
              </h3>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
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
                    <span className="text-slate-500 block">Primary Email</span>
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
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-900 text-xs">
                <h4 className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Ready to activate employee
                </h4>
                <p className="mt-1">
                  Upon authorized submission, an audit log will be written, leave balances allocated, and credentials
                  sent to the employee.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
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
                <Button
                  variant="outline"
                  size="sm"
                  disabled={onboardMutation.isPending}
                  onClick={() => handleFinalSubmit("DRAFT")}
                  className="text-xs font-semibold"
                >
                  Save as Draft
                </Button>
                <Button
                  size="sm"
                  disabled={onboardMutation.isPending}
                  onClick={() => handleFinalSubmit("ACTIVE")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
                >
                  {onboardMutation.isPending ? "Activating..." : "Approve & Activate Employee"}
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
    </div>
  );
}
