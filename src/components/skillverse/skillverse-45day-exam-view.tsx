"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api as trpc } from "@/lib/trpc/react";
import { RazorpayStandardCheckout } from "@/components/payment/razorpay-standard-checkout";
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  BookOpen,
  Award,
  Video,
  FileText,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  PhoneCall,
  MessageCircle,
  User,
  Mail,
  GraduationCap,
  Layers,
  Zap,
  Check,
  AlertCircle,
  Download,
} from "lucide-react";

// ==========================================
// SYLLABUS DATA FOR COMMERCE & SCIENCE
// ==========================================
const COMMERCE_SYLLABUS = [
  {
    subject: "Accountancy (Code 055)",
    tagline: "4 Comprehensive Modules | Partnership, Company Accounts & Cash Flow",
    modules: [
      {
        title: "Module 1: Accounting for Partnership Firms",
        chapters: [
          "Partnership fundamentals, P&L Appropriation, Capital Accounts & Interest on Capital/Drawings",
          "Goodwill valuation methods (Average, Super, Capitalization) and Treatment on Change in PSR",
          "Admission of a Partner: Revaluation of assets/liabilities, reserves, and capital adjustments",
          "Retirement & Death of a Partner: Share calculation, deceased partner's profit till death, loan accounts",
          "Dissolution of Partnership Firm: Realization Account, partner loan settlements, and capital clearing",
        ],
      },
      {
        title: "Module 2: Company Accounts (Shares & Debentures)",
        chapters: [
          "Issue of Shares at Par, Premium, and Calls-in-Arrears/Calls-in-Advance",
          "Over-subscription and Pro-rata Allotment master table calculations",
          "Forfeiture and Re-issue of Shares with Capital Reserve transfers",
          "Issue of Debentures: Collateral security, terms of redemption, and writing off discount on issue",
        ],
      },
      {
        title: "Module 3: Financial Statement Analysis & Accounting Ratios",
        chapters: [
          "Format of Balance Sheet & Statement of P&L as per Schedule III of Companies Act 2013",
          "Tools of Analysis: Comparative Statements & Common-Size Statements",
          "Liquidity & Solvency Ratios: Current, Quick, Debt-Equity, Proprietary, Interest Coverage",
          "Activity & Profitability Ratios: Inventory, Debtors, Working Capital Turnover, Gross/Net Profit, ROI",
        ],
      },
      {
        title: "Module 4: Cash Flow Statement",
        chapters: [
          "Cash Flow from Operating Activities (Indirect method as per AS-3 Revised)",
          "Cash Flow from Investing Activities (Asset acquisition, sales, accumulated depreciation)",
          "Cash Flow from Financing Activities (Shares, debentures, loan repayments, interest & dividends)",
          "Complete Comprehensive 6-Mark Numerical Preparation & Working Notes masterclass",
        ],
      },
    ],
  },
  {
    subject: "Business Studies (Code 054)",
    tagline: "8 Modules | Management Principles, Planning, Marketing & Business Finance",
    modules: [
      {
        title: "Module 1 & 2: Nature of Management & Business Environment",
        chapters: [
          "Nature & Significance of Management, Fayol's 14 Principles & Taylor's Scientific Management",
          "Business Environment: Economic, Social, Tech, Legal, and Demonetization impacts",
        ],
      },
      {
        title: "Module 3 & 4: Planning, Organising & Staffing",
        chapters: [
          "Planning: Importance, limitations, and the 7-step planning process",
          "Organising: Functional vs Divisional structures, formal/informal, Delegation & Decentralization",
          "Staffing: Recruitment sources (Internal vs External), Selection process & Training methods",
        ],
      },
      {
        title: "Module 5: Directing & Controlling",
        chapters: [
          "Directing: Maslow's theory, Leadership styles, and overcoming communication barriers",
          "Controlling: Relationship with Planning, Management by Exception (MBE), Critical Point Control (CPC)",
        ],
      },
      {
        title: "Module 6, 7 & 8: Business Finance, Financial Markets & Marketing",
        chapters: [
          "Financial Management: Investment, Financing & Dividend decisions; Capital Structure & Trading on Equity",
          "Financial Markets: Money market instruments vs Capital Market (Primary vs Secondary); SEBI functions",
          "Marketing Management: Marketing Mix (Product, Price, Place, Promotion); Consumer Protection Act 2019",
        ],
      },
    ],
  },
  {
    subject: "Economics (Code 030)",
    tagline: "Macroeconomics & Indian Economic Development",
    modules: [
      {
        title: "Macroeconomics Modules 1–3: National Income, Money & Employment",
        chapters: [
          "National Income Accounting: Value Added, Income, and Expenditure methods with practical numericals",
          "Money & Banking: Commercial bank credit creation mechanism, RBI monetary policy tools (Repo, CRR, SLR)",
          "Determination of Income & Employment: Aggregate Demand/Supply, MPC, MPS, Investment Multiplier (K)",
        ],
      },
      {
        title: "Macroeconomics Modules 4–5: Government Budget & BoP",
        chapters: [
          "Government Budget: Fiscal & Revenue deficits, primary deficit, revenue vs capital receipts",
          "Balance of Payments: Current account, Capital account, foreign exchange rate systems",
        ],
      },
      {
        title: "Module 6: Indian Economic Development",
        chapters: [
          "Indian Economy on the Eve of Independence & 1950–1990 Five-Year Plans overview",
          "Economic Reforms since 1991 (LPG Policies: Liberalisation, Privatisation, Globalisation)",
          "Current Challenges: Human Capital Formation, Rural Development, Employment & Sustainability",
          "Comparative Development Experiences of India, Pakistan, and China (Key indicators)",
        ],
      },
    ],
  },
  {
    subject: "English Core (Code 301)",
    tagline: "Reading Comprehension, Advanced Writing & Literature Strategy",
    modules: [
      {
        title: "Reading & Advanced Writing Skills",
        chapters: [
          "Unseen Discursive & Case-based Passages: Note-making, comprehension & high-speed vocabulary",
          "Short Writing: Notice Writing, Invitations & Formal/Informal Replies",
          "Long Writing: Letters to Editor, Job Application with Bio-data, Article Writing & Report Writing",
        ],
      },
      {
        title: "Prescribed Literature (Flamingo & Vistas)",
        chapters: [
          "Prose & Poetry: High-scoring extract-based questions, character sketches, and thematic analysis",
          "Answer-Writing Checklists: CBSE step-marking presentation rubrics to secure 95+ in English",
        ],
      },
    ],
  },
];

