import { PrismaClient, ContentStatus } from "@prisma/client";

const db = new PrismaClient();

export interface UniversityProgramDefinition {
  title: string;
  slug: string;
  durationYears: string;
  durationWeeks: number;
  programCategory: "DIPLOMA" | "UNDERGRADUATE" | "POSTGRADUATE" | "PROFESSIONAL" | "LAW" | "RESEARCH";
  specialization?: string;
  specializations: string[];
  registrationFeePaise: number;
  examinationFeePaise: number;
  universityFeeYearPaise: number;
  lateralEntryFeePaise?: number;
  isLateralEligible?: boolean;
  admissionSession: string;
  summary: string;
  description: string;
}

export const DPGU_PROGRAMS: UniversityProgramDefinition[] = [
  {
    title: "Polytechnic Diploma",
    slug: "dpgu-polytechnic-diploma",
    durationYears: "3/2 Years",
    durationWeeks: 156,
    programCategory: "DIPLOMA",
    specialization: "Civil, ME, CS, EE",
    specializations: ["Civil Engineering", "Mechanical Engineering", "Computer Science", "Electrical Engineering"],
    registrationFeePaise: 100000, // ₹1,000
    examinationFeePaise: 100000,  // ₹1,000/sem
    universityFeeYearPaise: 3300000, // ₹33,000
    lateralEntryFeePaise: 4000000, // ₹40,000 lateral
    isLateralEligible: true,
    admissionSession: "2026",
    summary: "Technical diploma program in core engineering disciplines with regular and lateral entry pathways.",
    description: "Dr. Preeti Global University Polytechnic Diploma engineering program covering foundational and applied engineering practices across Civil, Mechanical, Computer Science, and Electrical branches.",
  },
  {
    title: "B.Tech (Bachelor of Technology)",
    slug: "dpgu-btech",
    durationYears: "4 Years",
    durationWeeks: 208,
    programCategory: "UNDERGRADUATE",
    specialization: "Civil, CS, ME, EC, EE, IT",
    specializations: ["Civil Engineering", "Computer Science", "Mechanical Engineering", "Electronics & Communication", "Electrical Engineering", "Information Technology"],
    registrationFeePaise: 100000, // ₹1,000
    examinationFeePaise: 100000,  // ₹1,000/sem
    universityFeeYearPaise: 7420000, // ₹74,200
    lateralEntryFeePaise: 6000000, // ₹60,000 lateral
    isLateralEligible: true,
    admissionSession: "2026",
    summary: "Four-year undergraduate degree program in advanced engineering and technology.",
    description: "Four-year undergraduate B.Tech program offered by Dr. Preeti Global University in Civil, CS, ME, EC, EE, and IT disciplines, preparing industry-ready engineers.",
  },
  {
    title: "M.Tech (Master of Technology)",
    slug: "dpgu-mtech",
    durationYears: "2 Years",
    durationWeeks: 104,
    programCategory: "POSTGRADUATE",
    specializations: ["Computer Science", "VLSI Design", "Structural Engineering", "Thermal Engineering"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 7420000, // ₹74,200
    admissionSession: "2026",
    summary: "Two-year postgraduate engineering degree emphasizing advanced technical mastery and research.",
    description: "Postgraduate degree in engineering designed to build advanced technical research and specialized industry leadership skills.",
  },
  {
    title: "B.Pharma (Bachelor of Pharmacy)",
    slug: "dpgu-bpharma",
    durationYears: "4 Years",
    durationWeeks: 208,
    programCategory: "PROFESSIONAL",
    specialization: "Pharmacy",
    specializations: ["Pharmaceutical Chemistry", "Pharmaceutics", "Pharmacology", "Pharmacognosy"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 10220000, // ₹102,200
    admissionSession: "2026",
    summary: "Comprehensive 4-year professional pharmacy program covering pharmaceutical sciences.",
    description: "Undergraduate degree program in pharmacy conferring thorough clinical, industrial, and regulatory pharmacology competence.",
  },
  {
    title: "D.Pharma (Diploma in Pharmacy)",
    slug: "dpgu-dpharma",
    durationYears: "2 Years",
    durationWeeks: 104,
    programCategory: "DIPLOMA",
    specialization: "Pharmacy",
    specializations: ["Community Pharmacy", "Hospital Pharmacy"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 13020000, // ₹130,200
    admissionSession: "2026",
    summary: "Two-year foundational diploma program for registered pharmacy practice.",
    description: "Foundational diploma in pharmaceutical sciences qualifying candidates for registered pharmacist practice in retail, hospital, and clinical setups.",
  },
  {
    title: "BBA (Bachelor of Business Administration)",
    slug: "dpgu-bba",
    durationYears: "3 Years",
    durationWeeks: 156,
    programCategory: "UNDERGRADUATE",
    specializations: ["Marketing", "Finance", "Human Resource Management"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 2520000, // ₹25,200
    admissionSession: "2026",
    summary: "Undergraduate business administration degree providing comprehensive corporate fundamentals.",
    description: "Three-year undergraduate management degree offering practical exposure in corporate administration, financial management, and organizational marketing.",
  },
  {
    title: "MBA (Master of Business Administration)",
    slug: "dpgu-mba",
    durationYears: "2 Years",
    durationWeeks: 104,
    programCategory: "POSTGRADUATE",
    specialization: "Marketing, HR, Finance, Hospital Management, Hotel Management",
    specializations: ["Marketing", "HR", "Finance", "Hospital Management", "Hotel Management"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 7420000, // ₹74,200
    admissionSession: "2026",
    summary: "Two-year premier postgraduate management degree with dual specialization options.",
    description: "Postgraduate master's degree in business administration delivering strategic leadership competencies across Marketing, HR, Finance, Hospital Management, and Hotel Management.",
  },
  {
    title: "B.Com (Honours)",
    slug: "dpgu-bcom-honours",
    durationYears: "4/3 Years",
    durationWeeks: 156,
    programCategory: "UNDERGRADUATE",
    specialization: "Honours",
    specializations: ["Accounting", "Financial Markets", "Corporate Tax"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 1540000, // ₹15,400
    admissionSession: "2026",
    summary: "Undergraduate commerce degree specializing in accounting, corporate finance, and business law.",
    description: "Specialized commerce program with intensive exposure in financial accounting, auditing, taxation, and corporate governance.",
  },
  {
    title: "B.Com (Computer Application)",
    slug: "dpgu-bcom-ca",
    durationYears: "4/3 Years",
    durationWeeks: 156,
    programCategory: "UNDERGRADUATE",
    specialization: "Computer Application",
    specializations: ["Computerized Accounting", "E-Commerce Systems", "ERP Systems"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 1540000, // ₹15,400
    admissionSession: "2026",
    summary: "Hybrid commerce degree blending financial accounting with business computing systems.",
    description: "Interdisciplinary commerce degree designed to equip students with digital accounting, computerized taxation, and database management for modern financial institutions.",
  },
  {
    title: "M.Com (Master of Commerce)",
    slug: "dpgu-mcom",
    durationYears: "2 Years",
    durationWeeks: 104,
    programCategory: "POSTGRADUATE",
    specialization: "Commerce",
    specializations: ["Advanced Accounting", "Taxation", "Banking & Financial Services"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 2100000, // ₹21,000
    admissionSession: "2026",
    summary: "Two-year postgraduate degree in corporate commerce, financial analytics, and economic planning.",
    description: "Advanced commerce master's program preparing scholars for financial analysis, corporate taxation, and academic careers.",
  },
  {
    title: "B.Sc (Bachelor of Science)",
    slug: "dpgu-bsc",
    durationYears: "4/3 Years",
    durationWeeks: 156,
    programCategory: "UNDERGRADUATE",
    specialization: "PCM, CBZ, Computer, Biotech, Microbiology, Forensic Science, Home Science",
    specializations: ["PCM", "CBZ", "Computer", "Biotech", "Microbiology", "Forensic Science", "Home Science"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 1820000, // ₹18,200
    admissionSession: "2026",
    summary: "Undergraduate degree across pure, applied, and forensic scientific disciplines.",
    description: "Comprehensive Bachelor of Science degree providing hands-on laboratory research and scientific theory in PCM, CBZ, Biotech, Microbiology, Computer Science, and Forensic Sciences.",
  },
  {
    title: "M.Sc (Master of Science)",
    slug: "dpgu-msc",
    durationYears: "2 Years",
    durationWeeks: 104,
    programCategory: "POSTGRADUATE",
    specialization: "Math, Physics, Chemistry, Zoology, Botany, CS, Bio-Tech, Microbiology, Forensic Science",
    specializations: ["Math", "Physics", "Chemistry", "Zoology", "Botany", "CS", "Bio-Tech", "Microbiology", "Forensic Science"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 1820000, // ₹18,200
    admissionSession: "2026",
    summary: "Postgraduate science degree in pure, computational, and life science domains.",
    description: "Two-year research-oriented Master of Science program focusing on advanced laboratory practice, computational algorithms, and applied scientific research.",
  },
  {
    title: "DCA (Diploma in Computer Applications)",
    slug: "dpgu-dca",
    durationYears: "1 Year",
    durationWeeks: 52,
    programCategory: "DIPLOMA",
    specialization: "DCA",
    specializations: ["Office Automation", "Database Basics", "Web Essentials"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 2100000, // ₹21,000
    admissionSession: "2026",
    summary: "One-year foundational diploma program covering essential computing applications.",
    description: "Practical one-year diploma offering fundamentals of digital workplace computing, database operations, operating systems, and internet tools.",
  },
  {
    title: "BCA (Bachelor of Computer Applications)",
    slug: "dpgu-bca",
    durationYears: "4/3 Years",
    durationWeeks: 156,
    programCategory: "UNDERGRADUATE",
    specialization: "BCA",
    specializations: ["Software Engineering", "Cloud Computing", "Web Technologies"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 2250000, // ₹22,500
    admissionSession: "2026",
    summary: "Undergraduate degree in software development, data structures, and enterprise programming.",
    description: "Premier computer applications undergraduate program offering rigorous training in modern programming languages, database architectures, and web application stacks.",
  },
  {
    title: "PGDCA (Post Graduate Diploma in Computer Applications)",
    slug: "dpgu-pgdca",
    durationYears: "1 Year",
    durationWeeks: 52,
    programCategory: "DIPLOMA",
    specialization: "PGDCA",
    specializations: ["Advanced Computing", "RDBMS", "Full Stack Basics"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 2100000, // ₹21,000
    admissionSession: "2026",
    summary: "One-year intensive postgraduate computer diploma for graduates of all streams.",
    description: "Accelerated postgraduate diploma preparing candidates for enterprise IT systems, system administration, and software maintenance.",
  },
  {
    title: "MCA (Master of Computer Applications)",
    slug: "dpgu-mca",
    durationYears: "2 Years",
    durationWeeks: 104,
    programCategory: "POSTGRADUATE",
    specialization: "MCA",
    specializations: ["Cloud & DevOps", "Full Stack Development", "Artificial Intelligence & Data"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 4620000, // ₹46,200
    admissionSession: "2026",
    summary: "Two-year postgraduate computer application degree focusing on modern enterprise software engineering.",
    description: "Advanced master's degree in software engineering, distributed systems, algorithms, cloud platforms, and enterprise system design.",
  },
  {
    title: "M.A (Master of Arts)",
    slug: "dpgu-ma",
    durationYears: "2 Years",
    durationWeeks: 104,
    programCategory: "POSTGRADUATE",
    specialization: "History, Geography, Economics, Political Science, Sociology, Psychology, Hindi, English",
    specializations: ["History", "Geography", "Economics", "Political Science", "Sociology", "Psychology", "Hindi", "English"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 1820000, // ₹18,200
    admissionSession: "2026",
    summary: "Two-year postgraduate humanities degree across literature, social sciences, and language studies.",
    description: "Comprehensive Master of Arts program fostering critical inquiry, analytical writing, and research in social sciences and languages.",
  },
  {
    title: "B.A (Bachelor of Arts)",
    slug: "dpgu-ba",
    durationYears: "4/3 Years",
    durationWeeks: 156,
    programCategory: "UNDERGRADUATE",
    specializations: ["General Humanities", "Social Sciences", "Languages"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 1540000, // ₹15,400
    admissionSession: "2026",
    summary: "Undergraduate degree in liberal arts, social sciences, and literary studies.",
    description: "Broad-based undergraduate education in history, political science, literature, and sociology developing strong communication and critical thinking capabilities.",
  },
  {
    title: "B.Ed (Bachelor of Education)",
    slug: "dpgu-bed",
    durationYears: "2 Years",
    durationWeeks: 104,
    programCategory: "PROFESSIONAL",
    specializations: ["Pedagogy of Science", "Pedagogy of Languages", "Pedagogy of Social Sciences"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 10220000, // ₹102,200
    admissionSession: "2026",
    summary: "Professional teaching education degree for secondary and higher secondary school educators.",
    description: "NCTE-aligned professional teacher education program developing pedagogical methodology, educational psychology, and classroom instructional management.",
  },
  {
    title: "M.A in Education",
    slug: "dpgu-ma-education",
    durationYears: "2 Years",
    durationWeeks: 104,
    programCategory: "POSTGRADUATE",
    specialization: "Education",
    specializations: ["Educational Administration", "Curriculum Development", "Educational Technology"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 2520000, // ₹25,200
    admissionSession: "2026",
    summary: "Two-year postgraduate degree exploring educational leadership, curriculum design, and policy.",
    description: "Master's program in educational sciences examining educational philosophy, institutional management, assessment frameworks, and instructional innovation.",
  },
  {
    title: "LLB (Bachelor of Legislative Law)",
    slug: "dpgu-llb",
    durationYears: "3 Years",
    durationWeeks: 156,
    programCategory: "LAW",
    specializations: ["Constitutional Law", "Criminal Law", "Corporate & Commercial Law"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 5320000, // ₹53,200
    admissionSession: "2026",
    summary: "Three-year professional law degree for graduates pursuing legal practice and corporate advocacy.",
    description: "Bar-oriented professional legal education covering jurisprudence, constitutional litigation, civil/criminal procedure, and court advocacy.",
  },
  {
    title: "BA-LLB (Integrated Bachelor of Law)",
    slug: "dpgu-ba-llb",
    durationYears: "5 Years",
    durationWeeks: 260,
    programCategory: "LAW",
    specializations: ["Integrated Constitutional Law", "Corporate Law", "Intellectual Property Rights"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 3920000, // ₹39,200
    admissionSession: "2026",
    summary: "Five-year integrated dual degree combining liberal arts fundamentals with rigorous legal education.",
    description: "Five-year comprehensive integrated program combining political science, economics, and sociology with core legal jurisprudence and moot court advocacy.",
  },
  {
    title: "LLM (Master of Laws)",
    slug: "dpgu-llm",
    durationYears: "2 Years",
    durationWeeks: 104,
    programCategory: "LAW",
    specializations: ["Corporate & Commercial Law", "Constitutional Law", "International Law"],
    registrationFeePaise: 100000,
    examinationFeePaise: 100000,
    universityFeeYearPaise: 5320000, // ₹53,200
    admissionSession: "2026",
    summary: "Two-year postgraduate master's degree in specialized legal doctrines and judicial research.",
    description: "Advanced legal master's degree offering specialized scholarship in corporate litigation, human rights, comparative constitutional law, and academic jurisprudence.",
  },
  {
    title: "Ph.D — Technical (Doctor of Philosophy)",
    slug: "dpgu-phd-technical",
    durationYears: "3 Years",
    durationWeeks: 156,
    programCategory: "RESEARCH",
    specialization: "Engineering, Pharma, Education, LAW, Management",
    specializations: ["Engineering", "Pharma", "Education", "LAW", "Management"],
    registrationFeePaise: 0, // All included
    examinationFeePaise: 0,  // All included
    universityFeeYearPaise: 21000000, // ₹210,000 (All included)
    admissionSession: "2026",
    summary: "Doctoral research program across technical, pharmaceutical, legal, and management disciplines.",
    description: "Rigorous doctoral research degree conferring terminal research scholarship in Engineering, Pharmaceutical Sciences, Legal Studies, Education, and Strategic Management.",
  },
  {
    title: "Ph.D — Non-Technical (Doctor of Philosophy)",
    slug: "dpgu-phd-non-technical",
    durationYears: "3 Years",
    durationWeeks: 156,
    programCategory: "RESEARCH",
    specialization: "ART, Science, Others",
    specializations: ["ART", "Science", "Others"],
    registrationFeePaise: 0, // All included
    examinationFeePaise: 0,  // All included
    universityFeeYearPaise: 16800000, // ₹168,000 (All included)
    admissionSession: "2026",
    summary: "Doctoral research program in humanities, natural sciences, and interdisciplinary fields.",
    description: "Terminal doctoral research degree supporting pioneering scholarly inquiry in Arts, Pure Sciences, and interdisciplinary social sciences.",
  },
];

async function main() {
  console.log("Seeding Dr. Preeti Global University Partner Programs into database...");

  let createdCount = 0;
  let updatedCount = 0;

  for (const prog of DPGU_PROGRAMS) {
    const existing = await db.course.findUnique({ where: { slug: prog.slug } });

    await db.course.upsert({
      where: { slug: prog.slug },
      update: {
        title: prog.title,
        summary: prog.summary,
        description: prog.description,
        durationWeeks: prog.durationWeeks,
        durationYears: prog.durationYears,
        baseFee: prog.universityFeeYearPaise, // Annual base fee in Paise
        providerType: "UNIVERSITY",
        providerName: "Dr. Preeti Global University",
        universityName: "Dr. Preeti Global University",
        specialization: prog.specialization || prog.specializations.join(", "),
        specializations: prog.specializations,
        programCategory: prog.programCategory,
        admissionSession: prog.admissionSession,
        registrationFee: prog.registrationFeePaise,
        examinationFee: prog.examinationFeePaise,
        universityFeeYear: prog.universityFeeYearPaise,
        lateralEntryFee: prog.lateralEntryFeePaise || 0,
        isLateralEligible: prog.isLateralEligible || false,
        status: ContentStatus.PUBLISHED,
      },
      create: {
        title: prog.title,
        slug: prog.slug,
        summary: prog.summary,
        description: prog.description,
        durationWeeks: prog.durationWeeks,
        durationYears: prog.durationYears,
        baseFee: prog.universityFeeYearPaise,
        providerType: "UNIVERSITY",
        providerName: "Dr. Preeti Global University",
        universityName: "Dr. Preeti Global University",
        specialization: prog.specialization || prog.specializations.join(", "),
        specializations: prog.specializations,
        programCategory: prog.programCategory,
        admissionSession: prog.admissionSession,
        registrationFee: prog.registrationFeePaise,
        examinationFee: prog.examinationFeePaise,
        universityFeeYear: prog.universityFeeYearPaise,
        lateralEntryFee: prog.lateralEntryFeePaise || 0,
        isLateralEligible: prog.isLateralEligible || false,
        status: ContentStatus.PUBLISHED,
      },
    });

    if (existing) {
      updatedCount++;
    } else {
      createdCount++;
    }
  }

  // Verify that all 21 SoftLab Global courses have providerType="SOFTLAB" and providerName="SoftLab Global"
  await db.course.updateMany({
    where: {
      providerType: null,
    },
    data: {
      providerType: "SOFTLAB",
      providerName: "SoftLab Global",
    },
  });

  const softlabCourses = await db.course.count({ where: { providerType: "SOFTLAB" } });
  const universityPrograms = await db.course.count({ where: { providerType: "UNIVERSITY" } });

  console.log("Seeding complete!");
  console.log({
    createdCount,
    updatedCount,
    totalSoftLabCourses: softlabCourses,
    totalUniversityPrograms: universityPrograms,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    process.exit(0);
  });
