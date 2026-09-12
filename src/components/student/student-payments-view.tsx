"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, CheckCircle2, AlertCircle, Clock, CreditCard } from "lucide-react";
import { StudentReceiptModal } from "./student-receipt-modal";

export function StudentPaymentsView() {
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const { data: payments, isLoading } = api.payment.getMyPayments.useQuery();

  const formatPaise = (paise: number) => {
    return (paise / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1 border-0">
            <CheckCircle2 className="h-3 w-3" />
            <span>Success</span>
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1 border-0">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 gap-1 border-0">
            <AlertCircle className="h-3 w-3" />
            <span>Failed</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Loading payment history...
        </CardContent>
      </Card>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground space-y-2">
          <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="font-medium text-foreground">No payments recorded yet</p>
          <p className="text-xs">Once you make a payment online or offline, it will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Payment Transactions</CardTitle>
          <CardDescription className="text-xs">
            Complete record of online gateway and authorized offline payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground border-y font-medium">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Transaction Ref</th>
                  <th className="py-2.5 px-4">Course</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((tx: any) => {
                  const courseTitle =
                    tx.feeStructure?.course?.title ||
                    tx.enrollment?.course?.title ||
                    tx.admission?.course?.title ||
                    "Course";

                  return (
                    <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                        {new Date(tx.paidAt || tx.paymentDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-foreground">
                        {tx.transactionReference}
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground max-w-[200px] truncate">
                        {courseTitle}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] bg-muted/50 px-2 py-0.5 rounded border">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                        {formatPaise(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(tx.status)}</td>
                      <td className="py-3 px-4 text-right">
                        {tx.status === "SUCCESS" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedReceipt(tx.receiptNumber || tx.id)}
                            className="h-7 text-xs gap-1 text-primary hover:text-primary"
                          >
                            <Receipt className="h-3 w-3" />
                            <span>Receipt</span>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <StudentReceiptModal
        receiptIdentifier={selectedReceipt}
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
      />
    </>
  );
}