const SCIENCE_SYLLABUS = [
  {
    subject: "Physics (Code 042)",
    tagline: "7 Modules | Electrostatics, Optics, Magnetism, AC & Modern Physics",
    modules: [
      {
        title: "Modules 1–3: Electrostatics, Current Electricity & Magnetism",
        chapters: [
          "Coulomb's Law, Electric Field, Gauss's Theorem applications, Electric Potential & Capacitors",
          "Ohm's Law, Drift Velocity derivation, Resistivity, Kirchhoff's Rules & Wheatstone Bridge",
          "Biot-Savart Law, Ampere's Circuital Law, Moving Coil Galvanometer & Magnetic properties",
        ],
      },
      {
        title: "Modules 4–5: EMI, AC Circuits & Electromagnetic Waves",
        chapters: [
          "Faraday's & Lenz's Law, Self/Mutual Inductance, LCR Series resonance circuit & Transformers",
          "Electromagnetic spectrum, displacement current, properties and applications of EM waves",
        ],
      },
      {
        title: "Modules 6–7: Optics & Modern Physics",
        chapters: [
          "Ray Optics: Lens Maker's Formula, Prism refraction, Compound Microscope & Telescope",
          "Wave Optics: Huygens Principle, Young's Double Slit interference & single-slit diffraction",
          "Dual Nature of Radiation & Matter: Photoelectric effect; Bohr's Atom model; Nuclear binding energy",
          "Semiconductor Electronics: p-n junction diode, I-V characteristics, Full/Half-Wave Rectifiers",
        ],
      },
    ],
  },
  {
    subject: "Chemistry (Code 043)",
    tagline: "7 Modules | Physical, Inorganic, Organic & Biomolecules",
    modules: [
      {
        title: "Physical Chemistry: Solutions, Electrochemistry & Kinetics",
        chapters: [
          "Solutions: Concentration terms, Henry's Law, Raoult's Law, Colligative properties & Van't Hoff factor",
          "Electrochemistry: Galvanic cells, Nernst Equation numericals, Kohlrausch's Law, Fuel Cells",
          "Chemical Kinetics: Rate laws, Order vs Molecularity, Integrated rate equations, Arrhenius equation",
        ],
      },
      {
        title: "Inorganic Chemistry: d & f Block and Coordination Compounds",
        chapters: [
          "d & f Block: Transition metal properties, oxidation states, Lanthanoid contraction, K2Cr2O7/KMnO4",
          "Coordination Compounds: IUPAC nomenclature, Werner's theory, VBT hybridization, CFT splitting",
        ],
      },
      {
        title: "Organic Chemistry & Biomolecules",
        chapters: [
          "Haloalkanes, Alcohols, Phenols, Ethers, Aldehydes, Ketones, Carboxylic Acids & Amines",
          "Key Named Reactions: Aldol, Cannizzaro, Reimer-Tiemann, Kolbe's, Hoffmann bromamide, Sandmeyer",
          "Biomolecules: Carbohydrates (Glucose/Fructose), Proteins (Peptide bond, denaturation), DNA vs RNA",
        ],
      },
    ],
  },
  {
    subject: "Mathematics (Code 041) — PCM Track",
    tagline: "6 Modules | Calculus, Algebra, Vectors & 3D Geometry",
    modules: [
      {
        title: "Algebra & Relations",
        chapters: [
          "Relations, Functions & Inverse Trigonometric Functions: Domain, range, principal value branch",
          "Matrices & Determinants: Inverse of matrix, solving systems of linear equations via Matrix Method",
        ],
      },
      {
        title: "Calculus Mastery (High Weightage)",
        chapters: [
          "Continuity & Differentiability: Chain rule, logarithmic differentiation",
          "Applications of Derivatives: Increasing/Decreasing functions, Maxima & Minima word problems",
          "Integrals: Substitution, Partial Fractions, Integration by Parts, Definite Integral properties",
          "Applications of Integrals (Area under curves) & Differential Equations (Variable separable & Linear ODEs)",
        ],
      },
      {
        title: "Vectors, 3D Geometry & Probability",
        chapters: [
          "Vectors & 3D: Dot & Cross products, equation of line, shortest distance between skew lines",
          "Linear Programming (Graphical feasible region) & Probability (Conditional, Bayes' Theorem)",
        ],
      },
    ],
  },
  {
    subject: "Biology (Code 044) — PCB Track",
    tagline: "5 Modules | Reproduction, Genetics, Biotechnology & Ecology",
    modules: [
      {
        title: "Reproduction & Genetics",
        chapters: [
          "Sexual Reproduction in Plants, Human Reproduction, Menstrual cycle, Reproductive Health (ART)",
          "Principles of Inheritance (Mendelian crosses, Pedigree analysis) & Molecular Basis of Inheritance (DNA/RNA/Lac Operon)",
        ],
      },
      {
        title: "Human Welfare, Biotechnology & Ecology",
        chapters: [
          "Human Health and Disease (Pathogens, Immunity, Cancer, AIDS)",
          "Biotechnology: Principles & Processes (rDNA, PCR, Gel Electrophoresis) and Applications in Medicine/Agri",
          "Ecology: Organisms & Populations, Ecosystem dynamics, Biodiversity conservation strategies",
        ],
      },
    ],
  },
  {
    subject: "English Core (Code 301) — Science",
    tagline: "Same High-Yield Reading, Writing Skills & Literature as Commerce",
    modules: [
      {
        title: "Reading, Writing & Literature Strategy",
        chapters: [
          "Comprehensive Unseen Passages, Notice, Letter to Editor, Job Application with Resume",
          "Article & Report Writing with CBSE marking scheme format checklists",
          "Flamingo & Vistas core chapters, poem analysis & high-scoring answers",
        ],
      },
    ],
  },
];

