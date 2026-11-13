import { appRouter } from "../src/server/trpc/routers/_app";

async function verifyAllEventEndpoints() {
  console.log("--- 1. Testing Events tRPC Router ---");
  const mockUser = {
    id: "cmwelyeke0000uvn3gdi756wx",
    roleCode: "SUPER_ADMIN",
    email: "mayur.gaur@softlabglobal.com",
    permissions: [],
    firstName: "Mayur",
    lastName: "Gaur"
  };

  const caller = appRouter.createCaller({
    session: {
      user: mockUser,
      expires: new Date(Date.now() + 3600000).toISOString(),
    } as any,
    user: mockUser as any,
    req: null as any,
    res: null as any,
    headers: new Headers(),
  });

  // 1. listPublicEvents
  const publicEvents = await caller.events.listPublicEvents({ timeFilter: "ALL" });
  console.log("✓ listPublicEvents returned:", publicEvents.length, "events");

  // 2. getPublicEventBySlug
  const shortTerm = await caller.events.getPublicEventBySlug({ slug: "short-term-skill-development-courses" });
  console.log("✓ getPublicEventBySlug (short-term) fee:", shortTerm.fee / 100, "INR");

  const winterInternship = await caller.events.getPublicEventBySlug({ slug: "winter-internship-program-2026" });
  console.log("✓ getPublicEventBySlug (winter-internship) fee:", winterInternship.fee / 100, "INR");

  const summerInternship = await caller.events.getPublicEventBySlug({ slug: "summer-internship-program" });
  console.log("✓ getPublicEventBySlug (summer-internship) fee:", summerInternship.fee / 100, "INR");

  // 3. listArchiveYears
  const years = await caller.events.listArchiveYears();
  console.log("✓ listArchiveYears:", years);

  // 4. listAdminEvents (Admin CMS procedure)
  const adminEvents = await caller.events.listAdminEvents();
  console.log("✓ listAdminEvents returned:", adminEvents.length, "events (includes Drafts)");

  // 5. getEventAnalytics (ERP Finance & Analytics procedure)
  const analytics = await caller.events.getEventAnalytics();
  console.log("✓ getEventAnalytics metrics:", analytics);

  // 6. registerForEvent
  const reg = await caller.events.registerForEvent({
    eventId: winterInternship.id,
    fullName: "Aryan Sharma",
    email: "aryan.sharma@example.com",
    phone: "9876543211",
    city: "Prayagraj",
    qualification: "BCA Final Year",
    notes: "Eager to join the Winter Internship batch"
  });
  console.log("✓ registerForEvent success! Reg Number:", reg.registrationNumber, "Amount:", reg.amount / 100, "INR");

  // 7. listRegistrations
  const regs = await caller.events.listRegistrations({ eventId: winterInternship.id });
  console.log("✓ listRegistrations for Winter Internship:", regs.total, "records found");

  console.log("--- ALL EVENT tRPC TESTS PASSED 100% ---");
}

verifyAllEventEndpoints().catch(console.error);