"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, BookOpen, Receipt, Home, Loader2, ArrowRight } from "lucide-react";
import { StudentReceiptModal } from "@/components/student/student-receipt-modal";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const receiptParam = searchParams.get("receipt");

  const identifier = orderId || receiptParam || "";
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const { data: status, isLoading } = api.payment.getStatus.useQuery(
    { identifier },
    { enabled: Boolean(identifier) }
  );

  const formatPaise = (paise?: number) => {
    if (!paise) return "₹0";
    return (paise / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying payment status on server...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border shadow-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Payment Successful!
          </CardTitle>
          <CardDescription className="text-sm">
            Your admission fee is verified and your course enrollment is now active.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          <div className="rounded-lg bg-muted/40 p-4 space-y-2 border">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Course</span>
              <span className="font-semibold text-foreground text-right max-w-[200px] truncate">
                {status?.courseTitle || "Full Stack Professional"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-mono font-bold text-foreground">
                {formatPaise(status?.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Receipt Number</span>
              <span className="font-mono text-foreground font-medium">
                {status?.receiptNumber || receiptParam || "Generated"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Enrollment Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            A confirmation receipt has been generated. You can now access all course modules and materials.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-2">
          <Link href="/student/courses" className="w-full">
            <Button className="w-full gap-2 font-medium">
              <BookOpen className="h-4 w-4" />
              <span>Go to My Course</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>

          {(status?.receiptNumber || receiptParam) && (
            <Button
              variant="outline"
              onClick={() => setIsReceiptOpen(true)}
              className="w-full gap-2 text-xs"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>View & Print Receipt</span>
            </Button>
          )}

          <Link href="/" className="w-full">
            <Button variant="ghost" size="sm" className="w-full gap-2 text-xs text-muted-foreground">
              <Home className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </CardFooter>
      </Card>

      <StudentReceiptModal
        receiptIdentifier={status?.receiptNumber || receiptParam || null}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
