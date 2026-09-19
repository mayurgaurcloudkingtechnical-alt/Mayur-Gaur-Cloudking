"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Shield,
  CreditCard,
  Building,
  Palette,
  Share2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  KeyRound,
} from "lucide-react";
import { UserRoleCode } from "@prisma/client";

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<"general" | "branding" | "roles" | "razorpay" | "integrations" | "audit">("roles");
  const [selectedRoleCode, setSelectedRoleCode] = useState<UserRoleCode>(UserRoleCode.COUNSELOR);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [showKeySecret, setShowKeySecret] = useState(false);

  // Form states for general settings
  const [institutionName, setInstitutionName] = useState("SOFTLAB GLOBAL");
  const [campus, setCampus] = useState("Center for Excellence Prayagraj");
  const [address, setAddress] = useState("Patrika Chauraha, 13/11/8G, Tashkent Marg, Civil Lines, Prayagraj, UP – 211001");
  const [phone, setPhone] = useState("+91 9194085890");
  const [email, setEmail] = useState("info@softlabglobal.com");
  const [gstin, setGstin] = useState("09AFYFS5388G1ZX");

  // Razorpay states
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState("");
  const [razorpayEnv, setRazorpayEnv] = useState<"TEST" | "LIVE">("LIVE");

  // Stripe states
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");
  const [primaryGateway, setPrimaryGateway] = useState<"STRIPE" | "RAZORPAY">("STRIPE");

  const utils = api.useUtils();

  const { data: rolesData, isLoading: rolesLoading } = api.admin.getRoles.useQuery();
  const { data: permissionsCatalog } = api.admin.getAllPermissions.useQuery();
  const { data: systemSettings, isLoading: settingsLoading } = api.admin.getSystemSettings.useQuery();
  const { data: gatewayStatus, refetch: refetchGatewayStatus } = api.payment.getGatewayStatus.useQuery();
  const { data: auditLogsData } = api.admin.getRecentAuditLogs.useQuery({ limit: 30 });

  // Update permissions when selected role changes
  React.useEffect(() => {
    if (rolesData && selectedRoleCode) {
      const targetRole = rolesData.find((r) => r.code === selectedRoleCode);
      if (targetRole) {
        setRolePermissions(targetRole.permissions || []);
      }
    }
  }, [rolesData, selectedRoleCode]);

  // Load system settings into local state
  React.useEffect(() => {
    if (systemSettings) {
      if (systemSettings.general) {
        setInstitutionName(systemSettings.general.institutionName || "SOFTLAB GLOBAL");
        setCampus(systemSettings.general.campus || "Center for Excellence Prayagraj");
        setAddress(systemSettings.general.address || "Patrika Chauraha, 13/11/8G, Tashkent Marg, Civil Lines, Prayagraj, UP – 211001");
        setPhone(systemSettings.general.phone || "+91 9194085890");
        setEmail(systemSettings.general.email || "info@softlabglobal.com");
        setGstin(systemSettings.general.gstin || "09AFYFS5388G1ZX");
      }
      if (systemSettings.razorpay) {
        setRazorpayKeyId(systemSettings.razorpay.keyId || "");
        setRazorpayEnv(systemSettings.razorpay.environment || "LIVE");
      }
    }
  }, [systemSettings]);

  const updateRoleMutation = api.admin.updateRole.useMutation({
    onSuccess: () => {
      setSaveSuccess("Role permissions successfully updated in database!");
      utils.admin.getRoles.invalidate();
      setTimeout(() => setSaveSuccess(null), 4000);
    },
  });

  const updateSettingsMutation = api.admin.updateSystemSetting.useMutation({
    onSuccess: () => {
      setSaveSuccess("System settings successfully saved!");
      utils.admin.getSystemSettings.invalidate();
      setTimeout(() => setSaveSuccess(null), 4000);
    },
  });

  const handleTogglePermission = (permId: string) => {
    if (rolePermissions.includes(permId)) {
      setRolePermissions(rolePermissions.filter((p) => p !== permId));
    } else {
      setRolePermissions([...rolePermissions, permId]);
    }
  };

  const handleToggleCategory = (categoryPermIds: string[]) => {
    const allSelected = categoryPermIds.every((id) => rolePermissions.includes(id));
    if (allSelected) {
      setRolePermissions(rolePermissions.filter((id) => !categoryPermIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...rolePermissions, ...categoryPermIds]));
      setRolePermissions(merged);
    }
  };

  const handleSaveRolePermissions = () => {
    updateRoleMutation.mutate({
      code: selectedRoleCode,
      permissions: rolePermissions,
    });
  };

  const handleSaveGeneral = () => {
    updateSettingsMutation.mutate({
      key: "general",
      category: "GENERAL",
      value: { institutionName, campus, address, phone, email, gstin },
      isSecret: false,
    });
  };

  const handleSaveRazorpay = () => {
    updateSettingsMutation.mutate({
      key: "razorpay",
      category: "RAZORPAY",
      value: {
        keyId: razorpayKeyId,
        keySecret: razorpayKeySecret,
        webhookSecret: razorpayWebhookSecret,
        environment: razorpayEnv,
      },
      isSecret: true,
    });
  };

  const tabs = [
    { id: "roles", label: "Roles & Permissions", icon: <Shield className="h-4 w-4" /> },
    { id: "general", label: "Institution & Campus", icon: <Building className="h-4 w-4" /> },
    { id: "branding", label: "Theme & Palette", icon: <Palette className="h-4 w-4" /> },
    { id: "razorpay", label: "Razorpay & Billing", icon: <CreditCard className="h-4 w-4" /> },
    { id: "integrations", label: "Integrations Overview", icon: <Share2 className="h-4 w-4" /> },
    { id: "audit", label: "Audit & Security Trail", icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === t.id
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* 1. ROLES & PERMISSIONS ENGINE TAB */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardHeader className="p-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    Role-Based Access Control (RBAC) Authority Engine
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Configure granular permissions for every default and custom role. Changes are enforced server-side.
                  </CardDescription>
                </div>

                <Button
                  onClick={handleSaveRolePermissions}
                  disabled={updateRoleMutation.isPending}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="h-4 w-4" />
                  <span>{updateRoleMutation.isPending ? "Saving..." : "Save Role Permissions"}</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Role Selection Bar */}
              <div>
                <Label className="text-xs font-bold text-slate-700 block mb-2">Select Target Role to Configure:</Label>
                <div className="flex flex-wrap gap-2">
                  {rolesData?.map((r) => (
                    <button
                      key={r.code}
                      onClick={() => setSelectedRoleCode(r.code)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        selectedRoleCode === r.code
                          ? "bg-slate-900 text-white ring-2 ring-emerald-500"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      <span>{r.name}</span>
                      <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-black/10">
                        {r.permissions.length} perms
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Role Overview */}
              {rolesData && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-800">Editing Role: </span>
                    <Badge variant="outline" className="font-mono font-bold text-emerald-700 bg-emerald-50">
                      {selectedRoleCode}
                    </Badge>
                    <span className="text-slate-500 ml-2">
                      ({rolePermissions.includes("*") ? "Full Root (*)" : `${rolePermissions.length} Active Permissions`})
                    </span>
                  </div>
                  {selectedRoleCode === UserRoleCode.SUPER_ADMIN && (
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Root access cannot be revoked from Super Admin
                    </span>
                  )}
                </div>
              )}

              {/* Granular Permission Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissionsCatalog?.categories.map((cat) => {
                  const catPermIds = cat.permissions.map((p) => p.id);
                  const selectedCount = catPermIds.filter((id) => rolePermissions.includes(id)).length;
                  const allSelected = selectedCount === catPermIds.length;

                  return (
                    <div key={cat.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                        <div>
                          <p className="font-bold text-xs text-slate-900">{cat.name}</p>
                          <p className="text-[11px] text-slate-500">{cat.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleCategory(catPermIds)}
                          className="text-[10px] font-bold text-emerald-700 hover:underline"
                        >
                          {allSelected ? "Deselect All" : "Select All"}
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {cat.permissions.map((p) => {
                          const isChecked = rolePermissions.includes(p.id) || rolePermissions.includes("*");
                          return (
                            <label
                              key={p.id}
                              className="flex items-start gap-2 p-1.5 rounded-md hover:bg-white cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={selectedRoleCode === UserRoleCode.SUPER_ADMIN}
                                onChange={() => handleTogglePermission(p.id)}
                                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <div className="text-xs">
                                <p className="font-semibold text-slate-800">{p.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{p.id} — {p.description}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. INSTITUTION & CAMPUS PROFILE TAB */}
      {activeTab === "general" && (
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="h-5 w-5 text-emerald-600" />
              Authoritative Campus & Institutional Profile
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Authoritative contact details used on website headers, student portals, and official GST tax receipts.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">Institution Name</Label>
                <Input value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} className="h-9 text-xs mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">Official Campus</Label>
                <Input value={campus} onChange={(e) => setCampus(e.target.value)} className="h-9 text-xs mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Registered Campus Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-9 text-xs mt-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">Official Helpline</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 text-xs mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">Support Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 text-xs mt-1" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">Official GSTIN</Label>
                <Input value={gstin} onChange={(e) => setGstin(e.target.value)} className="h-9 text-xs mt-1 font-mono" />
              </div>
            </div>

            <Button
              onClick={handleSaveGeneral}
              disabled={updateSettingsMutation.isPending}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <Save className="h-4 w-4 mr-1" />
              {updateSettingsMutation.isPending ? "Saving..." : "Save Profile Details"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 3. BRANDING & THEME TAB */}
      {activeTab === "branding" && (
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Palette className="h-5 w-5 text-emerald-600" />
              SoftLab Global Palette & Design System
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Authoritative color palette inspired by the SoftLab logo: light green, light blue, and soft surfaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 space-y-2">
                <div className="h-10 rounded-lg bg-emerald-600" />
                <p className="font-bold text-xs">Primary: SoftLab Emerald</p>
                <p className="font-mono text-[11px] text-emerald-700">#059669 (emerald-600)</p>
                <p className="text-[11px] text-slate-600">Used for primary action CTAs, active states, and success indicators.</p>
              </div>

              <div className="p-4 rounded-xl border border-sky-200 bg-sky-50 text-sky-900 space-y-2">
                <div className="h-10 rounded-lg bg-sky-600" />
                <p className="font-bold text-xs">Accent: Tech Sky Blue</p>
                <p className="font-mono text-[11px] text-sky-700">#0284c7 (sky-600)</p>
                <p className="text-[11px] text-slate-600">Used for technical badges, highlights, links, and analytics charts.</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 space-y-2">
                <div className="h-10 rounded-lg bg-slate-900" />
                <p className="font-bold text-xs">Surface: Slate Soft Surface</p>
                <p className="font-mono text-[11px] text-slate-700">#f8fafc (slate-50)</p>
                <p className="text-[11px] text-slate-600">Replaces bright harsh white with comfortable modern contrast.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. PAYMENT GATEWAY CONFIGURATION TAB */}
      {activeTab === "razorpay" && (
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="p-4 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  Payment Gateways (Stripe & Razorpay)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Configure enterprise payment providers for online course enrollments and tuition fee installments.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`font-mono text-xs ${
                    gatewayStatus?.stripe.configured
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-amber-50 text-amber-700 border-amber-300"
                  }`}
                >
                  Stripe: {gatewayStatus?.stripe.configured ? "CONNECTED" : "NOT CONFIGURED"}
                </Badge>
                <Badge
                  variant="outline"
                  className={`font-mono text-xs ${
                    gatewayStatus?.razorpay.configured
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Razorpay: {gatewayStatus?.razorpay.configured ? "CONNECTED" : "NOT CONFIGURED"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-6 max-w-2xl">
            {/* Primary Provider Selection */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <Label className="text-xs font-bold text-slate-800">Primary Payment Gateway Preference</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="primaryGateway"
                    value="STRIPE"
                    checked={primaryGateway === "STRIPE"}
                    onChange={() => setPrimaryGateway("STRIPE")}
                  />
                  <span>Stripe (Recommended Global Gateway)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="primaryGateway"
                    value="RAZORPAY"
                    checked={primaryGateway === "RAZORPAY"}
                    onChange={() => setPrimaryGateway("RAZORPAY")}
                  />
                  <span>Razorpay (Domestic Gateway)</span>
                </label>
              </div>
            </div>

            {/* STRIPE SECTION */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                Stripe Gateway Credentials
              </h4>
              <p className="text-[11px] text-slate-500">
                Webhook URL: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">https://www.softlabglobal.com/api/webhooks/stripe</code>
              </p>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Stripe Publishable Key</Label>
                <Input
                  placeholder="pk_live_xxxxxxxxxxxxxxxx"
                  value={stripePublishableKey}
                  onChange={(e) => setStripePublishableKey(e.target.value)}
                  className="h-9 text-xs font-mono mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Stripe Secret Key</Label>
                <Input
                  type="password"
                  placeholder="sk_live_xxxxxxxxxxxxxxxx"
                  value={stripeSecretKey}
                  onChange={(e) => setStripeSecretKey(e.target.value)}
                  className="h-9 text-xs font-mono mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Stripe Webhook Signing Secret</Label>
                <Input
                  type="password"
                  placeholder="whsec_xxxxxxxxxxxxxxxx"
                  value={stripeWebhookSecret}
                  onChange={(e) => setStripeWebhookSecret(e.target.value)}
                  className="h-9 text-xs font-mono mt-1"
                />
              </div>

              <Button
                onClick={() =>
                  updateSettingsMutation.mutate({
                    key: "stripe",
                    category: "STRIPE",
                    value: {
                      publishableKey: stripePublishableKey,
                      secretKey: stripeSecretKey,
                      webhookSecret: stripeWebhookSecret,
                      primary: primaryGateway === "STRIPE",
                    },
                    isSecret: true,
                  })
                }
                disabled={updateSettingsMutation.isPending}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                <Save className="h-4 w-4 mr-1" />
                Save Stripe Credentials
              </Button>
            </div>

            {/* RAZORPAY SECTION */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                Razorpay Fallback Credentials
              </h4>
              <p className="text-[11px] text-slate-500">
                Webhook URL: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">https://www.softlabglobal.com/api/webhooks/razorpay</code>
              </p>

              <div>
                <Label className="text-xs font-bold text-slate-700">Environment Mode</Label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="envMode"
                      value="LIVE"
                      checked={razorpayEnv === "LIVE"}
                      onChange={() => setRazorpayEnv("LIVE")}
                    />
                    <span>Production / Live Mode</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="envMode"
                      value="TEST"
                      checked={razorpayEnv === "TEST"}
                      onChange={() => setRazorpayEnv("TEST")}
                    />
                    <span>Test / Sandbox Mode</span>
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Razorpay Key ID</Label>
                <Input
                  placeholder="rzp_live_xxxxxxxxxxxxxxxx"
                  value={razorpayKeyId}
                  onChange={(e) => setRazorpayKeyId(e.target.value)}
                  className="h-9 text-xs font-mono mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Razorpay Key Secret</Label>
                <div className="relative mt-1">
                  <Input
                    type={showKeySecret ? "text" : "password"}
                    placeholder="Enter Razorpay Secret Key"
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                    className="h-9 text-xs font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeySecret(!showKeySecret)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showKeySecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Razorpay Webhook Secret</Label>
                <Input
                  type="password"
                  placeholder="Enter webhook secret token"
                  value={razorpayWebhookSecret}
                  onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
                  className="h-9 text-xs font-mono mt-1"
                />
              </div>

              <Button
                onClick={handleSaveRazorpay}
                disabled={updateSettingsMutation.isPending}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                <Save className="h-4 w-4 mr-1" />
                Save Razorpay Credentials
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. INTEGRATIONS OVERVIEW TAB */}
      {activeTab === "integrations" && (
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-emerald-600" />
              Connected Marketing & Communication Integrations
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Live status of external advertising webhooks, telephony adapters, and messaging platforms.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs text-slate-900">Meta Ads Webhook (Facebook / Instagram)</p>
                  <Badge variant="success">ACTIVE ENDPOINT</Badge>
                </div>
                <p className="text-[11px] text-slate-500">
                  Ingests leads instantly from Facebook Lead Ads into the Counselor CRM pipeline.
                </p>
                <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[10px] text-slate-700 break-all">
                  POST https://www.softlabglobal.com/api/webhooks/meta
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs text-slate-900">Google Ads Lead Form Ingestion</p>
                  <Badge variant="success">ACTIVE ENDPOINT</Badge>
                </div>
                <p className="text-[11px] text-slate-500">
                  Webhook listener for Google Ads search campaign leads with auto-attribution.
                </p>
                <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[10px] text-slate-700 break-all">
                  POST https://www.softlabglobal.com/api/webhooks/google-ads
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs text-slate-900">Justdial Lead Integration</p>
                  <Badge variant="success">ACTIVE ENDPOINT</Badge>
                </div>
                <p className="text-[11px] text-slate-500">
                  Captures local student enquiries from Justdial directly into the telecaller queue.
                </p>
                <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[10px] text-slate-700 break-all">
                  POST https://www.softlabglobal.com/api/webhooks/justdial
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs text-slate-900">WhatsApp Business API Hub</p>
                  <Badge variant="success">ACTIVE ENDPOINT</Badge>
                </div>
                <p className="text-[11px] text-slate-500">
                  Inbound chat handling, AI course counselor answers, and direct admission routing.
                </p>
                <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[10px] text-slate-700 break-all">
                  POST https://www.softlabglobal.com/api/webhooks/whatsapp
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. AUDIT LOGS TAB */}
      {activeTab === "audit" && (
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Institutional Audit Trail & Security Log
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Immutable log of user authentications, permission updates, admission conversions, and financial operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {auditLogsData?.logs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-slate-500 ml-2">
                      by {log.actor ? `${log.actor.firstName} ${log.actor.lastName} (${log.actor.roleCode})` : "System / Webhook"}
                    </span>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Resource: {log.resourceType} ({log.resourceId})
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
