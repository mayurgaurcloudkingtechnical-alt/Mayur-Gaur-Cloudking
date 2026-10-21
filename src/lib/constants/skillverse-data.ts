/**
 * SLG SKILLVERSE — Powered by SoftLab Global
 * Brand Identity, Configurable Course Catalogue, Academic Packages, Add-Ons,
 * Fee Rules, Public Program Pages, Diagnostic Assessments, and Legal Policies.
 */

export const SKILLVERSE_BRAND = {
  name: "SLG SKILLVERSE",
  parentBrand: "SoftLab Global",
  tagline: "Your World of Future Skills.",
  supportingLine: "From Class 8 to 12 | School Foundation to IIT-JEE and Beyond",
  subdomainUrl: "https://skillverse.softlabglobal.com",
  mainWebsiteUrl: "https://www.softlabglobal.com",
  lmsUrl: "https://lms.softlabglobal.com",
  logoPath: "/images/logo.png",
  colors: {
    navy: "#071630",
    royalBlue: "#0052CC",
    electricBlue: "#0077FF",
    cyanAccent: "#00B4D8",
    limeGreen: "#65A30D",
    deepGreen: "#15803D",
    surfaceWhite: "#FFFFFF",
    surfaceLight: "#F8FAFC",
  },
  defaultContact: {
    address:
      "SoftLab Global — Skillverse Academic Wing, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, Uttar Pradesh - 211011",
    phone: "+91 73808 63063",
    whatsapp: "+91 73808 63063",
    email: "admissions@softlabglobal.com",
    supportHours: "Monday – Saturday: 9:00 AM to 7:00 PM IST",
  },
} as const;

export type SkillverseCategoryCode =
  | "SCHOOL_8_10"
  | "SENIOR_11_12"
  | "IIT_JEE"
  | "NEET_UG"
  | "COMPETITIVE"
  | "TECH_AI_CODING"
  | "COMMUNICATION_CAREER";

export interface SkillverseModuleTopic {
  title: string;
  lessons: string[];
  teachingHours: number;
}

export interface SkillverseCourseItem {
  id: string;
  code: string;
  slug: string;
  title: string;
  category: SkillverseCategoryCode;
  categoryLabel: string;
  eligibleGrades: string[]; // e.g. ["Class 8", "Class 9", "Class 10"]
  applicableBoards: string[]; // ["CBSE", "ICSE / ISC", "UP Board / State Boards"]
  deliveryModes: ("ONLINE" | "OFFLINE" | "HYBRID")[];
  durationLabel: string;
  durationMonths: number;
  teachingHours: number;
  pricingType: "PACKAGE_INCLUDED" | "MONTHLY_ADDON" | "STANDALONE";
  priceInr: number;
  billingCycle: "MONTHLY" | "ONE_TIME";
  gstPercent: number;
  installmentAvailable: boolean;
  batchCapacity: number;
  defaultTimetable: string;
  prerequisites: string;
  shortSummary: string;
  description: string;
  learningOutcomes: string[];
  modules: SkillverseModuleTopic[];
  assessmentPattern: string;
  syllabusRevisionDate: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  officialExamNotice?: string;
}

export interface SkillverseAcademicPackage {
  id: string;
  code: string;
  name: string;
  badge: string;
  eligibleGrades: string;
  gradeList: string[];
  monthlyPriceInr: number;
  twelveMonthUndiscountedTotalInr: number;
  summary: string;
  inclusions: string[];
  subjectsCovered: string[];
  status: "ACTIVE" | "ARCHIVED";
}

export interface SkillverseCompetitiveAddon {
  id: string;
  code: string;
  name: string;
  eligibleGrades: string;
  monthlyAddonPriceInr: number;
  twelveMonthTotalInr: number;
  description: string;
  complianceNote?: string;
  status: "ACTIVE" | "ARCHIVED";
}

export interface SkillverseFeeRuleConfig {
  admissionAndRegistrationFeeInr: number;
  studentIdAndLearningKitFeeInr: number;
  initialAcademicAssessmentFeeInr: number;
  demoClassFeeInr: number;
  gstPercentOnApplicableItems: number;
  additionalMaterialsDisclosure: string;
}

export const INITIAL_SKILLVERSE_FEE_RULES: SkillverseFeeRuleConfig = {
  admissionAndRegistrationFeeInr: 500,
  studentIdAndLearningKitFeeInr: 500,
  initialAcademicAssessmentFeeInr: 0,
  demoClassFeeInr: 0,
  gstPercentOnApplicableItems: 0,
  additionalMaterialsDisclosure:
    "Additional physical robotics/hardware kits, optional printed reference books, and external examination board registration fees (if applicable) are disclosed separately prior to purchase and are never bundled silently.",
};

export const INITIAL_ACADEMIC_PACKAGES: SkillverseAcademicPackage[] = [
  {
    id: "PKG-1-STARTER",
    code: "SLG-SV-PKG-01",
    name: "Package 1 — Skillverse Foundation Starter",
    badge: "Classes 8–10 Core",
    eligibleGrades: "Classes 8–10",
    gradeList: ["Class 8", "Class 9", "Class 10"],
    monthlyPriceInr: 1499,
    twelveMonthUndiscountedTotalInr: 17988,
    summary:
      "Structured school foundation in Mathematics, Science, and English with chapter worksheets, regular doubt-solving, and monthly assessments.",
    inclusions: [
      "Mathematics, Science & English foundation classes",
      "Chapter-wise practice worksheets",
      "Dedicated weekly doubt-solving sessions",
      "Monthly topic & cumulative assessments",
      "Parent progress updates via Parent Portal",
    ],
    subjectsCovered: ["Mathematics", "Science", "English Grammar & Writing"],
    status: "ACTIVE",
  },
  {
    id: "PKG-2-EXCELLENCE",
    code: "SLG-SV-PKG-02",
    name: "Package 2 — Skillverse Academic Excellence",
    badge: "Classes 8–10 Comprehensive",
    eligibleGrades: "Classes 8–10",
    gradeList: ["Class 8", "Class 9", "Class 10"],
    monthlyPriceInr: 2499,
    twelveMonthUndiscountedTotalInr: 29988,
    summary:
      "Complete school subject coverage with logical reasoning, quantitative aptitude, structured revision cycles, practice tests, and detailed progress reviews.",
    inclusions: [
      "All applicable school subjects (Maths, Science, Social Science, English)",
      "Logical reasoning & quantitative aptitude training",
      "Structured board/school exam revision & practice tests",
      "Study skills & answer-writing workshops",
      "Bi-weekly parent-teacher academic progress reviews",
    ],
    subjectsCovered: [
      "Mathematics",
      "Science",
      "Social Science",
      "English Grammar & Writing",
      "Logical Reasoning & Quantitative Aptitude",
    ],
    status: "ACTIVE",
  },
  {
    id: "PKG-3-FUTUREREADY",
    code: "SLG-SV-PKG-03",
    name: "Package 3 — Skillverse FutureReady",
    badge: "Classes 8–10 Academic + Tech",
    eligibleGrades: "Classes 8–10",
    gradeList: ["Class 8", "Class 9", "Class 10"],
    monthlyPriceInr: 3499,
    twelveMonthUndiscountedTotalInr: 41988,
    summary:
      "All Academic Excellence features combined with Digital Productivity, AI Literacy, Introductory Coding, STEM activities, and Spoken Communication skills.",
    inclusions: [
      "Everything in Package 2 — Skillverse Academic Excellence",
      "Digital Productivity & Computer Fundamentals",
      "AI Literacy & Safe/Responsible AI Use",
      "Introductory Coding (Scratch / Python Foundation)",
      "Hands-on STEM activities & Spoken Communication labs",
    ],
    subjectsCovered: [
      "Mathematics, Science, Social Science & English",
      "Logical Reasoning & Aptitude",
      "AI Literacy & Introductory Coding",
      "Digital Productivity & STEM Projects",
      "Spoken English & Communication",
    ],
    status: "ACTIVE",
  },
  {
    id: "PKG-4-SENIOR-ACADEMIC",
    code: "SLG-SV-PKG-04",
    name: "Package 4 — Skillverse Senior Academic",
    badge: "Classes 11–12 Stream Core",
    eligibleGrades: "Classes 11–12",
    gradeList: ["Class 11", "Class 12"],
    monthlyPriceInr: 2999,
    twelveMonthUndiscountedTotalInr: 35988,
    summary:
      "Rigorous stream-specific senior secondary classes (Science, Commerce, or Humanities), board-pattern assignments, revision modules, and doubt-solving.",
    inclusions: [
      "Stream-specific academic classes (Science PCM/PCB, Commerce, or Humanities)",
      "NCERT & Board-aligned chapter assignments and numerical practice",
      "Structured board-exam revision & full-length mock tests",
      "Dedicated faculty doubt-clearing sessions",
      "Detailed performance tracking & parent reporting",
    ],
    subjectsCovered: [
      "Science: Physics, Chemistry, Mathematics / Biology",
      "Commerce: Accountancy, Business Studies, Economics",
      "Humanities: Offered curriculum subjects",
      "English & Communication",
    ],
    status: "ACTIVE",
  },
  {
    id: "PKG-5-SENIOR-FUTUREREADY",
    code: "SLG-SV-PKG-05",
    name: "Package 5 — Skillverse Senior FutureReady",
    badge: "Classes 11–12 Academic + Career Tech",
    eligibleGrades: "Classes 11–12",
    gradeList: ["Class 11", "Class 12"],
    monthlyPriceInr: 3999,
    twelveMonthUndiscountedTotalInr: 47988,
    summary:
      "Senior Academic mastery paired with modern Digital Skills, AI Literacy, Career Preparation, Interview Basics, and guided Capstone Project work.",
    inclusions: [
      "Everything in Package 4 — Skillverse Senior Academic",
      "AI Literacy, Prompt Engineering & Data/Digital Productivity",
      "Python / Web / Data Analytics skill track selection",
      "Communication, Public Speaking & Interview Basics",
      "Guided portfolio & career roadmap mentoring",
    ],
    subjectsCovered: [
      "Stream Core Subjects (Science / Commerce / Humanities)",
      "AI Literacy & Digital Productivity",
      "Coding / Data Analytics Track",
      "Career Preparation & Communication",
    ],
    status: "ACTIVE",
  },
];

