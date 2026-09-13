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
import { Lock, GraduationCap, ArrowRight, Building2 } from "lucide-react";
import { SoftlabLogo } from "@/components/common/softlab-logo";
import Link from "next/link";

function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [enrollmentNo, setEnrollmentNo] = React.useState("");
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
        identifier: enrollmentNo.trim(),
        email: enrollmentNo.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error.includes("Too many failed attempts")) {
          setError("Account locked due to excessive attempts. Please wait 15 minutes.");
        } else if (res.error.includes("not active")) {
          setError("Your student enrollment is not active. Contact institute office.");
        } else {
          setError("Invalid Enrollment Number or Password. Please check your admission slip.");
        }
        setIsLoading(false);
        return;
      }

      // Successful student login - direct to student dashboard with hard navigation
      window.location.href = "/student/dashboard";
    } catch (err) {
      setError("An unexpected authentication error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl text-white rounded-2xl overflow-hidden border-2 border-emerald-500/20">
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />

      <CardHeader className="space-y-1 text-center pb-3 pt-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 mb-2">
          <GraduationCap className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-black tracking-tight text-white">
          Student Portal Login
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Enter your unique Enrollment Number to access your classes, syllabus & fees
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <AlertBanner variant="destructive" title="Login Failed">
            {error}
          </AlertBanner>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Enrollment Number Input - Strictly type="text" so NO @ browser error! */}
          <div className="space-y-1.5">
            <Label htmlFor="enrollmentNo" className="text-xs font-semibold text-slate-200">
              Student Enrollment Number
            </Label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-emerald-400" />
              <Input
                id="enrollmentNo"
                type="text"
                inputMode="text"
                placeholder="e.g. SLG-2026-AIML-001"
                value={enrollmentNo}
                onChange={(e) => setEnrollmentNo(e.target.value)}
                required
                autoComplete="off"
                className="pl-9 bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 text-sm h-11 focus-visible:ring-emerald-500 font-mono tracking-wide"
                disabled={isLoading}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Aapka Enrollment Number admission receipt par diya gaya hai (jaise <span className="text-emerald-400 font-mono font-bold">SLG-2026-AIML-001</span>). Email ki zaroorat nahi hai.
            </p>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-200">
                Password
              </Label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pl-9 pr-10 bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 text-sm h-11 focus-visible:ring-emerald-500"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 text-sm shadow-lg shadow-emerald-900/30 transition-all"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" className="border-white border-t-emerald-600" />
                <span>Opening Student Portal...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>Sign In to Student Portal</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-3 border-t border-slate-800 bg-slate-950/60 p-4 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-1.5 text-slate-300">
          <Building2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Are you Faculty or Administrator?</span>
          <Link href="/login" className="text-emerald-400 font-bold hover:underline ml-1">
            SoftLab Staff Login &rarr;
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function StudentLoginPage() {
  return (
    <div className="flex min-h-[90vh] flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block">
            <SoftlabLogo size="lg" />
          </Link>
        </div>

        <React.Suspense fallback={<LoadingSpinner />}>
          <StudentLoginForm />
        </React.Suspense>

        <p className="mt-8 text-center text-[11px] text-slate-500 leading-relaxed">
          Civil Lines Campus: Patrika Chauraha, 13/11/8G, Tashkent Marg, Prayagraj, UP
          <br />
          Student Desk Helpline: +91 9196596975 | Email: info@softlabglobal.com
        </p>
      </div>
    </div>
  );
}
