"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertBanner } from "@/components/ui/toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, GraduationCap } from "lucide-react";
import { SoftlabLogo } from "@/components/common/softlab-logo";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [loginType, setLoginType] = React.useState<"student" | "staff">("staff");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        identifier: email.trim(),
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error.includes("Too many failed attempts")) {
          setError("Account locked due to excessive failed attempts. Try again in 15 minutes.");
        } else if (res.error.includes("not active")) {
          setError("Your account is not active. Please contact institute administration.");
        } else {
          setError("Invalid credentials or password. Please verify your email / ID.");
        }
        setIsLoading(false);
        return;
      }

      // Successful login - redirect to server-side dispatcher or callbackUrl
      if (callbackUrl && callbackUrl !== "/" && callbackUrl !== "/login") {
        window.location.href = callbackUrl;
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("An unexpected authentication error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl text-white rounded-2xl overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />

      <CardHeader className="space-y-1 text-center pb-3 pt-6">
        <CardTitle className="text-xl font-extrabold text-white">
          Sign In to SoftLab Global
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Access institutional portal with your registered credentials
        </CardDescription>

        {/* Portal Role Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mt-3">
          <button
            type="button"
            onClick={() => { setLoginType("student"); setError(null); }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              loginType === "student"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Student Portal</span>
          </button>
          <button
            type="button"
            onClick={() => { setLoginType("staff"); setError(null); }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              loginType === "staff"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Staff & Admin</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="mb-2">
            <AlertBanner variant="destructive" title="Authentication Failed">
              {error}
            </AlertBanner>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="identifier" className="text-xs font-medium text-slate-300">
              {loginType === "student" ? "Student Enrollment Number (ID)" : "Institutional Email Address"}
            </Label>
            <div className="relative">
              {loginType === "student" ? (
                <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-emerald-500" />
              ) : (
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              )}
              <Input
                id="identifier"
                type="text"
                placeholder={loginType === "student" ? "e.g. SLG-2026-AIML-001" : "name@softlabglobal.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="pl-9 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 text-xs h-10 focus-visible:ring-emerald-500"
                disabled={isLoading}
              />
            </div>
            {loginType === "student" && (
              <p className="text-[11px] text-slate-400">
                Aapka Enrollment Number admission confirmation receipt me diya gaya hai (e.g. <span className="text-emerald-400 font-mono">SLG-2026-AIML-001</span>).
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-medium text-slate-300">Password</Label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pl-9 pr-10 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 text-xs h-10 focus-visible:ring-emerald-500"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 text-xs shadow-lg shadow-emerald-950 transition-all mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" className="p-0 border-white border-t-emerald-600" />
                <span>Verifying Credentials...</span>
              </div>
            ) : (
              "Sign In to Workspace"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 border-t border-slate-800 bg-slate-950/50 p-4 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-1.5 text-slate-300 font-medium">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Institutional RBAC & 256-Bit Encrypted Session</span>
        </div>
        <div>
          <Link href="/" className="text-emerald-400 hover:underline">
            ← Back to Main Website
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Tech Backdrop Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/">
            <SoftlabLogo size="xl" showTagline={true} className="justify-center" variant="light" />
          </Link>
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Learning Management System (LMS)</span>
          </div>
        </div>

        <React.Suspense fallback={<LoadingSpinner />}>
          <LoginForm />
        </React.Suspense>

        {/* Address Footer */}
        <p className="mt-8 text-center text-[11px] text-slate-500 leading-relaxed">
          Civil Lines Campus: Patrika Chauraha, 13/11/8G, Tashkent Marg, Prayagraj, UP
          <br />
          Helpline: +91 9196596975 | GSTIN: 09AFYFS5388G1ZX
        </p>
      </div>
    </div>
  );
}