// ==========================================
// 5-PHASE ACADEMIC PLANNER DATA
// ==========================================
const PLANNER_PHASES = [
  {
    phase: "Phase 1: Days 1–3",
    title: "Diagnostic & Strategic Onboarding",
    badge: "Foundation & Gap Analysis",
    details: [
      "Subject-wise baseline diagnostic test to spot weak concepts.",
      "Comprehensive syllabus mapping and NCERT weightage breakdown.",
      "Personalized daily timetable allocation and LMS portal onboarding.",
      "Student learning kit & digital revision formula sheet unlock.",
    ],
  },
  {
    phase: "Phase 2: Days 4–20",
    title: "Core Concept Mastery & Chapter Notes",
    badge: "60% Syllabus Coverage",
    details: [
      "High-speed concept teaching focusing on repeat board examination questions.",
      "Daily live classes with in-class numerical derivations and case study decoding.",
      "Daily Practice Problems (DPP) with step-by-step video solutions.",
      "Digital chapter-wise summary notes and memory maps.",
    ],
  },
  {
    phase: "Phase 3: Days 21–30",
    title: "Advanced Numericals & 10-Year PYQ Breakdown",
    badge: "100% Syllabus Completion",
    details: [
      "Completion of remaining syllabus topics with rigorous problem solving.",
      "Systematic breakdown of last 10 years' CBSE board question papers.",
      "CBSE answer-writing presentation workshop (securing step marks).",
      "Special weekend live doubt-solving clinics with master faculty.",
    ],
  },
  {
    phase: "Phase 4: Days 31–38",
    title: "Intensive Revision & Timed Chapter Tests",
    badge: "Speed & Accuracy Booster",
    details: [
      "Fast-track rapid revision of high-weightage chapters across all subjects.",
      "Subject-wise timed chapter tests strictly following the latest sample papers.",
      "1-on-1 performance review and weak-topic booster sessions.",
      "Assertion-Reason & Case-Based competency question masterclass.",
    ],
  },
  {
    phase: "Phase 5: Days 39–45",
    title: "Full-Length Board Mocks & Final Readiness",
    badge: "Exam Simulation & Evaluation",
    details: [
      "5 Full-length 3-hour evaluated board simulations under strict exam timing.",
      "In-depth handwritten answer sheet evaluation by veteran board examiners.",
      "Detailed scorecard with personalized improvement checklist.",
      "Final exam temperament, time management, and confidence coaching.",
    ],
  },
];

