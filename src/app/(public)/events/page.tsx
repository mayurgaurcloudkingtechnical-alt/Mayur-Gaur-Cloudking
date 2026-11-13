import { Metadata } from "next";
import { db } from "@/server/db/client";
import { EventsHubView } from "@/components/public/events/events-hub-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events, Workshops & Short-Term Programs | SoftLab Global",
  description:
    "Explore upcoming tech workshops, 30–45 days short-term vocational courses, and winter/summer technical internships with hands-on projects and verified certification at SoftLab Global Prayagraj.",
  keywords: [
    "SoftLab Global Events",
    "Short-term computer courses Prayagraj",
    "AI and Cyber Security workshop",
    "Winter internship 2026",
    "Summer internship 2027",
    "IT certification courses",
    "Hands-on coding Prayagraj",
  ],
  openGraph: {
    title: "Events, Workshops & Short-Term Programs | SoftLab Global",
    description:
      "Join SoftLab Global's short-term vocational courses (₹4,999), AI & Cyber Security workshops, and technical internships with verified certificates and live projects.",
    url: "https://www.softlabglobal.com/events",
    siteName: "SoftLab Global",
    images: [
      {
        url: "/images/events/short-term-courses-banner.jpg",
        width: 1200,
        height: 630,
        alt: "SoftLab Global Programs & Events",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  alternates: {
    canonical: "https://www.softlabglobal.com/events",
  },
};

export default async function PublicEventsPage() {
  const [events, yearRecords] = await Promise.all([
    db.event.findMany({
      where: {
        deletedAt: null,
        status: {
          in: ["UPCOMING", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "ONGOING", "COMPLETED"],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
    }),
    db.event.findMany({
      where: { deletedAt: null },
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    }),
  ]);

  const archiveYears = yearRecords.map((y) => y.year);

  const serializedEvents = events.map((e) => ({
    ...e,
    startDate: e.startDate ? e.startDate.toISOString() : null,
    endDate: e.endDate ? e.endDate.toISOString() : null,
    registrationStartDate: e.registrationStartDate ? e.registrationStartDate.toISOString() : null,
    registrationEndDate: e.registrationEndDate ? e.registrationEndDate.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    deletedAt: e.deletedAt ? e.deletedAt.toISOString() : null,
  }));

  return (
    <EventsHubView
      initialEvents={serializedEvents as any}
      archiveYears={archiveYears}
    />
  );
}
