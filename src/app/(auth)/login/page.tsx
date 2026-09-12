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
import { ShieldCheck, Lock, Mail } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error.includes("Too many failed attempts")) {
          setError("Account locked due to excessive failed attempts. Try again in 15 minutes.");
        } else if (res.error.includes("not active")) {
          setError("Your account is not active. Please contact institute administration.");
        } else {
          setError("Invalid email or password. Please verify your credentials.");
        }
        setIsLoading(false);
        return;
      }

      // Successful login
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError("An unexpected authentication error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-slate-200/80 shadow-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl">Sign in to your portal</CardTitle>
        <CardDescription>
          Enter your institutional credentials to access your workspace
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4">
            <AlertBanner variant="destructive" title="Authentication Failed">
              {error}
            </AlertBanner>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="name@softlabglobal.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="pl-9"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pl-9"
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" className="p-0 border-white border-t-emerald-600" />
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-3 border-t border-slate-100 bg-slate-50/50 p-4 text-center text-xs text-slate-500 rounded-b-xl">
        <div className="flex items-center justify-center gap-1 text-slate-600 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Role-Based Access Control Protected</span>
        </div>
        <div>
          <span>Need account assistance? Call </span>
          <a href="tel:+919194085890" className="font-medium text-emerald-600 hover:underline">
            +91 9194085890
          </a>
          <span> or email </span>
          <a href="mailto:info@softlabglobal.com" className="font-medium text-emerald-600 hover:underline">
            info@softlabglobal.com
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-200/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-2xl shadow-lg shadow-emerald-500/20">
            SL
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            SOFTLAB GLOBAL
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Institutional Management System
          </p>
        </div>

        <React.Suspense fallback={<LoadingSpinner />}>
          <LoginForm />
        </React.Suspense>

        {/* Legal Address Footer */}
        <p className="mt-8 text-center text-[11px] text-slate-400 leading-relaxed">
          Patrika Chauraha, 13/11/8G, Tashkent Marg, Prayagraj, UP 211001
          <br />
          GSTIN: 09AFYFS5388G1ZX | SOFTLAB GLOBAL
        </p>
      </div>
    </div>
  );
}
