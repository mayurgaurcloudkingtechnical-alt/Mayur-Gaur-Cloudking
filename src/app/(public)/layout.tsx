import * as React from "react";
import { auth } from "@/server/auth";
import { PublicNavbar } from "@/components/public/public-navbar";
import { PublicFooter } from "@/components/public/public-footer";
import { SITE_CONFIG } from "@/lib/constants/site";

import { TopAnnouncementBar } from "@/components/public/top-announcement-bar";
import { FloatingWhatsApp } from "@/components/public/floating-whatsapp";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Structured Data (JSON-LD) for EducationalOrganization
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.shortDescription,
    url: SITE_CONFIG.domain,
    telephone: SITE_CONFIG.contact.phone,
    email: SITE_CONFIG.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${SITE_CONFIG.address.line1}, ${SITE_CONFIG.address.line2}`,
      addressLocality: SITE_CONFIG.address.city,
      addressRegion: SITE_CONFIG.address.state,
      postalCode: SITE_CONFIG.address.pincode,
      addressCountry: "IN",
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <TopAnnouncementBar />
      <PublicNavbar userRole={session?.user?.roleCode ?? null} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <FloatingWhatsApp />
    </div>
  );
}
