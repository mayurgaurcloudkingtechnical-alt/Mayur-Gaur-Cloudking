"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RotateCcw, MessageSquare, Home, Loader2 } from "lucide-react";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "Payment was not completed";

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/10 via-transparent to-transparent pointer-events-none" />
      <Card className="max-w-md w-full border border-slate-800 bg-slate-900/95 backdrop-blur shadow-2xl relative z-10">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400">
            <AlertCircle className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Payment Incomplete
          </CardTitle>
          <CardDescription className="text-sm text-slate-300">
            Payment could not be completed or signature verification failed.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          <div className="rounded-lg bg-rose-950/40 p-4 border border-rose-800/50 text-rose-200 text-xs">
            <p className="font-semibold mb-1 text-rose-300">Status Note:</p>
            <p className="text-rose-200 capitalize">{reason.replace(/_/g, " ")}</p>
          </div>

          <p className="text-xs text-slate-400 text-center">
            No course enrollment has been created. If funds were debited from your account, they will be automatically refunded by your bank within 5–7 business days.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-2">
          <Button onClick={() => window.history.back()} className="w-full gap-2 font-medium bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50">
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>

          <Link href="/contact" className="w-full">
            <Button variant="outline" className="w-full gap-2 text-xs border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
              <span>Contact Admissions Support</span>
            </Button>
          </Link>

          <Link href="/" className="w-full">
            <Button variant="ghost" size="sm" className="w-full gap-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50">
              <Home className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}