export const INITIAL_COMPETITIVE_ADDONS: SkillverseCompetitiveAddon[] = [
  {
    id: "ADDON-JEE-FOUNDATION-8-10",
    code: "SLG-SV-ADD-01",
    name: "IIT-JEE Main Foundation (Classes 8–10)",
    eligibleGrades: "Classes 8–10",
    monthlyAddonPriceInr: 1500,
    twelveMonthTotalInr: 18000,
    description:
      "Early engineering-entrance foundation focusing on conceptual Physics, Chemistry, Mathematics, analytical reasoning, and multi-concept problem solving.",
    complianceNote:
      "Early foundation program for Classes 8–10; distinct from senior secondary full JEE Main/Advanced entrance preparation.",
    status: "ACTIVE",
  },
  {
    id: "ADDON-JEE-MAIN-11-12",
    code: "SLG-SV-ADD-02",
    name: "JEE Main Preparation (Classes 11–12)",
    eligibleGrades: "Classes 11–12",
    monthlyAddonPriceInr: 3000,
    twelveMonthTotalInr: 36000,
    description:
      "Complete JEE Main Physics, Chemistry, and Mathematics syllabus coverage with chapter-wise CBT mock tests, authorized PYQ practice, and error analysis.",
    status: "ACTIVE",
  },
  {
    id: "ADDON-JEE-ADVANCED-11-12",
    code: "SLG-SV-ADD-03",
    name: "JEE Advanced Extension (Classes 11–12)",
    eligibleGrades: "Classes 11–12 (Eligible Students)",
    monthlyAddonPriceInr: 2000,
    twelveMonthTotalInr: 24000,
    description:
      "Multi-concept problem solving, comprehension-type questions, matrix-match drills, and advanced analytical modules for eligible JEE Main scholars.",
    status: "ACTIVE",
  },
  {
    id: "ADDON-NEET-FOUNDATION-9-10",
    code: "SLG-SV-ADD-04",
    name: "NEET-UG Foundation (Classes 9–10)",
    eligibleGrades: "Classes 9–10",
    monthlyAddonPriceInr: 1500,
    twelveMonthTotalInr: 18000,
    description:
      "Early pre-medical foundation in Biology, Physics, and Chemistry fundamentals with NCERT-oriented scientific reasoning.",
    status: "ACTIVE",
  },
  {
    id: "ADDON-NEET-PREP-11-12",
    code: "SLG-SV-ADD-05",
    name: "NEET-UG Preparation (Classes 11–12)",
    eligibleGrades: "Classes 11–12",
    monthlyAddonPriceInr: 3000,
    twelveMonthTotalInr: 36000,
    description:
      "Comprehensive NEET-UG Physics, Chemistry, Botany, and Zoology preparation with line-by-line NCERT revision, assertion-reason drills, and OMR/timed mock tests.",
    status: "ACTIVE",
  },
  {
    id: "ADDON-OLYMPIAD",
    code: "SLG-SV-ADD-06",
    name: "Olympiad and Scholarship Foundation",
    eligibleGrades: "Classes 8–12",
    monthlyAddonPriceInr: 800,
    twelveMonthTotalInr: 9600,
    description:
      "Conceptual problem-solving and analytical reasoning preparation for recognized Science, Mathematics, Cyber, and English Olympiads.",
    status: "ACTIVE",
  },
  {
    id: "ADDON-CUET",
    code: "SLG-SV-ADD-07",
    name: "CUET Foundation (Central Universities Entrance)",
    eligibleGrades: "Classes 11–12",
    monthlyAddonPriceInr: 1500,
    twelveMonthTotalInr: 18000,
    description:
      "Domain subject MCQ mastery, Language comprehension, and General Test (Quantitative, Logical Reasoning & Current Affairs) for CUET aspirants.",
    status: "ACTIVE",
  },
  {
    id: "ADDON-NDA",
    code: "SLG-SV-ADD-08",
    name: "NDA Foundation (Mathematics & GAT)",
    eligibleGrades: "Classes 11–12",
    monthlyAddonPriceInr: 1500,
    twelveMonthTotalInr: 18000,
    description:
      "Structured academic preparation in NDA Mathematics, English, General Science, History/Geography, and communication confidence.",
    status: "ACTIVE",
  },
  {
    id: "ADDON-NTSE-APTITUDE",
    code: "SLG-SV-ADD-09",
    name: "NTSE-Style Aptitude and Logical Reasoning",
    eligibleGrades: "Classes 8–10",
    monthlyAddonPriceInr: 800,
    twelveMonthTotalInr: 9600,
    description:
      "Mental Ability Test (MAT) and Scholastic Aptitude Test (SAT) style analytical reasoning, number series, coding-decoding, and visual reasoning.",
    complianceNote:
      "Develops high-order MAT/SAT analytical reasoning skills; does not imply that an inactive external scholarship examination is currently scheduled.",
    status: "ACTIVE",
  },
];

