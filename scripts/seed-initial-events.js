const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const initialEvents = [
  {
    title: "Short-Term Skill Development & Vocational Courses",
    slug: "short-term-skill-development-courses",
    programType: "SHORT_TERM_COURSE",
    category: "Skill Development & Vocational",
    summary: "Learn Industry-Ready Skills in Just 30–45 Days! Complete practical training in Programming, Vocational & Advanced IT domains.",
    description: "SoftLab Global's Short-Term Skill Development & Vocational Courses offer focused, high-impact technical training crafted specifically for college students, graduates, and professionals looking to upskill quickly. With hands-on live projects, expert instructor guidance, flexible batches, and verified certificates, you acquire the practical skills demanded by top tech employers in 30 to 45 days.",
    bannerUrl: "/images/events/short-term-courses-banner.jpg",
    posterUrl: "/images/events/short-term-courses-poster.jpg",
    galleryUrls: ["/images/events/short-term-courses-banner.jpg", "/images/events/short-term-courses-poster.jpg"],
    fee: 499900,
    originalFee: 999900,
    duration: "30–45 Days / 1 Month to 45 Days",
    startDate: new Date("2026-11-25T10:00:00+05:30"),
    endDate: new Date("2027-01-10T18:00:00+05:30"),
    startTime: "10:00 AM",
    endTime: "06:00 PM",
    registrationStartDate: new Date("2026-11-01T00:00:00+05:30"),
    registrationEndDate: new Date("2026-11-24T23:59:59+05:30"),
    venue: "SoftLab Global Tech Center, 4th Floor, Tata Motors Building, M.G Road, Civil Lines, Prayagraj / Online Hybrid",
    mode: "HYBRID",
    seatCapacity: 120,
    registeredCount: 38,
    eligibility: "Open to 10th/12th pass, college students, BCA/B.Tech/MCA/B.Sc IT, diploma holders, and working professionals.",
    learningOutcomes: [
      "Master core coding paradigms and industry frameworks",
      "Develop and deploy responsive full-stack web and mobile apps",
      "Configure modern cloud infrastructure, networking, and security perimeters",
      "Automate business processes with Python, AI, and Office 365 suites",
      "Build a portfolio of verified mini projects to showcase on resume and GitHub"
    ],
    syllabus: [
      {
        track: "Programming & Software Development",
        topics: ["Python Programming", "Java Programming", "MERN Stack Development", "Python Full Stack Development", "Java Full Stack Development"]
      },
      {
        track: "Vocational & Professional Computer Courses",
        topics: ["Computer Fundamentals & IT Skills", "Website Designing", "Graphic Designing", "Digital Marketing", "Microsoft 365 Administration", "Google Workspace Administration"]
      },
      {
        track: "Advanced IT & Technical Skills",
        topics: ["Networking & CCNA", "Cloud Computing (AWS/Azure)", "Cloud & DevOps", "Cyber Security", "Artificial Intelligence & Machine Learning", "Data Science"]
      }
    ],
    benefits: [
      "Hands-on Practical Training with 100% Lab Access",
      "Mentorship from Industry-Expert Trainers",
      "Official Course Completion Certificate with QR Verification",
      "Placement Assistance & Resume Building Sessions",
      "Career Growth Support & Mock Interview Preparation"
    ],
    trainerName: "Mayur Gaur & Senior Tech Architects",
    trainerBio: "Led by Mayur Gaur and industry practitioners with over a decade of experience across Cloud, Full Stack, and Security architectures.",
    trainerImage: "/images/softlab-logo.png",
    certificateTitle: "Short-Term Vocational Course Completion Certificate",
    certificateType: "COMPLETION",
    faqs: [
      {
        q: "What is the duration of these short-term courses?",
        a: "The duration ranges from 30 to 45 days (approx. 1 to 1.5 months) depending on the selected technical track."
      },
      {
        q: "Are classes available online or offline?",
        a: "Both modes are fully supported. You can attend in-person at our Prayagraj campus or join interactive live online classes with full lab access."
      },
      {
        q: "Will I get a verified certificate?",
        a: "Yes! Every participant who completes the course and practical assessments receives a QR-verifiable SoftLab Global Certificate valid for academic and employment requirements."
      },
      {
        q: "Can I pay in installments?",
        a: "Yes, our Admissions Desk can configure flexible installment terms based on student eligibility."
      }
    ],
    status: "REGISTRATION_OPEN",
    isFeatured: true,
    sortOrder: 1,
    year: 2026,
    month: 11,
    metaTitle: "Short-Term Tech & Vocational Courses (₹4,999) | SoftLab Global",
    metaDescription: "Learn Industry-Ready skills in 30-45 Days with Python, Java, MERN, Cloud, DevOps, Cyber Security & AI at SoftLab Global Prayagraj."
  },
  {
    title: "One-Day AI & Cyber Security Workshop",
    slug: "one-day-ai-cyber-security-workshop",
    programType: "WORKSHOP",
    category: "Artificial Intelligence & Cyber Security",
    summary: "Exclusive Hands-on One-Day Workshop: Explore the Future of Artificial Intelligence & Cyber Security.",
    description: "An intensive, immersive one-day workshop exploring the cutting edge of Artificial Intelligence and modern Cybersecurity defensive architectures. Students and professionals gain actionable hands-on exposure to prompt engineering, neural workflows, vulnerability scanning, security audits, and live penetration defense simulations.",
    bannerUrl: "/images/events/ai-cyber-security-workshop-banner.jpg",
    posterUrl: "/images/events/ai-cyber-security-workshop-poster.jpg",
    galleryUrls: ["/images/events/ai-cyber-security-workshop-banner.jpg", "/images/events/ai-cyber-security-workshop-poster.jpg"],
    fee: 79900,
    originalFee: 199900,
    duration: "One Day (6 Hours)",
    startDate: new Date("2026-12-13T09:30:00+05:30"),
    endDate: new Date("2026-12-13T17:30:00+05:30"),
    startTime: "09:30 AM",
    endTime: "05:30 PM",
    registrationStartDate: new Date("2026-11-10T00:00:00+05:30"),
    registrationEndDate: new Date("2026-12-12T23:59:59+05:30"),
    venue: "SoftLab Global Tech Center Auditorium, Civil Lines, Prayagraj / Live Hybrid Broadcast",
    mode: "HYBRID",
    seatCapacity: 150,
    registeredCount: 0,
    eligibility: "Open to students of all engineering, BCA, MCA, B.Sc streams, IT enthusiasts, and early-career software professionals.",
    learningOutcomes: [
      "Understand the mechanics of Large Language Models and AI automation",
      "Identify common attack vectors, phishing protocols, and security vulnerabilities",
      "Participate in live demonstrations of penetration testing and firewall analysis",
      "Build a simple AI-assisted automation pipeline",
      "Gain clarity on high-paying career roadmaps in AI and Cybersecurity"
    ],
    syllabus: [
      {
        track: "Morning Session: Artificial Intelligence",
        topics: ["Introduction to AI, Machine Learning, and Generative AI", "Building with AI APIs and Prompt Architecture", "Real-World AI Use Cases in Enterprise"]
      },
      {
        track: "Afternoon Session: Cyber Security & Live Labs",
        topics: ["Fundamentals of Ethical Hacking & Defensive Security", "Live Threat Exploitation and Defense Demonstration", "Hands-on Practical Labs and Security Audits"]
      },
      {
        track: "Valedictory & Career Guidance",
        topics: ["Career Opportunities & Certifications (CEH, CISSP, AWS AI)", "Q&A with Industry Experts", "Certificate Distribution"]
      }
    ],
    benefits: [
      "Learn directly from Industry Cyber Security & AI Specialists",
      "Hands-on Practical Exposure in Sandbox Environments",
      "Understand Real-World Enterprise Applications",
      "Official Workshop Participation Certificate for all attendees",
      "Networking Opportunity with Peers & Industry Mentors"
    ],
    trainerName: "Lead Cyber Security Researcher & AI Architect",
    trainerBio: "Certified Ethical Hacker and AI Practitioner with experience advising critical cloud security operations.",
    trainerImage: "/images/softlab-logo.png",
    certificateTitle: "Workshop Participation Certificate in AI & Cyber Security",
    certificateType: "PARTICIPATION",
    faqs: [
      {
        q: "Do I need prior coding knowledge to attend this workshop?",
        a: "No prior advanced programming is required. The workshop is designed to take you from foundational concepts to live demonstrations."
      },
      {
        q: "Will I receive a certificate?",
        a: "Yes, all verified attendees receive an official SoftLab Global Workshop Participation Certificate."
      },
      {
        q: "Why is this workshop currently in Draft status?",
        a: "Per institutional administrative policy, the workshop schedule and final fee (₹799) are subject to final Admin confirmation before public seat booking opens."
      }
    ],
    status: "DRAFT", // Intentionally DRAFT as instructed by Phase 2
    isFeatured: true,
    sortOrder: 2,
    year: 2026,
    month: 12,
    metaTitle: "One-Day AI & Cyber Security Workshop | SoftLab Global",
    metaDescription: "Hands-on One-Day Workshop on AI and Cyber Security at SoftLab Global Prayagraj. Get live lab exposure and official participation certificate."
  },
  {
    title: "Winter Internship Program 2026",
    slug: "winter-internship-program-2026",
    programType: "WINTER_INTERNSHIP",
    category: "Technical Internship",
    summary: "Gain Real Industry Experience This Winter! A Practical & Industry-Oriented Learning Program for Students & Fresh Graduates.",
    description: "The SoftLab Global Winter Internship Program is an immersive, 1-month hands-on apprenticeship designed to bridge the gap between academic theory and real-world software engineering. Interns work on live codebases, collaborate via GitHub pull requests, participate in sprint planning, and deploy production modules under senior tech leads.",
    bannerUrl: "/images/events/winter-internship-banner.jpg",
    posterUrl: "/images/events/winter-internship-poster.jpg",
    galleryUrls: ["/images/events/winter-internship-banner.jpg", "/images/events/winter-internship-poster.jpg"],
    fee: 99900,
    originalFee: 299900,
    duration: "1 Month (Intensive)",
    startDate: new Date("2026-12-15T10:00:00+05:30"),
    endDate: new Date("2027-01-15T18:00:00+05:30"),
    startTime: "10:00 AM",
    endTime: "05:00 PM",
    registrationStartDate: new Date("2026-11-01T00:00:00+05:30"),
    registrationEndDate: new Date("2026-12-14T23:59:59+05:30"),
    venue: "SoftLab Global Tech Center & Corporate Labs, Civil Lines, Prayagraj / Remote Mode",
    mode: "HYBRID",
    seatCapacity: 100,
    registeredCount: 24,
    eligibility: "B.Tech/BE (CS, IT, EC, EE, ME, Civil), BCA, MCA, B.Sc Computer Science, Polytechnic/Diploma students seeking academic winter training.",
    learningOutcomes: [
      "Build production-grade modules using modern frameworks and Git workflows",
      "Collaborate in Agile teams with daily standups and code reviews",
      "Implement RESTful APIs and integrate cloud databases",
      "Deploy live applications to production cloud hosting with SSL and domain routing",
      "Receive comprehensive project documentation suitable for academic submission"
    ],
    syllabus: [
      {
        track: "Week 1: Core Technologies & Architecture",
        topics: ["System Design Fundamentals", "Modern Development Environments", "Git & GitHub Enterprise Workflows"]
      },
      {
        track: "Week 2: Backend, Database & API Design",
        topics: ["Data Modeling with SQL/NoSQL", "RESTful API Endpoints & Authentication", "Unit Testing & Postman"]
      },
      {
        track: "Week 3: Frontend Integration & State Management",
        topics: ["Modern UI Components & Tailwind CSS", "State Management & React Query", "Performance Optimization"]
      },
      {
        track: "Week 4: Capstone Deployment & Project Evaluation",
        topics: ["Cloud Deployment (VPS / Cloud native)", "Project Review with Industry Mentors", "Certificate & LOR Issuance"]
      }
    ],
    benefits: [
      "Hands-on Industry-Oriented Training on Live Projects",
      "Direct Guidance from Senior Software Engineers & Tech Leads",
      "Official Verified Internship Completion Certificate with QR Code",
      "Detailed Project Completion Report for College/University Submission",
      "Letter of Recommendation (LOR) for Outstanding Interns",
      "Pre-Placement Interview (PPI) Opportunities for Final-Year Students"
    ],
    trainerName: "Senior Engineering Staff & Project Mentors",
    trainerBio: "SoftLab Global Engineering Division mentors specializing in full-stack, distributed computing, and cybersecurity.",
    trainerImage: "/images/softlab-logo.png",
    certificateTitle: "Winter Internship Completion Certificate",
    certificateType: "INTERNSHIP",
    faqs: [
      {
        q: "Is this certificate accepted by universities for academic credit?",
        a: "Yes! Our internship certificate includes project title, duration, verification QR code, and formal seal, fulfilling all university AICTE/UGC winter training requirements."
      },
      {
        q: "Can I do the internship in online mode?",
        a: "Yes, we support both in-office at our Prayagraj facility and remote online internship cohorts with daily sync meetings."
      },
      {
        q: "What is the fee for the Winter Internship?",
        a: "The subsidized program fee is ₹999 for the complete 1-month program including all mentoring, project review, and verified certification."
      }
    ],
    status: "REGISTRATION_OPEN",
    isFeatured: true,
    sortOrder: 3,
    year: 2026,
    month: 12,
    metaTitle: "Winter Internship Program 2026 (₹999) | SoftLab Global",
    metaDescription: "1-Month Practical Winter Internship on live projects for B.Tech, BCA, MCA students at SoftLab Global Prayagraj. Get verified certificate & LOR."
  },
  {
    title: "Summer Internship Program 2027",
    slug: "summer-internship-program",
    programType: "SUMMER_INTERNSHIP",
    category: "Technical Internship",
    summary: "Make Your Summer Productive & Career-Ready! 2-Month Practical & Industry-Oriented Program for Students & Fresh Graduates.",
    description: "The SoftLab Global Summer Internship Program is a comprehensive 2-month professional training and project immersion program designed for aspiring software engineers. Interns tackle end-to-end full lifecycle software projects from requirements specification to cloud deployment, mentored by enterprise software architects.",
    bannerUrl: "/images/events/summer-internship-banner.jpg",
    posterUrl: "/images/events/summer-internship-poster-2499.jpg",
    galleryUrls: ["/images/events/summer-internship-banner.jpg", "/images/events/summer-internship-poster-2499.jpg", "/images/events/summer-internship-poster-999.jpg"],
    fee: 249900,
    originalFee: 599900,
    duration: "2 Months",
    startDate: new Date("2027-06-01T10:00:00+05:30"),
    endDate: new Date("2027-07-31T18:00:00+05:30"),
    startTime: "10:00 AM",
    endTime: "05:00 PM",
    registrationStartDate: new Date("2027-01-01T00:00:00+05:30"),
    registrationEndDate: new Date("2027-05-30T23:59:59+05:30"),
    venue: "SoftLab Global Tech Center, Civil Lines, Prayagraj / Online Hybrid",
    mode: "HYBRID",
    seatCapacity: 150,
    registeredCount: 0,
    eligibility: "Pre-final and final-year engineering students (B.Tech, BCA, MCA, M.Tech, B.Sc IT) and fresh graduates looking for production experience.",
    learningOutcomes: [
      "Master production-grade full-stack architectures and microservices",
      "Deploy scalable applications using Docker, CI/CD pipelines, and cloud infra",
      "Write clean, maintainable, production-ready code with test suites",
      "Gain real experience in corporate teamwork, code reviews, and project demos",
      "Create high-impact capstone projects that stand out to technical hiring managers"
    ],
    syllabus: [
      {
        track: "Month 1: Advanced Tech Deep-Dive & Architecture",
        topics: ["Architecture Patterns & Scalability", "Enterprise Database Modeling & Caching", "API Design & Microservice Communication", "Modern Frontend Frameworks"]
      },
      {
        track: "Month 2: Live Enterprise Project Sprints & Deployment",
        topics: ["Sprint Planning & Task Breakdown", "Feature Implementation & PR Reviews", "DevOps, Containerization & CI/CD", "Final Project Presentation & Code Review"]
      }
    ],
    benefits: [
      "Hands-on Technical Training on Real-World Enterprise Projects",
      "Industry Exposure & Direct Interaction with Tech Leaders",
      "Official 2-Month Internship Completion Certificate with QR Verification",
      "Comprehensive Project Synopsis and Documentation for University Submissions",
      "Professional Profile & Resume Development",
      "Job Placement Assistance & Corporate Partner Referrals"
    ],
    trainerName: "Senior Engineering Staff & Technical Architects",
    trainerBio: "Practicing software engineers, DevOps leads, and system architects at SoftLab Global.",
    trainerImage: "/images/softlab-logo.png",
    certificateTitle: "Summer Internship Completion Certificate",
    certificateType: "INTERNSHIP",
    faqs: [
      {
        q: "What is the duration of the Summer Internship?",
        a: "The standard summer internship runs for 2 months (8 weeks) covering comprehensive training and capstone project development."
      },
      {
        q: "Is prior coding experience required?",
        a: "Basic programming understanding in any language (C, C++, Java, or Python) is helpful. Foundations are refreshed in Week 1."
      },
      {
        q: "What is the fee for the 2-Month Summer Internship?",
        a: "The approved program fee is ₹2,499 for the 2-month program. (We also offer a 1-month variant at ₹999 as shown in the program options)."
      }
    ],
    status: "UPCOMING",
    isFeatured: true,
    sortOrder: 4,
    year: 2027,
    month: 6,
    metaTitle: "Summer Internship Program 2027 (₹2,499) | SoftLab Global",
    metaDescription: "2-Month Practical & Industry-Oriented Summer Internship on live projects for Engineering and IT students at SoftLab Global Prayagraj."
  }
];

async function main() {
  console.log('Seeding initial 4 programs...');
  for (const evt of initialEvents) {
    const existing = await prisma.event.findUnique({
      where: { slug: evt.slug }
    });

    if (existing) {
      console.log(`Updating existing event: ${evt.slug}`);
      await prisma.event.update({
        where: { slug: evt.slug },
        data: evt
      });
    } else {
      console.log(`Creating event: ${evt.slug}`);
      await prisma.event.create({
        data: evt
      });
    }
  }
  console.log('Initial events seeded successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());