// ==========================================
// FAQS
// ==========================================
const FAQS = [
  {
    q: "Who is eligible for this 45-Day Board Exam Power Preparation?",
    a: "Any student appearing for Class 12 Board Examinations (CBSE, ISC, or recognized State Boards) in Commerce or Science streams. It is also ideal for improvement exam aspirants and students aiming to boost their score from 60–70% to 90%+.",
  },
  {
    q: "What is the total fee for Commerce and Science programmes?",
    a: "Commerce Track (Accountancy, Business Studies, Economics, English Core) is ₹4,500 all-inclusive. Science Track (Physics, Chemistry, English Core, plus student choice of Mathematics or Biology) is ₹5,100 all-inclusive. PCMB dual-science extension is available for ₹5,900.",
  },
  {
    q: "What are the daily class timings?",
    a: "Live classes run daily in the late afternoon / evening (Commerce: 4:00 PM – 7:30 PM | Science: 4:30 PM – 8:30 PM) so they do not interfere with regular school hours.",
  },
  {
    q: "What happens if I miss a live class?",
    a: "Every single live lecture is recorded in ultra-HD and made available within your Skillverse Student LMS Portal within 2 hours of completion. You have unlimited replay access till your final board exam date.",
  },
  {
    q: "Are study materials and notes included in the course fee?",
    a: "Yes! Complete digital chapter summaries, formula sheets, NCERT problem-solution banks, 10-year solved PYQs, and 5 full-length mock papers are included with zero hidden charges.",
  },
  {
    q: "How are doubts resolved?",
    a: "Doubts are solved real-time during live interactive classes, via dedicated daily faculty clinics, and through the 24/7 LMS doubt submission forum where teachers reply with step-by-step explanations.",
  },
  {
    q: "How are mock examinations evaluated?",
    a: "All 5 full-length mock examinations are manually evaluated by experienced board examiners using official CBSE step-marking rubrics. You receive detailed feedback highlighting where you lost marks.",
  },
  {
    q: "How does payment and enrollment work?",
    a: "Payment is securely processed via Razorpay (UPI, Cards, NetBanking). Upon successful payment, your official Skillverse Enrollment Code and LMS student credentials are generated instantly on screen and sent via email/WhatsApp.",
  },
];