export const INITIAL_SKILLVERSE_COURSES: SkillverseCourseItem[] = [
  // ================= A. SCHOOL FOUNDATION (8-10 & 11-12) =================
  {
    id: "CRS-SCH-8-10",
    code: "SV-ACAD-810",
    slug: "school-foundation-8-10",
    title: "School Foundation Program (Classes 8, 9 & 10)",
    category: "SCHOOL_8_10",
    categoryLabel: "School Foundation (Classes 8–10)",
    eligibleGrades: ["Class 8", "Class 9", "Class 10"],
    applicableBoards: ["CBSE", "ICSE", "UP Board & State Boards"],
    deliveryModes: ["OFFLINE", "ONLINE", "HYBRID"],
    durationLabel: "Academic Session (Monthly Subscription)",
    durationMonths: 12,
    teachingHours: 360,
    pricingType: "PACKAGE_INCLUDED",
    priceInr: 1499,
    billingCycle: "MONTHLY",
    gstPercent: 0,
    installmentAvailable: true,
    batchCapacity: 25,
    defaultTimetable: "Mon–Sat | 4:00 PM – 6:00 PM",
    prerequisites: "Currently enrolled in Class 8, 9, or 10 in any recognized school board.",
    shortSummary:
      "Complete conceptual mastery in Mathematics, Science, English, Social Science, Logical Reasoning, Quantitative Aptitude, and Digital Literacy.",
    description:
      "Designed to eliminate rote memorization and build rock-solid school fundamentals across Classes 8, 9, and 10. Covers NCERT and board curricula thoroughly while developing logical reasoning, study skills, and digital literacy.",
    learningOutcomes: [
      "Master chapter-wise concepts and numericals in Mathematics and Science",
      "Develop strong English grammar, comprehension, and formal writing skills",
      "Build structured answer-writing skills for Social Science and Board Exams",
      "Solve logical reasoning and quantitative aptitude problems with speed and accuracy",
    ],
    modules: [
      {
        title: "Module 1: Mathematics & Quantitative Reasoning",
        teachingHours: 110,
        lessons: [
          "Algebraic Identities, Linear & Quadratic Equations",
          "Geometry, Mensuration, Trigonometry & Coordinate Systems",
          "Number Systems, Commercial Mathematics, Statistics & Probability",
          "Quantitative Aptitude & Mental Speed Drills",
        ],
      },
      {
        title: "Module 2: Integrated Science (Physics, Chemistry & Biology)",
        teachingHours: 110,
        lessons: [
          "Physics: Motion, Force, Work/Energy, Light, Electricity & Magnetism",
          "Chemistry: Matter, Atomic Structure, Chemical Reactions, Acids/Bases & Carbon",
          "Biology: Cell Biology, Life Processes, Control/Coordination, Heredity & Environment",
        ],
      },
      {
        title: "Module 3: English Grammar, Writing & Social Science",
        teachingHours: 90,
        lessons: [
          "Applied Grammar, Reading Comprehension & Analytical Writing",
          "History, Civics, Geography & Economics Concept Maps",
          "Board Examination Answer Structuring & Time Management",
        ],
      },
      {
        title: "Module 4: Logical Reasoning, Olympiad & Digital Foundation",
        teachingHours: 50,
        lessons: [
          "Verbal & Non-Verbal Logical Reasoning",
          "Olympiad & Scholarship Problem Solving",
          "Computer Fundamentals & Safe Digital Literacy",
        ],
      },
    ],
    assessmentPattern: "Weekly topic quizzes + Monthly cumulative tests + Term mock board exams",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-SR-11-12",
    code: "SV-ACAD-1112",
    slug: "senior-secondary-11-12",
    title: "Senior Secondary Foundation (Classes 11 & 12 — Science, Commerce & Humanities)",
    category: "SENIOR_11_12",
    categoryLabel: "Senior Secondary (Classes 11–12)",
    eligibleGrades: ["Class 11", "Class 12"],
    applicableBoards: ["CBSE", "ISC", "UP Board & State Boards"],
    deliveryModes: ["OFFLINE", "ONLINE", "HYBRID"],
    durationLabel: "Academic Session (Monthly Subscription)",
    durationMonths: 12,
    teachingHours: 420,
    pricingType: "PACKAGE_INCLUDED",
    priceInr: 2999,
    billingCycle: "MONTHLY",
    gstPercent: 0,
    installmentAvailable: true,
    batchCapacity: 25,
    defaultTimetable: "Mon–Sat | 3:30 PM – 6:30 PM",
    prerequisites: "Completed Class 10; enrolled in Class 11 or Class 12.",
    shortSummary:
      "Stream-specific academic excellence for Science (PCM/PCB), Commerce, and Humanities with board-exam preparation, mock tests, and doubt-clearing.",
    description:
      "In-depth subject instruction for Class 11 and 12 students across Science, Commerce, and offered Humanities streams. Emphasizes NCERT derivation mastery, numerical application, case-study questions, and board examination readiness.",
    learningOutcomes: [
      "Master Class 11 and 12 core stream subjects with conceptual depth",
      "Practice board-pattern competency, assertion-reason, and case-study questions",
      "Complete structured syllabus revision and full-length mock examinations",
      "Build strong English communication and academic presentation skills",
    ],
    modules: [
      {
        title: "Stream Track A: Science (Physics, Chemistry, Mathematics / Biology)",
        teachingHours: 180,
        lessons: [
          "Physics: Mechanics, Thermodynamics, Electrodynamics, Optics & Modern Physics",
          "Chemistry: Physical, Inorganic & Organic Chemistry with NCERT Reactions",
          "Mathematics: Calculus, Algebra, Vectors, 3D Geometry & Probability",
          "Biology: Plant & Human Physiology, Genetics, Biotechnology & Ecology",
        ],
      },
      {
        title: "Stream Track B: Commerce (Accountancy, Business Studies, Economics)",
        teachingHours: 160,
        lessons: [
          "Financial & Partnership Accountancy, Company Accounts & Cash Flow Analysis",
          "Principles of Management, Business Finance & Marketing",
          "Microeconomics, Macroeconomics & Indian Economic Development",
        ],
      },
      {
        title: "Stream Track C: Humanities & English Core",
        teachingHours: 80,
        lessons: [
          "English Core Reading, Advanced Writing Skills & Literature",
          "Offered Humanities Subjects per Student Curriculum & Board",
          "Board Mock Tests, Past Paper Analysis & Answer Presentation",
        ],
      },
    ],
    assessmentPattern: "Bi-weekly subject tests + Pre-board full-syllabus mock examinations",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },

  // ================= B. IIT-JEE & ENGINEERING FOUNDATION =================
  {
    id: "CRS-JEE-FOUNDATION",
    code: "SV-JEE-FND",
    slug: "iit-jee-foundation",
    title: "IIT-JEE Foundation Program (Classes 8–10)",
    category: "IIT_JEE",
    categoryLabel: "IIT-JEE & Engineering Foundation",
    eligibleGrades: ["Class 8", "Class 9", "Class 10"],
    applicableBoards: ["CBSE", "ICSE", "State Boards"],
    deliveryModes: ["OFFLINE", "ONLINE", "HYBRID"],
    durationLabel: "Monthly Add-On / Foundation Track",
    durationMonths: 12,
    teachingHours: 180,
    pricingType: "MONTHLY_ADDON",
    priceInr: 1500,
    billingCycle: "MONTHLY",
    gstPercent: 0,
    installmentAvailable: true,
    batchCapacity: 25,
    defaultTimetable: "Tue, Thu, Sat | 6:00 PM – 7:30 PM",
    prerequisites: "Enrolled in Class 8, 9, or 10 with interest in STEM and engineering.",
    shortSummary:
      "Early engineering-entrance foundation building advanced mathematical thinking, scientific reasoning, and analytical problem-solving.",
    description:
      "Bridges the gap between school-level Science/Mathematics and senior secondary competitive engineering preparation. Focuses on conceptual clarity, Olympiad-grade reasoning, and multi-step numerical solving without overwhelming young learners.",
    learningOutcomes: [
      "Transition smoothly from school textbook formulas to multi-concept application",
      "Develop strong analytical and mathematical reasoning skills early",
      "Build confidence in Physics vectors, kinematics, atomic chemistry, and algebra",
    ],
    modules: [
      {
        title: "Module 1: Foundation Mathematics for Engineering",
        teachingHours: 70,
        lessons: [
          "Number Theory, Polynomials, Inequalities & Logarithms",
          "Plane Geometry, Trigonometry Basics & Coordinate Geometry",
          "Combinatorics, Sequences & Analytical Puzzle Solving",
        ],
      },
      {
        title: "Module 2: Foundation Physics & Scientific Modelling",
        teachingHours: 60,
        lessons: [
          "Vectors, Basic Calculus Intuition for Physics & Kinematics",
          "Newtonian Mechanics, Fluid Statics, Heat & Geometrical Optics",
          "Electric Circuits & Magnetic Effects",
        ],
      },
      {
        title: "Module 3: Foundation Chemistry & Logical Reasoning",
        teachingHours: 50,
        lessons: [
          "Mole Concept, Stoichiometry, Atomic Structure & Periodic Trends",
          "Chemical Bonding Basics & Reaction Mechanisms",
          "Analytical & Spatial Reasoning Drills",
        ],
      },
    ],
    assessmentPattern: "Monthly JEE-Foundation pattern objective tests with detailed error analysis",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
    officialExamNotice:
      "This is an early foundation program for Classes 8–10, distinct from Class 11–12 full JEE Main/Advanced entrance preparation.",
  },
  {
    id: "CRS-JEE-MAIN",
    code: "SV-JEE-MAIN",
    slug: "jee-main-preparation",
    title: "JEE Main Preparation (Classes 11–12)",
    category: "IIT_JEE",
    categoryLabel: "IIT-JEE & Engineering Foundation",
    eligibleGrades: ["Class 11", "Class 12"],
    applicableBoards: ["CBSE", "ISC", "State Boards (PCM)"],
    deliveryModes: ["OFFLINE", "ONLINE", "HYBRID"],
    durationLabel: "Monthly Competitive Track (11–12)",
    durationMonths: 12,
    teachingHours: 300,
    pricingType: "MONTHLY_ADDON",
    priceInr: 3000,
    billingCycle: "MONTHLY",
    gstPercent: 0,
    installmentAvailable: true,
    batchCapacity: 25,
    defaultTimetable: "Mon–Sat | 6:00 PM – 8:00 PM",
    prerequisites: "Class 11 or 12 Science stream with Physics, Chemistry, and Mathematics (PCM).",
    shortSummary:
      "Rigorous JEE Main Physics, Chemistry, and Mathematics preparation with chapter-wise practice, authorized PYQ drills, and timed CBT mock tests.",
    description:
      "Aligned strictly with the official NTA JEE Main syllabus. Covers Single-Choice MCQs and Numerical Value questions across Physics, Chemistry, and Mathematics with personalized performance analytics and improvement plans.",
    learningOutcomes: [
      "Master all JEE Main Physics, Chemistry, and Mathematics units per current syllabus",
      "Solve authorized Previous Year Questions (PYQs) under timed exam conditions",
      "Improve speed, accuracy, and question-selection strategy in Computer Based Tests (CBT)",
    ],
    modules: [
      {
        title: "Module 1: JEE Main Physics",
        teachingHours: 100,
        lessons: [
          "Mechanics, Rotational Motion, Gravitation & Properties of Matter",
          "Thermodynamics, Kinetic Theory, Oscillations & Waves",
          "Electrostatics, Current Electricity, Magnetism, EMI & AC",
          "Optics, Dual Nature of Matter, Atoms, Nuclei & Electronic Devices",
        ],
      },
      {
        title: "Module 2: JEE Main Chemistry (Physical, Inorganic & Organic)",
        teachingHours: 100,
        lessons: [
          "Physical: Mole Concept, Thermodynamics, Equilibrium, Electrochemistry & Kinetics",
          "Inorganic: Periodic Table, Chemical Bonding, Coordination Compounds & Block Chemistry",
          "Organic: GOC, Isomerism, Hydrocarbons, Haloalkanes, Carbonyls, Amines & Biomolecules",
        ],
      },
      {
        title: "Module 3: JEE Main Mathematics",
        teachingHours: 100,
        lessons: [
          "Sets, Relations, Complex Numbers, Quadratic Equations, Matrices & Determinants",
          "Permutations, Binomial Theorem, Sequences & Series",
          "Limits, Continuity, Differentiability, Integral Calculus & Differential Equations",
          "Coordinate Geometry, Vector Algebra, 3D Geometry, Statistics & Probability",
        ],
      },
    ],
    assessmentPattern: "Bi-weekly 300-mark NTA pattern mock tests (MCQ + Numerical Value)",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-JEE-ADVANCED",
    code: "SV-JEE-ADV",
    slug: "jee-advanced-extension",
    title: "JEE Advanced Extension Module (Classes 11–12)",
    category: "IIT_JEE",
    categoryLabel: "IIT-JEE & Engineering Foundation",
    eligibleGrades: ["Class 11", "Class 12"],
    applicableBoards: ["CBSE", "ISC", "State Boards (PCM)"],
    deliveryModes: ["OFFLINE", "ONLINE", "HYBRID"],
    durationLabel: "Monthly Extension Track",
    durationMonths: 12,
    teachingHours: 160,
    pricingType: "MONTHLY_ADDON",
    priceInr: 2000,
    billingCycle: "MONTHLY",
    gstPercent: 0,
    installmentAvailable: true,
    batchCapacity: 20,
    defaultTimetable: "Wed, Fri, Sun | Advanced Problem-Solving Labs",
    prerequisites: "Enrolled in JEE Main Preparation with qualifying diagnostic/mock score.",
    shortSummary:
      "Advanced multi-concept problem-solving, multiple-correct, paragraph comprehension, and integer-type training for eligible Class 11–12 students.",
    description:
      "Designed for students who have established strong JEE Main fundamentals and aim to tackle high-difficulty multi-concept problems across Physics, Chemistry, and Mathematics.",
    learningOutcomes: [
      "Tackle multi-correct, paragraph-based, and matrix-match problem formats",
      "Synthesize concepts across multiple chapters (e.g., Mechanics + Electrodynamics)",
      "Manage negative marking and partial marking rules strategically",
    ],
    modules: [
      {
        title: "Module 1: Advanced Physics Multi-Concept Workshops",
        teachingHours: 55,
        lessons: [
          "Rigid Body Dynamics & Non-Inertial Frames",
          "Combined Electromagnetism & Mechanics Problems",
          "Advanced Thermodynamics & Wave Optics",
        ],
      },
      {
        title: "Module 2: Advanced Chemistry Mechanisms & Quantitative Analysis",
        teachingHours: 50,
        lessons: [
          "Stereochemistry & Multi-step Organic Synthesis",
          "Ionic Equilibrium, Electrochemistry & Qualitative Analysis",
        ],
      },
      {
        title: "Module 3: Advanced Calculus, Algebra & Coordinate Geometry",
        teachingHours: 55,
        lessons: [
          "Definite Integrals, Functional Equations & Inequalities",
          "Conic Sections, 3D Planes/Lines & Complex Number Geometry",
        ],
      },
    ],
    assessmentPattern: "Paper 1 & Paper 2 full-length JEE Advanced simulation tests",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },

  // ================= C. MEDICAL / NEET-UG FOUNDATION =================
  {
    id: "CRS-NEET-UG",
    code: "SV-NEET-UG",
    slug: "neet-ug-foundation",
    title: "NEET-UG Foundation & Preparation (Classes 9–10 & 11–12)",
    category: "NEET_UG",
    categoryLabel: "Medical & NEET-UG Foundation",
    eligibleGrades: ["Class 9", "Class 10", "Class 11", "Class 12"],
    applicableBoards: ["CBSE", "ICSE / ISC", "State Boards (PCB)"],
    deliveryModes: ["OFFLINE", "ONLINE", "HYBRID"],
    durationLabel: "Monthly Track (₹1,500 Found. / ₹3,000 Senior)",
    durationMonths: 12,
    teachingHours: 320,
    pricingType: "MONTHLY_ADDON",
    priceInr: 1500,
    billingCycle: "MONTHLY",
    gstPercent: 0,
    installmentAvailable: true,
    batchCapacity: 25,
    defaultTimetable: "Mon–Sat | 5:30 PM – 7:30 PM",
    prerequisites: "Classes 9–10 for Foundation (₹1,500/mo); Classes 11–12 PCB for Full Preparation (₹3,000/mo).",
    shortSummary:
      "Line-by-line NCERT mastery in Biology (Botany & Zoology), Physics, and Chemistry with assertion-reason drills and 720-mark mock tests.",
    description:
      "Provides distinct tracks for Class 9–10 Medical Foundation (₹1,500/month) and Class 11–12 NEET-UG Preparation (₹3,000/month). Focuses on complete NCERT command, rapid numerical solving in Physics/Chemistry, and high-accuracy Biology retention.",
    learningOutcomes: [
      "Master line-by-line NCERT Botany and Zoology diagrams, statements, and examples",
      "Build numerical speed and accuracy in Physics and Physical Chemistry for medical aspirants",
      "Practice Assertion-Reason, Statement-based, and Match-the-Column NEET questions",
    ],
    modules: [
      {
        title: "Module 1: NEET-UG Biology (Botany & Zoology)",
        teachingHours: 140,
        lessons: [
          "Diversity in Living World, Structural Organization & Cell Biology",
          "Plant Physiology, Reproduction, Genetics & Evolution",
          "Human Physiology, Biotechnology, Human Welfare & Ecology",
        ],
      },
      {
        title: "Module 2: NEET-UG Chemistry",
        teachingHours: 90,
        lessons: [
          "Physical Chemistry Numericals & Formula Application",
          "NCERT Inorganic Trends, Coordination & Bonding",
          "Named Organic Reactions, Mechanisms & Biomolecules",
        ],
      },
      {
        title: "Module 3: NEET-UG Physics",
        teachingHours: 90,
        lessons: [
          "Mathematical Tools, Mechanics, Fluids & Thermal Physics",
          "Electrostatics, Current Electricity, Magnetism & Optics",
          "Modern Physics, Semiconductor Electronics & Error Analysis",
        ],
      },
    ],
    assessmentPattern: "Bi-weekly 720-mark NEET pattern tests with NCERT page-reference analytics",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },

  // ================= D. OTHER COMPETITIVE FOUNDATIONS =================
  {
    id: "CRS-OLYMPIAD",
    code: "SV-COMP-OLY",
    slug: "olympiad-scholarship",
    title: "Olympiad and Scholarship Foundation (Classes 8–12)",
    category: "COMPETITIVE",
    categoryLabel: "Competitive Exam Foundations",
    eligibleGrades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    applicableBoards: ["CBSE", "ICSE / ISC", "State Boards"],
    deliveryModes: ["ONLINE", "OFFLINE", "HYBRID"],
    durationLabel: "Monthly Add-On Track",
    durationMonths: 12,
    teachingHours: 120,
    pricingType: "MONTHLY_ADDON",
    priceInr: 800,
    billingCycle: "MONTHLY",
    gstPercent: 0,
    installmentAvailable: true,
    batchCapacity: 30,
    defaultTimetable: "Weekends | 10:00 AM – 12:00 PM",
    prerequisites: "Classes 8–12 students aiming for Science, Maths, Cyber, or Aptitude Olympiads.",
    shortSummary:
      "Logical reasoning, non-routine mathematics, scientific aptitude, and MAT/SAT scholarship reasoning.",
    description:
      "Prepares students for recognized Mathematics, Science, Computer/Cyber, and English Olympiads as well as scholarship aptitude examinations through non-routine problem solving and MAT/SAT reasoning.",
    learningOutcomes: [
      "Solve Achievers-section and higher-order thinking (HOTS) problems",
      "Master verbal and non-verbal Mental Ability (MAT) reasoning",
      "Develop competitive test temperament early in school",
    ],
    modules: [
      {
        title: "Module 1: Logical & Mental Ability (MAT)",
        teachingHours: 40,
        lessons: [
          "Series, Coding-Decoding, Blood Relations, Syllogisms & Puzzles",
          "Spatial Visualization, Mirror/Water Images, Cube & Dice Problems",
        ],
      },
      {
        title: "Module 2: Olympiad Mathematics & Scientific Aptitude",
        teachingHours: 80,
        lessons: [
          "Number Theory, Combinatorics, Geometry & Algebraic Problem Solving",
          "Experimental Science & Data Interpretation Questions",
        ],
      },
    ],
    assessmentPattern: "Monthly Olympiad-pattern timed objective assessments",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
    officialExamNotice:
      "Provides academic preparation for recognized Olympiads and scholarship tests; SoftLab Global is an independent education provider and does not claim official affiliation with external exam boards.",
  },
  {
    id: "CRS-CUET",
    code: "SV-COMP-CUET",
    slug: "cuet-foundation",
    title: "CUET Foundation Program (Classes 11–12)",
    category: "COMPETITIVE",
    categoryLabel: "Competitive Exam Foundations",
    eligibleGrades: ["Class 11", "Class 12"],
    applicableBoards: ["CBSE", "ISC", "State Boards"],
    deliveryModes: ["ONLINE", "OFFLINE", "HYBRID"],
    durationLabel: "Monthly Add-On Track",
    durationMonths: 12,
    teachingHours: 150,
    pricingType: "MONTHLY_ADDON",
    priceInr: 1500,
    billingCycle: "MONTHLY",
    gstPercent: 0,
    installmentAvailable: true,
    batchCapacity: 30,
    defaultTimetable: "Tue, Thu, Sat | 7:00 PM – 8:30 PM",
    prerequisites: "Class 11 or Class 12 student targeting Central & participating universities.",
    shortSummary:
      "Complete preparation for CUET Section I (Language), Section II (Domain Subjects), and Section III (General Test).",
    description:
      "Balances Class 12 board preparation with CUET objective speed. Covers Reading Comprehension, NCERT-based Domain MCQs, Quantitative Reasoning, Logical Reasoning, and General Awareness.",
    learningOutcomes: [
      "Achieve high accuracy in NCERT-based Domain Subject MCQs",
      "Master Reading Comprehension, Vocabulary, and Verbal Ability",
      "Excel in CUET General Test (Quant, Reasoning & Current Affairs)",
    ],
    modules: [
      {
        title: "Module 1: Section I — English Language & Reading Comprehension",
        teachingHours: 45,
        lessons: [
          "Factual, Narrative & Literary Reading Passages",
          "Vocabulary, Idioms, Rearrangement & Grammar Usage",
        ],
      },
      {
        title: "Module 2: Section II — NCERT Domain MCQ Drills",
        teachingHours: 60,
        lessons: [
          "Science / Commerce / Humanities Domain Chapter MCQs",
          "Case-Based & Statement-Matching Objective Drills",
        ],
      },
      {
        title: "Module 3: Section III — General Test (Quant, Reasoning & GK)",
        teachingHours: 45,
        lessons: [
          "Quantitative Arithmetic, Mensuration & Data Interpretation",
          "Analytical Reasoning & Static/Current General Awareness",
        ],
      },
    ],
    assessmentPattern: "Bi-weekly CBT mock tests following current CUET marking scheme",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-NDA",
    code: "SV-COMP-NDA",
    slug: "nda-foundation",
    title: "NDA Foundation Program (Classes 11–12)",
    category: "COMPETITIVE",
    categoryLabel: "Competitive Exam Foundations",
    eligibleGrades: ["Class 11", "Class 12"],
    applicableBoards: ["CBSE", "ISC", "State Boards"],
    deliveryModes: ["OFFLINE", "ONLINE", "HYBRID"],
    durationLabel: "Monthly Add-On Track",
    durationMonths: 12,
    teachingHours: 160,
    pricingType: "MONTHLY_ADDON",
    priceInr: 1500,
    billingCycle: "MONTHLY",
    gstPercent: 0,
    installmentAvailable: true,
    batchCapacity: 25,
    defaultTimetable: "Mon, Wed, Fri | 5:00 PM – 6:30 PM",
    prerequisites: "Class 11 or 12 student preparing for NDA written examination.",
    shortSummary:
      "Comprehensive NDA Paper I (Mathematics) and Paper II (General Ability Test — English & GK) foundation with communication & leadership skills.",
    description:
      "Equips senior secondary students with the mathematical speed, English proficiency, General Science, and Social Studies knowledge required for the NDA written examination alongside personality development.",
    learningOutcomes: [
      "Master NDA Paper I Mathematics (Algebra, Trigonometry, Calculus, Vectors, Statistics)",
      "Build strong command over NDA GAT English and General Studies",
      "Develop structured communication, group discussion, and leadership confidence",
    ],
    modules: [
      {
        title: "Module 1: NDA Paper I — Mathematics",
        teachingHours: 80,
        lessons: [
          "Algebra, Matrices, Determinants, Trigonometry & Analytical Geometry",
          "Differential & Integral Calculus, Vector Algebra, Statistics & Probability",
        ],
      },
      {
        title: "Module 2: NDA Paper II — General Ability Test (GAT)",
        teachingHours: 60,
        lessons: [
          "English Grammar, Vocabulary, Comprehension & Spotting Errors",
          "General Science (Physics, Chemistry, Biology) & Indian Polity/History/Geography",
        ],
      },
      {
        title: "Module 3: Communication & Officer-Like Personality Basics",
        teachingHours: 20,
        lessons: [
          "Public Speaking, Group Discussion & Structured Expression",
          "Current Affairs Analysis & Ethical Leadership",
        ],
      },
    ],
    assessmentPattern: "Monthly Paper-I (300M) and Paper-II (600M) timed mock tests",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },

  // ================= E. TECHNOLOGY, AI, CODING & FUTURE SKILLS =================
  {
    id: "CRS-COMP-FUND",
    code: "SV-TECH-01",
    slug: "computer-digital-skills",
    title: "Computer Fundamentals & Digital Productivity",
    category: "TECH_AI_CODING",
    categoryLabel: "Technology, AI & Coding",
    eligibleGrades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    applicableBoards: ["All Boards"],
    deliveryModes: ["OFFLINE", "ONLINE", "HYBRID"],
    durationLabel: "2 Months Standalone",
    durationMonths: 2,
    teachingHours: 40,
    pricingType: "STANDALONE",
    priceInr: 2499,
    billingCycle: "ONE_TIME",
    gstPercent: 0,
    installmentAvailable: false,
    batchCapacity: 25,
    defaultTimetable: "Mon, Wed, Fri | 4:00 PM – 5:30 PM",
    prerequisites: "No prior computer experience required.",
    shortSummary:
      "Operating systems, file management, cloud workspaces, keyboard mastery, internet research, and digital productivity.",
    description:
      "Builds essential computing fluency for school and higher education. Covers Windows/Linux basics, cloud collaboration, structured document creation, and safe internet workflows.",
    learningOutcomes: [
      "Understand computer hardware, operating systems, and file organization",
      "Use cloud productivity suites and keyboard shortcuts efficiently",
      "Create academic reports, spreadsheets, and presentations",
    ],
    modules: [
      {
        title: "Module 1: Computer Architecture, OS & File Systems",
        teachingHours: 20,
        lessons: [
          "Hardware Components, Memory, Storage & Operating Systems",
          "File Management, Compression, Cloud Drives & Backup Hygiene",
        ],
      },
      {
        title: "Module 2: Digital Productivity & Collaboration",
        teachingHours: 20,
        lessons: [
          "Document Formatting, Spreadsheets & Academic Presentations",
          "Email Etiquette, Online Research & Digital Safety",
        ],
      },
    ],
    assessmentPattern: "Practical lab tasks + Final digital portfolio assessment",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-MS-OFFICE",
    code: "SV-TECH-02",
    slug: "ms-office-excel",
    title: "MS Office, Advanced Excel & Presentation Mastery",
    category: "TECH_AI_CODING",
    categoryLabel: "Technology, AI & Coding",
    eligibleGrades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    applicableBoards: ["All Boards"],
    deliveryModes: ["OFFLINE", "ONLINE", "HYBRID"],
    durationLabel: "2 Months Standalone",
    durationMonths: 2,
    teachingHours: 45,
    pricingType: "STANDALONE",
    priceInr: 2999,
    billingCycle: "ONE_TIME",
    gstPercent: 0,
    installmentAvailable: false,
    batchCapacity: 25,
    defaultTimetable: "Tue, Thu, Sat | 4:00 PM – 5:30 PM",
    prerequisites: "Basic computer familiarity.",
    shortSummary:
      "Hands-on mastery of Word, Excel formulas, pivot tables, charts, and high-impact PowerPoint presentations.",
    description:
      "Practical training in Microsoft Office and spreadsheet analytics. Students learn professional document formatting, Excel data analysis, lookup functions, and visual storytelling.",
    learningOutcomes: [
      "Format professional reports and academic dissertations in MS Word",
      "Analyze data using Excel formulas, VLOOKUP/XLOOKUP, Pivot Tables, and Charts",
      "Design clear, persuasive slide decks in PowerPoint",
    ],
    modules: [
      {
        title: "Module 1: MS Word & PowerPoint Design",
        teachingHours: 20,
        lessons: [
          "Styles, Table of Contents, Citations & Page Layouts",
          "Slide Master, Infographics & Visual Presentation Design",
        ],
      },
      {
        title: "Module 2: MS Excel Data & Formula Mastery",
        teachingHours: 25,
        lessons: [
          "Logical, Text, Date & Lookup Functions",
          "Data Validation, Conditional Formatting, Pivot Tables & Dashboards",
        ],
      },
    ],
    assessmentPattern: "Spreadsheet lab project + Presentation capstone",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-AI-LITERACY",
    code: "SV-TECH-03",
    slug: "ai-and-coding",
    title: "AI Literacy, Prompt Engineering & Responsible AI Use",
    category: "TECH_AI_CODING",
    categoryLabel: "Technology, AI & Coding",
    eligibleGrades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    applicableBoards: ["All Boards"],
    deliveryModes: ["ONLINE", "OFFLINE", "HYBRID"],
    durationLabel: "1 Month Standalone",
    durationMonths: 1,
    teachingHours: 24,
    pricingType: "STANDALONE",
    priceInr: 1999,
    billingCycle: "ONE_TIME",
    gstPercent: 0,
    installmentAvailable: false,
    batchCapacity: 25,
    defaultTimetable: "Mon, Wed, Fri | 5:30 PM – 7:00 PM",
    prerequisites: "Open to all students in Classes 8–12.",
    shortSummary:
      "Understand how modern AI works, master structured prompt engineering for learning, and practice safe, ethical AI usage.",
    description:
      "Teaches students how Large Language Models and generative AI work under the hood, how to use AI ethically as a study tutor without plagiarism, and how to verify AI outputs for hallucinations and bias.",
    learningOutcomes: [
      "Understand foundational concepts of Machine Learning and Generative AI",
      "Write structured, context-rich prompts for problem solving and coding assistance",
      "Apply strict academic integrity, privacy protection, and fact-checking when using AI",
    ],
    modules: [
      {
        title: "Module 1: How AI & LLMs Work + Structured Prompt Engineering",
        teachingHours: 14,
        lessons: [
          "Introduction to AI, Machine Learning, Neural Networks & Tokens",
          "Role, Context, Constraint & Step-by-Step Prompt Frameworks",
        ],
      },
      {
        title: "Module 2: Responsible & Safe AI Use for Students",
        teachingHours: 10,
        lessons: [
          "Detecting Hallucinations, Deepfakes & Algorithmic Bias",
          "Personal Data Privacy & Ethical Academic Use vs Plagiarism",
        ],
      },
    ],
    assessmentPattern: "Prompt engineering portfolio + AI safety evaluation quiz",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-SCRATCH",
    code: "SV-TECH-04",
    slug: "scratch-coding",
    title: "Scratch Coding & Computational Thinking",
    category: "TECH_AI_CODING",
    categoryLabel: "Technology, AI & Coding",
    eligibleGrades: ["Class 8", "Class 9", "Class 10"],
    applicableBoards: ["All Boards"],
    deliveryModes: ["ONLINE", "OFFLINE", "HYBRID"],
    durationLabel: "2 Months Standalone",
    durationMonths: 2,
    teachingHours: 36,
    pricingType: "STANDALONE",
    priceInr: 2999,
    billingCycle: "ONE_TIME",
    gstPercent: 0,
    installmentAvailable: false,
    batchCapacity: 20,
    defaultTimetable: "Tue, Thu, Sat | 4:30 PM – 6:00 PM",
    prerequisites: "Beginner-friendly; ideal for Classes 8–10.",
    shortSummary:
      "Build interactive animations, logic games, and stories while mastering loops, conditionals, variables, and events.",
    description:
      "Introduces programming logic visually before transitioning to text-based languages. Students build interactive simulations and games while learning core algorithmic concepts.",
    learningOutcomes: [
      "Master loops, conditionals, variables, events, and cloning",
      "Design interactive 2D games and science simulations",
      "Develop step-by-step debugging and algorithmic thinking habits",
    ],
    modules: [
      {
        title: "Module 1: Visual Programming Logic & Control Flow",
        teachingHours: 18,
        lessons: [
          "Sprites, Coordinates, Motion, Loops & Conditional Branching",
          "Variables, Lists, Broadcast Events & Custom Blocks",
        ],
      },
      {
        title: "Module 2: Game Design & Interactive STEM Simulations",
        teachingHours: 18,
        lessons: [
          "Collision Detection, Scoring Systems & Multi-Level Games",
          "Capstone Interactive Science/Math Simulation Project",
        ],
      },
    ],
    assessmentPattern: "2 playable project builds + Logic quiz",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-PYTHON",
    code: "SV-TECH-05",
    slug: "python-programming-foundation",
    title: "Python Programming Foundation",
    category: "TECH_AI_CODING",
    categoryLabel: "Technology, AI & Coding",
    eligibleGrades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    applicableBoards: ["CBSE Computer Science / IP", "ICSE", "All Boards"],
    deliveryModes: ["ONLINE", "OFFLINE", "HYBRID"],
    durationLabel: "3 Months Standalone",
    durationMonths: 3,
    teachingHours: 60,
    pricingType: "STANDALONE",
    priceInr: 4999,
    billingCycle: "ONE_TIME",
    gstPercent: 0,
    installmentAvailable: true,
    batchCapacity: 20,
    defaultTimetable: "Mon, Wed, Fri | 6:00 PM – 7:30 PM",
    prerequisites: "Basic computer usage; no prior coding required.",
    shortSummary:
      "Complete Python programming from variables and loops to functions, data structures, file handling, and real-world mini projects.",
    description:
      "A hands-on coding course aligned with school Computer Science curricula and modern software engineering foundations. Students write clean Python code and build practical command-line and data applications.",
    learningOutcomes: [
      "Write structured Python programs using conditionals, loops, and functions",
      "Work with Lists, Tuples, Dictionaries, Sets, and String manipulation",
      "Read/write files, handle exceptions, and build modular mini-projects",
    ],
    modules: [
      {
        title: "Module 1: Python Syntax, Data Types & Control Flow",
        teachingHours: 20,
        lessons: [
          "Variables, Operators, Input/Output & Type Conversion",
          "If-Elif-Else Branching, For/While Loops & Pattern Problems",
        ],
      },
      {
        title: "Module 2: Data Structures, Functions & Modules",
        teachingHours: 22,
        lessons: [
          "Lists, Tuples, Dictionaries, Sets & List Comprehensions",
          "User-Defined Functions, Recursion Basics & Standard Library Modules",
        ],
      },
      {
        title: "Module 3: File Handling, OOP Basics & Capstone Project",
        teachingHours: 18,
        lessons: [
          "Text & CSV File Handling, Error/Exception Handling",
          "Classes & Objects Introduction + Student Capstone Project",
        ],
      },
    ],
    assessmentPattern: "Weekly coding assignments + Proctored coding test + Capstone project",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-WEB-DEV",
    code: "SV-TECH-06",
    slug: "web-development-basics",
    title: "Web Development Basics (HTML5, CSS3 & JavaScript)",
    category: "TECH_AI_CODING",
    categoryLabel: "Technology, AI & Coding",
    eligibleGrades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    applicableBoards: ["All Boards"],
    deliveryModes: ["ONLINE", "OFFLINE", "HYBRID"],
    durationLabel: "3 Months Standalone",
    durationMonths: 3,
    teachingHours: 60,
    pricingType: "STANDALONE",
    priceInr: 4999,
    billingCycle: "ONE_TIME",
    gstPercent: 0,
    installmentAvailable: true,
    batchCapacity: 20,
    defaultTimetable: "Tue, Thu, Sat | 6:00 PM – 7:30 PM",
    prerequisites: "Basic computer familiarity.",
    shortSummary:
      "Design and build responsive, interactive websites from scratch using semantic HTML5, modern CSS3 Flexbox/Grid, and JavaScript DOM.",
    description:
      "Teaches students how the web works and how to build responsive websites and interactive web applications using standards-compliant HTML, CSS, and JavaScript.",
    learningOutcomes: [
      "Structure accessible web pages using semantic HTML5 elements",
      "Style responsive layouts for mobile and desktop using CSS Flexbox and Grid",
      "Add interactivity, form validation, and dynamic UI updates with JavaScript",
    ],
    modules: [
      {
        title: "Module 1: Semantic HTML5 & Modern CSS3 Layouts",
        teachingHours: 24,
        lessons: [
          "HTML5 Document Structure, Forms, Tables & Media",
          "CSS Box Model, Typography, Flexbox, CSS Grid & Responsive Media Queries",
        ],
      },
      {
        title: "Module 2: JavaScript Programming & DOM Manipulation",
        teachingHours: 24,
        lessons: [
          "Variables, Functions, Arrays, Objects & ES6 Syntax",
          "DOM Selection, Event Listeners, Form Validation & Fetch Basics",
        ],
      },
      {
        title: "Module 3: Portfolio Website Deployment",
        teachingHours: 12,
        lessons: [
          "Web Accessibility, Performance Basics & Git Version Control Intro",
          "Building & Presenting a Live Student Portfolio Website",
        ],
      },
    ],
    assessmentPattern: "3 progressive web builds + Live portfolio review",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-ROBOTICS-STEM",
    code: "SV-TECH-07",
    slug: "robotics-and-stem",
    title: "Robotics, Electronics & STEM Projects",
    category: "TECH_AI_CODING",
    categoryLabel: "Technology, AI & Coding",
    eligibleGrades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    applicableBoards: ["All Boards"],
    deliveryModes: ["OFFLINE", "HYBRID"],
    durationLabel: "2 Months Standalone",
    durationMonths: 2,
    teachingHours: 40,
    pricingType: "STANDALONE",
    priceInr: 3999,
    billingCycle: "ONE_TIME",
    gstPercent: 0,
    installmentAvailable: false,
    batchCapacity: 18,
    defaultTimetable: "Weekends | 2:00 PM – 4:30 PM",
    prerequisites: "Curiosity for electronics, sensors, and hands-on building.",
    shortSummary:
      "Hands-on microcontroller programming, electronic circuits, sensors, actuators, and automated STEM project building.",
    description:
      "Connects classroom Physics with real-world electronics and embedded programming. Students design circuits, interface ultrasonic/IR/temperature sensors, and build working STEM prototypes.",
    learningOutcomes: [
      "Understand breadboards, resistors, LEDs, sensors, and DC/servo motors",
      "Program microcontrollers (Arduino/ESP32 simulator & lab hardware)",
      "Design and demonstrate a working automated STEM prototype",
    ],
    modules: [
      {
        title: "Module 1: Electronic Circuits, Sensors & Microcontrollers",
        teachingHours: 20,
        lessons: [
          "Voltage, Current, Resistance, Breadboarding & Digital/Analog I/O",
          "Interfacing Ultrasonic, IR, LDR & Temperature Sensors",
        ],
      },
      {
        title: "Module 2: Motor Control & Automated STEM Prototypes",
        teachingHours: 20,
        lessons: [
          "Servo Motors, Relay Modules & Obstacle-Avoidance Logic",
          "Smart Automation Capstone Project & Exhibition",
        ],
      },
    ],
    assessmentPattern: "Circuit simulation check + Working STEM prototype demonstration",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-SPOKEN-ENGLISH",
    code: "SV-COMM-01",
    slug: "spoken-english-personality",
    title: "Spoken English, Public Speaking & Personality Development",
    category: "COMMUNICATION_CAREER",
    categoryLabel: "Communication & Career Readiness",
    eligibleGrades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    applicableBoards: ["All Boards"],
    deliveryModes: ["OFFLINE", "ONLINE", "HYBRID"],
    durationLabel: "3 Months Standalone (₹3,999) / 1 Month Intensive (₹1,499)",
    durationMonths: 3,
    teachingHours: 54,
    pricingType: "STANDALONE",
    priceInr: 3999,
    billingCycle: "ONE_TIME",
    gstPercent: 0,
    installmentAvailable: true,
    batchCapacity: 20,
    defaultTimetable: "Mon, Wed, Fri | 4:30 PM – 6:00 PM",
    prerequisites: "Open to Classes 8–12.",
    shortSummary:
      "Fluency, pronunciation, vocabulary, stage confidence, debate, group discussion, and positive body language.",
    description:
      "Helps students overcome hesitation and speak fluent, grammatically accurate English in classrooms, debates, interviews, and public forums.",
    learningOutcomes: [
      "Speak fluent, natural English with clear pronunciation and intonation",
      "Deliver structured speeches, extempore talks, and debate arguments",
      "Practice confident posture, active listening, and interpersonal etiquette",
    ],
    modules: [
      {
        title: "Module 1: Conversational Fluency, Grammar in Action & Vocabulary",
        teachingHours: 20,
        lessons: [
          "Sentence Framing, Tense Accuracy & Everyday Conversational Scenarios",
          "Pronunciation, Voice Modulation & Expressive Vocabulary",
        ],
      },
      {
        title: "Module 2: Public Speaking, Debate & Group Discussions",
        teachingHours: 20,
        lessons: [
          "Structuring Speeches, Overcoming Stage Fright & Storytelling",
          "Moderated Group Discussions & Parliamentary Debate Practice",
        ],
      },
      {
        title: "Module 3: Personality Development & Leadership Etiquette",
        teachingHours: 14,
        lessons: [
          "Body Language, Grooming, Time Management & Goal Setting",
          "Academic & Scholarship Interview Readiness",
        ],
      },
    ],
    assessmentPattern: "Recorded speech evaluations + Group discussion rubric",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-PUBLIC-SPEAKING-1M",
    code: "SV-COMM-02",
    slug: "public-speaking-personality-1m",
    title: "Public Speaking and Personality Development (1-Month Intensive)",
    category: "COMMUNICATION_CAREER",
    categoryLabel: "Communication & Career Readiness",
    eligibleGrades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    applicableBoards: ["All Boards"],
    deliveryModes: ["OFFLINE", "ONLINE", "HYBRID"],
    durationLabel: "1 Month Standalone",
    durationMonths: 1,
    teachingHours: 20,
    pricingType: "STANDALONE",
    priceInr: 1499,
    billingCycle: "ONE_TIME",
    gstPercent: 0,
    installmentAvailable: false,
    batchCapacity: 20,
    defaultTimetable: "Tue, Thu, Sat | 5:00 PM – 6:30 PM",
    prerequisites: "Open to Classes 8–12.",
    shortSummary:
      "Focused 1-month workshop on stage confidence, speech structuring, body language, and presentation skills.",
    description:
      "An intensive 4-week workshop focused on stage presence, structured speaking, voice modulation, and interpersonal confidence.",
    learningOutcomes: [
      "Deliver a 5-minute structured keynote speech with confidence",
      "Participate effectively in school debates and group discussions",
    ],
    modules: [
      {
        title: "Module 1: Stage Confidence & Speech Delivery",
        teachingHours: 20,
        lessons: [
          "Voice Projection, Pacing, Eye Contact & Overcoming Nervousness",
          "Impromptu Speaking & Final Showcase Presentation",
        ],
      },
    ],
    assessmentPattern: "Live showcase speech evaluation",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-CAREER-GUIDANCE",
    code: "SV-COMM-03",
    slug: "career-guidance",
    title: "Career Guidance, Stream Selection & Interview Basics",
    category: "COMMUNICATION_CAREER",
    categoryLabel: "Communication & Career Readiness",
    eligibleGrades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    applicableBoards: ["All Boards"],
    deliveryModes: ["ONLINE", "OFFLINE", "HYBRID"],
    durationLabel: "1 Month / Counseling Track",
    durationMonths: 1,
    teachingHours: 16,
    pricingType: "STANDALONE",
    priceInr: 1499,
    billingCycle: "ONE_TIME",
    gstPercent: 0,
    installmentAvailable: false,
    batchCapacity: 25,
    defaultTimetable: "Weekends | 11:00 AM – 1:00 PM",
    prerequisites: "Students in Classes 8–12 and their parents.",
    shortSummary:
      "Informed stream selection after Class 10, university/entrance pathway mapping after Class 12, portfolio building, and interview basics.",
    description:
      "Provides structured, objective information on academic streams (PCM, PCB, Commerce, Humanities), national entrance examinations (JEE, NEET, CUET, NDA, Design, Law), emerging technology careers, and interview communication.",
    learningOutcomes: [
      "Understand stream choices after Class 10 based on aptitude and interest",
      "Map undergraduate degree and entrance examination timelines for Classes 11–12",
      "Build a clean student achievement portfolio and practice interview basics",
    ],
    modules: [
      {
        title: "Module 1: Stream & Career Pathway Mapping",
        teachingHours: 8,
        lessons: [
          "Engineering, Medical, Pure Sciences, Commerce, Management, Law & Design",
          "Emerging Careers in AI, Data Science, Cybersecurity & Sustainability",
        ],
      },
      {
        title: "Module 2: Student Profile Building & Interview Basics",
        teachingHours: 8,
        lessons: [
          "Documenting Projects, Olympiads & Extracurricular Achievements",
          "Mock Academic & Scholarship Interviews with Feedback",
        ],
      },
    ],
    assessmentPattern: "Individualized Career Roadmap Report + Mock Interview",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-FINANCIAL-LITERACY",
    code: "SV-TECH-08",
    slug: "financial-literacy-for-teens",
    title: "Financial Literacy for Teens",
    category: "TECH_AI_CODING",
    categoryLabel: "Technology, AI & Coding",
    eligibleGrades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    applicableBoards: ["All Boards"],
    deliveryModes: ["ONLINE", "OFFLINE", "HYBRID"],
    durationLabel: "1 Month Standalone",
    durationMonths: 1,
    teachingHours: 18,
    pricingType: "STANDALONE",
    priceInr: 1499,
    billingCycle: "ONE_TIME",
    gstPercent: 0,
    installmentAvailable: false,
    batchCapacity: 25,
    defaultTimetable: "Sat & Sun | 4:00 PM – 5:30 PM",
    prerequisites: "Basic arithmetic.",
    shortSummary:
      "Budgeting, savings, compound interest, banking basics, digital payment safety, inflation, and responsible money habits.",
    description:
      "Equips teenagers with practical life skills in personal finance, banking, compound interest, taxation basics, and protecting against UPI/online financial fraud.",
    learningOutcomes: [
      "Understand savings, budgeting, inflation, and the power of compounding",
      "Learn how banks, UPI, debit cards, and taxation work in India",
      "Identify and avoid online financial scams and phishing",
    ],
    modules: [
      {
        title: "Module 1: Money, Banking, Budgeting & Compounding",
        teachingHours: 18,
        lessons: [
          "Needs vs Wants, Personal Budgeting & Compound Interest Math",
          "Indian Banking System, Digital Payments Safety & Tax Basics",
        ],
      },
    ],
    assessmentPattern: "Personal budget simulation project + Quiz",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-REASONING-APTITUDE",
    code: "SV-COMP-APT",
    slug: "logical-reasoning-quantitative-aptitude",
    title: "Logical Reasoning and Quantitative Aptitude",
    category: "COMPETITIVE",
    categoryLabel: "Competitive Exam Foundations",
    eligibleGrades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    applicableBoards: ["All Boards"],
    deliveryModes: ["ONLINE", "OFFLINE", "HYBRID"],
    durationLabel: "2 Months Standalone",
    durationMonths: 2,
    teachingHours: 36,
    pricingType: "STANDALONE",
    priceInr: 2499,
    billingCycle: "ONE_TIME",
    gstPercent: 0,
    installmentAvailable: false,
    batchCapacity: 30,
    defaultTimetable: "Tue, Thu, Sat | 6:00 PM – 7:30 PM",
    prerequisites: "Classes 8–12.",
    shortSummary:
      "Analytical reasoning, data interpretation, number puzzles, percentages, ratios, and mental speed calculation.",
    description:
      "Sharpens analytical and quantitative thinking required across Olympiads, CUET General Test, NDA, and scholarship examinations.",
    learningOutcomes: [
      "Solve verbal, non-verbal, and analytical reasoning problems rapidly",
      "Master percentages, ratios, time-work, time-speed-distance, and data charts",
    ],
    modules: [
      {
        title: "Module 1: Analytical & Logical Reasoning",
        teachingHours: 18,
        lessons: [
          "Coding-Decoding, Seating Arrangements, Syllogisms & Direction Sense",
          "Data Sufficiency, Clocks, Calendars & Visual Reasoning",
        ],
      },
      {
        title: "Module 2: Quantitative Aptitude & Data Interpretation",
        teachingHours: 18,
        lessons: [
          "Speed Arithmetic, Ratios, Averages, Percentages & Profit/Loss",
          "Bar Graphs, Pie Charts, Line Graphs & Caselet DI",
        ],
      },
    ],
    assessmentPattern: "Weekly timed aptitude sprints",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-ENTREPRENEURSHIP",
    code: "SV-TECH-09",
    slug: "entrepreneurship-foundation",
    title: "Entrepreneurship Foundation for Young Innovators",
    category: "TECH_AI_CODING",
    categoryLabel: "Technology, AI & Coding",
    eligibleGrades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    applicableBoards: ["All Boards"],
    deliveryModes: ["ONLINE", "OFFLINE", "HYBRID"],
    durationLabel: "1 Month Standalone",
    durationMonths: 1,
    teachingHours: 18,
    pricingType: "STANDALONE",
    priceInr: 1999,
    billingCycle: "ONE_TIME",
    gstPercent: 0,
    installmentAvailable: false,
    batchCapacity: 25,
    defaultTimetable: "Weekends | 3:00 PM – 5:00 PM",
    prerequisites: "Open to Classes 8–12.",
    shortSummary:
      "Problem identification, design thinking, value proposition, basic unit economics, and pitching a student innovation project.",
    description:
      "Teaches students how to spot real community problems, design practical solutions, understand cost vs value, and present a structured project pitch.",
    learningOutcomes: [
      "Apply Design Thinking to solve real-world school or community challenges",
      "Create a lean project canvas, basic budget, and 5-slide pitch deck",
    ],
    modules: [
      {
        title: "Module 1: Design Thinking, Value Creation & Pitching",
        teachingHours: 18,
        lessons: [
          "Problem Discovery, User Empathy & Solution Prototyping",
          "Unit Economics Basics & Student Innovation Pitch Day",
        ],
      },
    ],
    assessmentPattern: "Student Innovation Pitch Deck presentation",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-CYBER-SAFETY",
    code: "SV-TECH-10",
    slug: "cyber-safety-digital-citizenship",
    title: "Cyber Safety, Networking Fundamentals & Digital Citizenship",
    category: "TECH_AI_CODING",
    categoryLabel: "Technology, AI & Coding",
    eligibleGrades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    applicableBoards: ["All Boards"],
    deliveryModes: ["ONLINE", "OFFLINE", "HYBRID"],
    durationLabel: "1 Month Standalone",
    durationMonths: 1,
    teachingHours: 20,
    pricingType: "STANDALONE",
    priceInr: 1499,
    billingCycle: "ONE_TIME",
    gstPercent: 0,
    installmentAvailable: false,
    batchCapacity: 30,
    defaultTimetable: "Mon, Wed, Fri | 5:00 PM – 6:30 PM",
    prerequisites: "Open to Classes 8–12.",
    shortSummary:
      "Password hygiene, two-factor authentication, phishing defence, social media privacy, networking basics, and responsible digital citizenship.",
    description:
      "Essential cybersecurity awareness and computer networking fundamentals for school students. Protects young learners against cyberbullying, phishing, identity theft, and unsafe online behaviour.",
    learningOutcomes: [
      "Understand how the Internet, IP addresses, DNS, and Wi-Fi networks operate",
      "Configure strong authentication, privacy settings, and device security",
      "Recognize social engineering, phishing links, and cyber safety reporting channels",
    ],
    modules: [
      {
        title: "Module 1: Networking Fundamentals & Cyber Hygiene",
        teachingHours: 20,
        lessons: [
          "How the Internet Works: LAN/WAN, IP, DNS, HTTPS & Firewalls",
          "Password Managers, 2FA, Phishing Detection & Digital Footprint Safety",
        ],
      },
    ],
    assessmentPattern: "Cyber hygiene audit lab + Certification test",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
  {
    id: "CRS-DATA-ANALYTICS",
    code: "SV-TECH-11",
    slug: "data-analytics-power-bi",
    title: "Introductory Data Analytics and Power BI",
    category: "TECH_AI_CODING",
    categoryLabel: "Technology, AI & Coding",
    eligibleGrades: ["Class 9", "Class 10", "Class 11", "Class 12"],
    applicableBoards: ["All Boards"],
    deliveryModes: ["ONLINE", "OFFLINE", "HYBRID"],
    durationLabel: "2 Months Standalone",
    durationMonths: 2,
    teachingHours: 40,
    pricingType: "STANDALONE",
    priceInr: 3499,
    billingCycle: "ONE_TIME",
    gstPercent: 0,
    installmentAvailable: false,
    batchCapacity: 20,
    defaultTimetable: "Tue, Thu, Sat | 6:30 PM – 8:00 PM",
    prerequisites: "Basic spreadsheet familiarity.",
    shortSummary:
      "Data cleaning, statistical charts, exploratory data analysis, and interactive dashboard creation with Power BI.",
    description:
      "Introduces senior school students to data literacy, statistical visualization, and business/scientific dashboard building using Microsoft Power BI.",
    learningOutcomes: [
      "Clean and structure raw datasets from CSV and Excel files",
      "Build interactive visual dashboards and KPI reports in Power BI",
      "Interpret charts accurately and avoid misleading data conclusions",
    ],
    modules: [
      {
        title: "Module 1: Data Literacy, Cleaning & Visual Storytelling",
        teachingHours: 20,
        lessons: [
          "Data Types, Summary Statistics, Outliers & Data Cleaning",
          "Choosing the Right Chart: Bar, Line, Scatter, Distribution & Heatmaps",
        ],
      },
      {
        title: "Module 2: Interactive Dashboards with Power BI",
        teachingHours: 20,
        lessons: [
          "Power Query Transformations, Data Modelling & Basic DAX Measures",
          "Building & Publishing an Interactive Analytical Dashboard",
        ],
      },
    ],
    assessmentPattern: "End-to-end dataset analysis & Power BI dashboard submission",
    syllabusRevisionDate: "2026-10-01",
    status: "PUBLISHED",
  },
];

export interface SkillverseDiagnosticQuestion {
  id: string;
  gradeBand: "8-10" | "11-12" | "ALL";
  subject: "Mathematics" | "Science" | "Logical Reasoning" | "AI & Digital Literacy" | "English";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const INITIAL_DIAGNOSTIC_QUESTIONS: SkillverseDiagnosticQuestion[] = [
  {
    id: "DIAG-Q1",
    gradeBand: "ALL",
    subject: "Mathematics",
    question: "If 3x + 7 = 22, what is the value of 2x² - 5?",
    options: ["45", "50", "25", "40"],
    correctIndex: 0,
    explanation: "3x = 15 => x = 5. Therefore, 2(5²) - 5 = 2(25) - 5 = 45.",
  },
  {
    id: "DIAG-Q2",
    gradeBand: "ALL",
    subject: "Science",
    question:
      "When a ray of light travels from an optically denser medium to a rarer medium, it bends:",
    options: [
      "Away from the normal",
      "Towards the normal",
      "Along the normal without deviation",
      "Back into the same medium at all angles",
    ],
    correctIndex: 0,
    explanation:
      "By Snell's Law, light speeds up when entering an optically rarer medium and bends away from the normal.",
  },
  {
    id: "DIAG-Q3",
    gradeBand: "ALL",
    subject: "Logical Reasoning",
    question: "Find the next number in the sequence: 3, 8, 15, 24, 35, ?",
    options: ["48", "46", "49", "50"],
    correctIndex: 0,
    explanation:
      "Differences are +5, +7, +9, +11. Next difference is +13, so 35 + 13 = 48 (or n² - 1 for n=2..7).",
  },
  {
    id: "DIAG-Q4",
    gradeBand: "ALL",
    subject: "AI & Digital Literacy",
    question:
      "Which of the following is the MOST responsible practice when using an AI tool for school study?",
    options: [
      "Using AI to explain a concept step-by-step and verifying facts with your textbook",
      "Copying AI-generated homework answers directly without reading them",
      "Sharing your personal home address and school password in the AI prompt",
      "Assuming every citation generated by a chatbot is 100% verified",
    ],
    correctIndex: 0,
    explanation:
      "Responsible AI literacy means using AI as a learning aid while verifying facts and protecting personal privacy.",
  },
  {
    id: "DIAG-Q5",
    gradeBand: "ALL",
    subject: "English",
    question:
      "Choose the grammatically correct sentence:",
    options: [
      "Neither the teacher nor the students were present in the laboratory.",
      "Neither the teacher nor the students was present in the laboratory.",
      "Neither the teacher or the students were present in the laboratory.",
      "Neither the teacher nor the students is present in the laboratory.",
    ],
    correctIndex: 0,
    explanation:
      "With 'neither...nor', the verb agrees with the closer subject ('students' -> plural 'were').",
  },
];

export const INITIAL_SKILLVERSE_FAQS = [
  {
    category: "Academics & Curriculum",
    question: "Which classes and school boards does SLG SKILLVERSE support?",
    answer:
      "SLG SKILLVERSE supports students in Classes 8, 9, 10, 11, and 12 across CBSE, ICSE/ISC, UP Board, and recognized State Boards. Classroom batches are delivered at our Civil Lines, Prayagraj campus, and Live Online / Hybrid batches are available from anywhere.",
  },
  {
    category: "Packages & Fees",
    question: "Are competitive-exam add-ons automatically added to my monthly package fee?",
    answer:
      "No. We follow strict fee transparency. Monthly academic packages (starting at ₹1,499/month for Classes 8–10 and ₹2,999/month for Classes 11–12) and competitive-exam add-ons (such as IIT-JEE, NEET-UG, Olympiad, CUET, or NDA) are itemized separately. You see the exact payable breakdown before checkout.",
  },
  {
    category: "Demo & Assessment",
    question: "Is there any fee for the initial academic assessment or demo class?",
    answer:
      "No. Both the initial diagnostic academic assessment and the trial demo class are completely free (₹0). A one-time Admission & Registration fee (₹500) and Student ID & Learning Kit fee (₹500) apply only when you formally enroll.",
  },
  {
    category: "Child Safety & Parent Portal",
    question: "How can parents track attendance, test scores, and fee receipts?",
    answer:
      "Every enrolled family receives a dedicated Parent Portal login linked exclusively to their child's verified profile. Parents can view real-time attendance, timetable schedules, assessment marks, fee receipts, and schedule Parent-Teacher Meetings (PTMs).",
  },
  {
    category: "IIT-JEE & NEET Foundation",
    question: "How is the Class 8–10 Foundation different from Class 11–12 JEE/NEET preparation?",
    answer:
      "For Classes 8–10, our Foundation track builds deep conceptual clarity in Maths/Science and analytical thinking without pressuring school exams. For Classes 11–12, we run full syllabus entrance preparation aligned with official JEE Main, JEE Advanced Extension, and NEET-UG patterns.",
  },
];

export const INITIAL_SKILLVERSE_BLOGS = [
  {
    slug: "how-to-balance-school-boards-and-jee-neet-foundation",
    title: "How Classes 8–10 Students Can Build Strong STEM Foundations Without Burnout",
    category: "Academic Strategy",
    publishedAt: "2026-10-15",
    readTime: "5 min read",
    summary:
      "A practical guide for students and parents on mastering NCERT concepts first, building logical reasoning habits, and avoiding rote memorization.",
    content: [
      "Strong performance in Class 11 and 12 competitive examinations begins with conceptual clarity in Classes 8, 9, and 10 — not with memorizing advanced formulas prematurely.",
      "When a Class 9 student truly understands why equations of motion work graphically or how mole ratios govern chemical reactions, senior secondary Physics and Chemistry become intuitive extensions rather than overwhelming leaps.",
      "At SLG SKILLVERSE, our weekly schedule balances core school board syllabus completion with dedicated problem-solving labs and monthly diagnostic assessments.",
    ],
  },
  {
    slug: "responsible-ai-literacy-for-school-students",
    title: "Why Every High School Student Needs AI Literacy & Prompt Engineering Skills",
    category: "Future Skills & AI",
    publishedAt: "2026-10-18",
    readTime: "4 min read",
    summary:
      "Learning how to use AI tools as a Socratic study partner while safeguarding personal privacy and academic honesty.",
    content: [
      "Artificial Intelligence is transforming software engineering, scientific research, and business analytics. However, using AI passively to copy homework undermines student learning.",
      "True AI literacy teaches students how Large Language Models work, how to craft structured prompts to break down complex topics, how to verify facts against primary textbooks, and how to protect personal data online.",
    ],
  },
  {
    slug: "stream-selection-guide-after-class-10",
    title: "Choosing Between PCM, PCB, Commerce, and Humanities After Class 10",
    category: "Career Guidance",
    publishedAt: "2026-10-20",
    readTime: "6 min read",
    summary:
      "How to combine diagnostic aptitude results, subject interest, and long-term career pathways when selecting your Class 11 stream.",
    content: [
      "Selecting a senior secondary stream is one of the first major academic decisions a student makes. Rather than following peer pressure, families should evaluate three factors: conceptual aptitude, subject curiosity, and undergraduate entrance pathways.",
      "Modern careers also allow cross-disciplinary skills — a Commerce or Humanities student with Data Analytics and Python skills has a tremendous advantage in economics, fintech, and policy research.",
    ],
  },
];
