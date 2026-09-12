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
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border shadow-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertCircle className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Payment Incomplete
          </CardTitle>
          <CardDescription className="text-sm">
            Payment could not be completed or signature verification failed.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          <div className="rounded-lg bg-rose-50/50 p-4 border border-rose-200/50 text-rose-900 text-xs">
            <p className="font-semibold mb-1">Status Note:</p>
            <p className="text-rose-800/90 capitalize">{reason.replace(/_/g, " ")}</p>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            No course enrollment has been created. If funds were debited from your account, they will be automatically refunded by your bank within 5–7 business days.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-2">
          <Button onClick={() => window.history.back()} className="w-full gap-2 font-medium">
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>

          <Link href="/contact" className="w-full">
            <Button variant="outline" className="w-full gap-2 text-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Contact Admissions Support</span>
            </Button>
          </Link>

          <Link href="/" className="w-full">
            <Button variant="ghost" size="sm" className="w-full gap-2 text-xs text-muted-foreground">
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