export function Skillverse45DayExamView() {
  const [selectedStream, setSelectedStream] = useState<"COMMERCE" | "SCIENCE">("COMMERCE");
  const [scienceOption, setScienceOption] = useState<"PCM" | "PCB" | "PCMB">("PCM");
  const [expandedSubject, setExpandedSubject] = useState<string>("Accountancy (Code 055)");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Form State for Instant Enrolment & Counselling
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentClass, setCurrentClass] = useState("Class 12");
  const [board, setBoard] = useState("CBSE");
  const [deliveryMode, setDeliveryMode] = useState<"ONLINE" | "HYBRID" | "OFFLINE">("ONLINE");
  const [city, setCity] = useState("Prayagraj");
  const [parentConsent, setParentConsent] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [formSuccess, setFormSuccess] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Calculate pricing
  const basePrice = selectedStream === "COMMERCE" ? 4500 : scienceOption === "PCMB" ? 5900 : 5100;
  const discount = couponApplied ? 500 : 0;
  const finalPrice = Math.max(basePrice - discount, 0);
  const finalPricePaise = finalPrice * 100;

  const currentSyllabus = selectedStream === "COMMERCE" ? COMMERCE_SYLLABUS : SCIENCE_SYLLABUS;

  const submitEnquiryMutation = trpc.skillverse.submitAdmissionEnquiry.useMutation({
    onSuccess: (res) => {
      setFormSuccess(res);
      setFormError(null);
    },
    onError: (err) => {
      setFormError(err.message || "Failed to submit enquiry. Please call our admissions desk.");
    },
  });

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === "BOARD2026" || couponCode.trim().toUpperCase() === "POWER10") {
      setCouponApplied(true);
      setFormError(null);
    } else {
      setFormError("Invalid coupon code. Try 'BOARD2026' for ₹500 concession.");
    }
  };

  const handleCounsellingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !phone.trim() || !parentName.trim()) {
      setFormError("Please fill all required student and parent fields.");
      return;
    }

    const courseSlug =
      selectedStream === "COMMERCE" ? "45-day-board-exam-commerce" : "45-day-board-exam-science";

    submitEnquiryMutation.mutate({
      studentName: studentName.trim(),
      parentName: parentName.trim(),
      phone: phone.trim().replace(/\D/g, "").slice(-10),
      email: email.trim(),
      currentClass,
      board,
      preferredCourseSlug: courseSlug,
      deliveryMode,
      city: city.trim() || "Prayagraj",
      locality: "Civil Lines",
      enquirySource: "SKILLVERSE_45DAY_BOARD_PREP_PAGE",
      parentConsentAccepted: true,
      initialStage: "ENQUIRY",
    });
  };

  return (
    <div className="bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#071630] via-[#0B2247] to-[#071630] text-white pt-12 pb-20 sm:pt-16 sm:pb-28 border-b border-blue-900/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent opacity-80" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-5">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider shadow-sm animate-pulse">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span>SKILLVERSE FLAGSHIP CRASH PROGRAMME — CLASS 12 BOARDS</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none">
              45-DAY BOARD EXAM <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-lime-300">
                POWER PREPARATION
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Target <strong>90%+ in CBSE & State Board Examinations</strong> with our high-intensity,
              curriculum-aligned 45-day system. Daily live classes, formula breakdowns, 10-year PYQs,
              and 5 fully evaluated board simulations.
            </p>

            {/* Stream Selector Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedStream("COMMERCE")}
                className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                  selectedStream === "COMMERCE"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 scale-105 border-2 border-white ring-4 ring-amber-500/20"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              >
                <span>📊 Commerce Track</span>
                <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-bold">₹4,500</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStream("SCIENCE")}
                className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                  selectedStream === "SCIENCE"
                    ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 scale-105 border-2 border-white ring-4 ring-cyan-500/20"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              >
                <span>🔬 Science Track (PCM / PCB)</span>
                <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-bold">₹5,100</span>
              </button>
            </div>

            {/* Science Stream Options if Science is selected */}
            {selectedStream === "SCIENCE" && (
              <div className="flex items-center justify-center gap-2 pt-2 animate-in fade-in duration-200">
                <span className="text-xs font-bold text-slate-300">Select Stream:</span>
                {(["PCM", "PCB", "PCMB"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setScienceOption(opt)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      scienceOption === opt
                        ? "bg-cyan-400 text-slate-950 font-black shadow-sm"
                        : "bg-white/10 text-slate-300 hover:bg-white/20"
                    }`}
                  >
                    {opt} {opt === "PCMB" && "(Dual ₹5,900)"}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-3xl mx-auto text-left">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                <Clock className="w-5 h-5 text-amber-400 mb-1" />
                <div className="text-xs font-extrabold text-white">45 Days Intensive</div>
                <div className="text-[11px] text-slate-400">90–110 Teaching Hours</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                <BookOpen className="w-5 h-5 text-emerald-400 mb-1" />
                <div className="text-xs font-extrabold text-white">100% NCERT/CBSE</div>
                <div className="text-[11px] text-slate-400">All Core Subjects</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                <FileText className="w-5 h-5 text-cyan-400 mb-1" />
                <div className="text-xs font-extrabold text-white">5 Full Mocks</div>
                <div className="text-[11px] text-slate-400">Evaluated by Examiners</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                <TrendingUp className="w-5 h-5 text-purple-400 mb-1" />
                <div className="text-xs font-extrabold text-white">Target 90%+</div>
                <div className="text-[11px] text-slate-400">Answer-Writing Rubrics</div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <a
                href="#enrolment"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:opacity-95 text-white font-black text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105"
              >
                <span>⚡ ENROL NOW FOR ₹{finalPrice.toLocaleString("en-IN")}</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#counselling"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm tracking-wide border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>Book Free Academic Counselling</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROGRAMME COMPARISON & VALUE MATRIX */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Commerce */}
          <div
            className={`rounded-3xl p-6 sm:p-8 transition-all border-2 ${
              selectedStream === "COMMERCE"
                ? "bg-white border-amber-500 shadow-2xl ring-4 ring-amber-500/10"
                : "bg-white/95 border-slate-200 shadow-sm opacity-90"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
                Commerce Stream
              </span>
              <span className="text-2xl font-black text-slate-900">₹4,500</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-3">
              45-Day Commerce Power Preparation
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Class 12 CBSE & NCERT | Accountancy, Business Studies, Economics & English Core.
            </p>

            <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                <span><strong>Accountancy:</strong> Partnership adjustments, Pro-rata Shares, Cash Flow</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                <span><strong>Business Studies:</strong> Complete case-study decoding & Fayol/Taylor principles</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                <span><strong>Economics:</strong> Macroeconomics aggregates, multiplier & Indian Economy</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                <span><strong>English Core:</strong> High-scoring letter/article formats & literature extracts</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                <span><strong>5 Full Board Mocks:</strong> Evaluated with step-marking scorecards</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => {
                setSelectedStream("COMMERCE");
                const el = document.getElementById("enrolment");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-6 w-full py-2.5 rounded-xl bg-[#071630] hover:bg-amber-600 text-white text-xs font-black tracking-wide transition-colors cursor-pointer"
            >
              Choose Commerce Track (₹4,500) →
            </button>
          </div>

          {/* Card 2: Science */}
          <div
            className={`rounded-3xl p-6 sm:p-8 transition-all border-2 ${
              selectedStream === "SCIENCE"
                ? "bg-white border-blue-600 shadow-2xl ring-4 ring-blue-500/10"
                : "bg-white/95 border-slate-200 shadow-sm opacity-90"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-black uppercase tracking-wider">
                Science Stream
              </span>
              <span className="text-2xl font-black text-slate-900">
                {scienceOption === "PCMB" ? "₹5,900" : "₹5,100"}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-3">
              45-Day Science Power Preparation ({scienceOption})
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Class 12 CBSE & NCERT | Physics, Chemistry, English Core + Mathematics OR Biology.
            </p>

            <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                <span><strong>Physics:</strong> Core derivations, Gauss Law, AC resonance, Optics & Semiconductors</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                <span><strong>Chemistry:</strong> Nernst equation, Chemical kinetics, Organic named mechanisms</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                <span>
                  <strong>{scienceOption === "PCB" ? "Biology Track:" : "Mathematics Track:"}</strong>{" "}
                  {scienceOption === "PCB"
                    ? "Genetics, Reproduction, Biotechnology & Ecology diagrams"
                    : "Integration, Definite integrals, Differential equations, Vectors & 3D"}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                <span><strong>English Core:</strong> Advanced comprehension and formal writing skill masterclass</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                <span><strong>5 Full Board Mocks:</strong> Step-wise paper checking by veteran teachers</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => {
                setSelectedStream("SCIENCE");
                const el = document.getElementById("enrolment");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-6 w-full py-2.5 rounded-xl bg-[#071630] hover:bg-blue-600 text-white text-xs font-black tracking-wide transition-colors cursor-pointer"
            >
              Choose Science Track (₹5,100) →
            </button>
          </div>
        </div>
      </section>

      {/* 3. 5-PHASE ACADEMIC PLANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-blue-700" />
            <span>Structured 45-Day Roadmap</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            How You Will Cover Everything in 45 Days
          </h2>
          <p className="text-sm text-slate-600">
            A scientifically planned 5-phase preparation strategy designed to eliminate panic, solidify
            high-yield concepts, and maximize answer-writing speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {PLANNER_PHASES.map((p, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black text-blue-700 uppercase tracking-wider">
                    {p.phase}
                  </span>
                  <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-800 text-xs font-black flex items-center justify-center">
                    0{idx + 1}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{p.title}</h4>
                <div className="mt-1 mb-3 inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold">
                  {p.badge}
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {p.details.map((d, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. EXPANDABLE SUBJECT-WISE SYLLABUS CMS */}
      <section className="bg-slate-100/70 border-y border-slate-200/80 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
                Official CBSE / NCERT Syllabus Alignment
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Detailed Subject Modules & Chapter Breakdown
              </h2>
            </div>

            {/* Stream toggle buttons */}
            <div className="inline-flex rounded-xl bg-slate-200 p-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedStream("COMMERCE");
                  setExpandedSubject("Accountancy (Code 055)");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedStream === "COMMERCE"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Commerce Subjects
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedStream("SCIENCE");
                  setExpandedSubject("Physics (Code 042)");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedStream === "SCIENCE"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Science Subjects
              </button>
            </div>
          </div>

          {/* Subjects Accordion */}
          <div className="space-y-4">
            {currentSyllabus.map((subj) => {
              const isOpen = expandedSubject === subj.subject;
              return (
                <div
                  key={subj.subject}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedSubject(isOpen ? "" : subj.subject)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <span>{subj.subject}</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{subj.tagline}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-blue-700 hidden sm:inline">
                        {subj.modules.length} Modules
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subj.modules.map((m, mIdx) => (
                          <div
                            key={mIdx}
                            className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-2"
                          >
                            <h4 className="font-extrabold text-xs text-blue-900 uppercase tracking-wide">
                              {m.title}
                            </h4>
                            <ul className="space-y-1.5 text-xs text-slate-700 pl-4 list-disc">
                              {m.chapters.map((ch, chIdx) => (
                                <li key={chIdx}>{ch}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. LEARNING FACILITIES & BENEFITS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            All-Inclusive Academic Facilities
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            Everything You Need to Secure Your Best Marks
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Video className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">Daily Live Interactive Classes</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Real-time teaching with top faculty. Instant doubt clearing, whiteboard notes, and
              interactive problem-solving sessions every evening.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">Digital Notes & Formula Sheets</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Handcrafted revision booklets, rapid memory maps, and formula digests ready for download
              and mobile review before exams.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">5 Full-Length Evaluated Mocks</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Complete 3-hour board simulations evaluated by veteran CBSE markers with individual
              step-marking scorecards and actionable feedback.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">1-on-1 Faculty Doubt Clinics</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Never get stuck on numericals or derivations. Dedicated doubt hours and 24/7 LMS doubt
              submission directly reviewed by teachers.
            </p>
          </div>
        </div>
      </section>

      {/* 6. ADMISSION & RAZORPAY PAYMENT CHECKOUT */}
      <section
        id="enrolment"
        className="bg-gradient-to-br from-[#071630] via-[#0B2247] to-[#071630] text-white py-16 sm:py-24 border-y border-blue-900"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Summary */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Admission Desk</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black leading-tight">
                Secure Your Board Exam Prep Seat Today
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Complete your verified student registration. Access your Skillverse Student LMS Portal
                and live studio credentials immediately upon confirmation.
              </p>

              {/* Price Calculation Card */}
              <div className="bg-white/10 rounded-3xl border border-white/15 p-6 space-y-4 backdrop-blur-md">
                <div className="flex items-center justify-between text-xs text-slate-300 pb-3 border-b border-white/10">
                  <span>Selected Stream:</span>
                  <strong className="text-white">
                    {selectedStream === "COMMERCE" ? "Commerce Track (4 Subjects)" : `Science Track (${scienceOption})`}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 pb-3 border-b border-white/10">
                  <span>Course Fee:</span>
                  <span className="font-mono text-white">₹{basePrice.toLocaleString("en-IN")}</span>
                </div>

                {couponApplied && (
                  <div className="flex items-center justify-between text-xs text-emerald-400 pb-3 border-b border-white/10">
                    <span>Special Coupon Concession:</span>
                    <span className="font-mono font-bold">-₹{discount}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-white">Total Payable:</span>
                  <span className="text-3xl font-black text-amber-300">
                    ₹{finalPrice.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Coupon Code Input */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Coupon (e.g. BOARD2026)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={couponApplied}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white uppercase font-bold focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponApplied}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer disabled:opacity-50"
                  >
                    {couponApplied ? "Applied ✓" : "Apply"}
                  </button>
                </div>
              </div>

              {/* Security Badges */}
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Razorpay Secure 256-Bit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Official GST Tax Invoice</span>
                </div>
              </div>
            </div>

            {/* Right Column: Admission Form */}
            <div className="lg:col-span-7 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
              <h3 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                <span>Student Details & Enrolment</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  Step 1 of 2
                </span>
              </h3>

              {formSuccess && (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Admission Enquiry Registered Successfully!</span>
                  </div>
                  <p>
                    Reference Number: <strong>{formSuccess.referenceNumber}</strong>. Our senior academic
                    mentor will contact you shortly to confirm your batch allocation.
                  </p>
                </div>
              )}

              {formError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCounsellingSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Student Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aryan Sharma"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Parent / Guardian Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Sharma"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Student / Parent WhatsApp No. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. student@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Current Class / Status
                    </label>
                    <select
                      value={currentClass}
                      onChange={(e) => setCurrentClass(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Class 12">Class 12 (Appearing 2026)</option>
                      <option value="Dropper / 12th Pass">Dropper / 12th Pass</option>
                      <option value="Board Improvement">Board Improvement Candidate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      School Board
                    </label>
                    <select
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="CBSE">CBSE Board</option>
                      <option value="ISC">ISC Board</option>
                      <option value="UP Board">UP Board (State Board)</option>
                      <option value="Other Board">Other State Board</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Learning Mode
                    </label>
                    <select
                      value={deliveryMode}
                      onChange={(e) => setDeliveryMode(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="ONLINE">100% Online Live Interactive</option>
                      <option value="HYBRID">Hybrid (Live Online + Weekend Offline)</option>
                      <option value="OFFLINE">Offline Classroom (Civil Lines, Prayagraj)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City / Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Prayagraj / Lucknow"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="consentCheck"
                    checked={parentConsent}
                    onChange={(e) => setParentConsent(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="consentCheck" className="text-[11px] text-slate-600">
                    I confirm parent/guardian consent to enroll in this programme and agree to the academic
                    evaluation guidelines.
                  </label>
                </div>

                {/* Instant Razorpay Pay Now Button */}
                <div className="pt-3 space-y-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">
                        Instant Admission & LMS Activation
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Payable: <strong>₹{finalPrice.toLocaleString("en-IN")}</strong> (All 45 Days)
                      </div>
                    </div>

                    <RazorpayStandardCheckout
                      amountPaise={finalPricePaise}
                      itemName={`Skillverse 45-Day Power Prep (${selectedStream})`}
                      description={`Class 12 Board Prep (${selectedStream === "COMMERCE" ? "Commerce" : scienceOption})`}
                      customerName={studentName || "Class 12 Student"}
                      customerEmail={email || "admissions@softlabglobal.com"}
                      customerPhone={phone || "9196596975"}
                      buttonText={`Pay ₹${finalPrice.toLocaleString("en-IN")} & Activate LMS`}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md cursor-pointer transition-all hover:scale-105"
                      extraVerificationData={{
                        programme: "45_DAY_BOARD_PREP",
                        stream: selectedStream,
                        scienceOption: selectedStream === "SCIENCE" ? scienceOption : undefined,
                        parentName,
                        board,
                        currentClass,
                      }}
                      onBeforeCheckout={() => {
                        if (!studentName.trim() || !phone.trim()) {
                          setFormError("Please enter your Student Name and WhatsApp Number first.");
                          return false;
                        }
                        return true;
                      }}
                      onSuccess={(res) => {
                        setFormSuccess({
                          referenceNumber: res.orderId || "SV-CONFIRMED",
                          message: "Payment verified successfully. Welcome to Skillverse!",
                        });
                      }}
                    />
                  </div>

                  {/* Or Counselling Enquiry */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={submitEnquiryMutation.isPending}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                      <span>{submitEnquiryMutation.isPending ? "Submitting..." : "Submit Enquiry & Request Call Back"}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left font-extrabold text-sm text-slate-900 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. BOTTOM HELPLINE STRIP */}
      <section className="bg-slate-900 text-white py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="text-sm font-black text-white">
              Skillverse Academic Counselling Cell — Prayagraj
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Call our senior academic mentors for guidance on subject selection and exam blueprints.
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:+919196596975"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call +91 91965 96975</span>
            </a>
            <a
              href="https://wa.me/919196596975?text=Hello%20Skillverse%20Team,%20I%20am%20interested%20in%20the%2045-Day%20Board%20Exam%20Power%20Prep%20Programme."
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Counselor</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
