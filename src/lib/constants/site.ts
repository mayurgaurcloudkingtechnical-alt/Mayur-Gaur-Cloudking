export const SITE_CONFIG = {
  name: "SOFTLAB GLOBAL",
  tagline: "Enterprise IT Education & Technology Training",
  shortDescription:
    "Industry-aligned technology education, practical software engineering, cloud computing, and advanced computing career programs in Prayagraj.",
  domain: "https://www.softlabglobal.com",
  canonicalUrl: "https://www.softlabglobal.com",
  address: {
    line1: "Patrika Chauraha, 13/11/8G, Tashkent Marg",
    line2: "Opposite Rai and Company, Civil Lines",
    city: "Prayagraj",
    state: "Uttar Pradesh",
    pincode: "211001",
    country: "India",
    full: "Patrika Chauraha, 13/11/8G, Tashkent Marg, Opposite Rai and Company, Civil Lines, Prayagraj, Uttar Pradesh 211001",
    googleMapsUrl:
      "https://maps.google.com/?q=Patrika+Chauraha+Tashkent+Marg+Civil+Lines+Prayagraj+Uttar+Pradesh+211001",
  },
  contact: {
    phone: "+91 9196596975",
    phoneTel: "+919196596975",
    email: "info@softlabglobal.com",
    admissionsEmail: "info@softlabglobal.com",
  },
  gstin: "09AFYFS5388G1ZX",
  businessHours: {
    days: "Monday – Saturday",
    hours: "9:00 AM – 7:00 PM IST",
    sunday: "Closed (Prior Appointment Only)",
  },
  navLinks: [
    { label: "Home", href: "/" },
    { label: "Courses", href: "/courses" },
    { label: "About Us", href: "/about" },
    { label: "Career Support", href: "/career" },
    { label: "Faculty", href: "/trainers" },
    { label: "Contact", href: "/contact" },
  ],
  trustPillars: [
    {
      title: "Practical Curriculum",
      description:
        "Rigorous hands-on coding, production architectures, and real-world system engineering instead of rote theory.",
    },
    {
      title: "Expert Mentorship",
      description:
        "Learn directly from experienced practitioners with extensive enterprise software and distributed systems background.",
    },
    {
      title: "Small Batch Sizes",
      description:
        "Personalized attention and active faculty code reviews with maximum batch limits for deep comprehension.",
    },
    {
      title: "Career Mentorship",
      description:
        "Comprehensive resume engineering, GitHub portfolio reviews, and rigorous mock technical interview preparation.",
    },
  ],
} as const;
