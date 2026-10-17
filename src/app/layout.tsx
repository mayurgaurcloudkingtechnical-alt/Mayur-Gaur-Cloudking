import type { Metadata } from "next";
import "./globals.css";
import { TRPCReactProvider } from "@/lib/trpc/react";

import { GoogleAnalyticsTracker } from "@/components/common/google-analytics";
import { GA_MEASUREMENT_ID, GOOGLE_ADS_ID, META_PIXEL_ID } from "@/lib/analytics";

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

        {/* Meta Pixel Code (ID: 28379921225020377) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>

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
