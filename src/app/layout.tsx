import type { Metadata } from "next";
import "./globals.css";
import { TRPCReactProvider } from "@/lib/trpc/react";

import { GoogleAnalyticsTracker } from "@/components/common/google-analytics";
import { GA_MEASUREMENT_ID, GOOGLE_ADS_ID } from "@/lib/analytics";

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
        {/* Google tag (gtag.js) — Google Analytics 4 & Google Ads */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              // GA4 Measurement for softlabglobal (Stream ID: 16144183114)
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
                send_page_view: true
              });

              // Google Ads
              gtag('config', '${GOOGLE_ADS_ID}');
            `,
          }}
        />
        {/* Razorpay Standard Web Checkout */}
        <script async src="https://checkout.razorpay.com/v1/checkout.js" />
      </head>
      <body className="min-h-screen bg-slate-50/50 font-sans antialiased text-slate-900">
        <GoogleAnalyticsTracker />
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
