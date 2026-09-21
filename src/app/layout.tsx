import type { Metadata } from "next";
import "./globals.css";
import { TRPCReactProvider } from "@/lib/trpc/react";

export const metadata: Metadata = {
  title: "SOFTLAB GLOBAL — IT Education Management Platform",
  description: "Enterprise IT education management, student LMS, faculty portal, admissions CRM, and verification engine.",
  icons: {
    icon: "/images/softlab-logo.png",
    shortcut: "/images/softlab-logo.png",
    apple: "/images/softlab-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-18444757013"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'AW-18444757013');
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50/50 font-sans antialiased text-slate-900">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
