import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/server/db/client";
import { EventDetailView } from "@/components/public/events/event-detail-view";

interface EventPageProps {
  params: {
    slug: string;
  };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const event = await db.event.findUnique({
    where: { slug: params.slug },
  });

  if (!event || event.deletedAt) {
    return {
      title: "Event Not Found | SoftLab Global",
    };
  }

  const feeInr = Math.round(event.fee / 100);
  const title = event.metaTitle || `${event.title} (₹${feeInr.toLocaleString("en-IN")}) | SoftLab Global`;
  const description = event.metaDescription || event.summary;
  const imageUrl = event.bannerUrl || event.posterUrl || "/images/events/short-term-courses-banner.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.softlabglobal.com/events/${event.slug}`,
      siteName: "SoftLab Global",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
      locale: "en_IN",
      type: "website",
    },
    alternates: {
      canonical: `https://www.softlabglobal.com/events/${event.slug}`,
    },
  };
}

export default async function EventSlugPage({ params }: EventPageProps) {
  const event = await db.event.findUnique({
    where: { slug: params.slug },
  });

  if (!event || event.deletedAt) {
    notFound();
  }

  const serializedEvent = {
    ...event,
    startDate: event.startDate ? event.startDate.toISOString() : null,
    endDate: event.endDate ? event.endDate.toISOString() : null,
    registrationStartDate: event.registrationStartDate ? event.registrationStartDate.toISOString() : null,
    registrationEndDate: event.registrationEndDate ? event.registrationEndDate.toISOString() : null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    deletedAt: event.deletedAt ? event.deletedAt.toISOString() : null,
  };

  // Structured Data (JSON-LD) for Google Search Event Indexing
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary,
    image: [event.bannerUrl || "https://www.softlabglobal.com/images/events/short-term-courses-banner.jpg"],
    startDate: event.startDate ? event.startDate.toISOString() : undefined,
    endDate: event.endDate ? event.endDate.toISOString() : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode:
      event.mode === "ONLINE"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : event.mode === "HYBRID"
        ? "https://schema.org/MixedEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: "SoftLab Global Tech Center",
      address: {
        "@type": "PostalAddress",
        streetAddress: "4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines",
        addressLocality: "Prayagraj",
        addressRegion: "Uttar Pradesh",
        postalCode: "211011",
        addressCountry: "IN",
      },
    },
    offers: {
      "@type": "Offer",
      url: `https://www.softlabglobal.com/events/${event.slug}`,
      price: (event.fee / 100).toString(),
      priceCurrency: "INR",
      availability:
        event.status === "REGISTRATION_OPEN"
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
      validFrom: event.registrationStartDate ? event.registrationStartDate.toISOString() : undefined,
    },
    organizer: {
      "@type": "Organization",
      name: "SoftLab Global",
      url: "https://www.softlabglobal.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EventDetailView event={serializedEvent as any} />
    </>
  );
}
