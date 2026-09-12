import type { Metadata } from "next";
import "./globals.css";
import { TRPCReactProvider } from "@/lib/trpc/react";

export const metadata: Metadata = {
  title: "SOFTLAB GLOBAL — IT Education Management Platform",
  description: "Enterprise IT education management, student LMS, faculty portal, admissions CRM, and verification engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50/50 font-sans antialiased text-slate-900">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
