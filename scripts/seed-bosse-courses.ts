import { PrismaClient, ContentStatus } from "@prisma/client";

const db = new PrismaClient();

const BOSSE_COURSES = [
  {
    title: "BOSSE Class 10th (Secondary School Examination)",
    slug: "bosse-secondary-10th",
    summary:
      "Govt. of Sikkim Recognized Secondary (10th) Board Examination with Transfer of Credit (TOC), flexible subjects, and all-inclusive fee structure.",
    description: `The Board of Open Schooling and Skill Education (BOSSE), Sikkim is an open schooling board established under Act No. 14 of 2020 of the Sikkim Legislative Assembly. 
Recognized by the Council of Boards of School Education in India (COBSE) and Association of Indian Universities (AIU), BOSSE Secondary (Class 10th) certificates are equivalent to CBSE, ICSE, and state boards across India.

Complete All-Inclusive Package: ₹36,500 (No extra charges for Registration, Examination Fee, 5 Subjects Tuition, Practicals, Transfer of Credit (TOC), Migration Certificate, Marksheet & Verification, and Study Material).`,
    durationWeeks: 40,
    durationYears: "1 Year",
    baseFee: 3650000, // ₹36,500 in Paise
    level: "Secondary School (Class 10th)",
    language: "Hindi / English / Regional",
    eligibility: "Minimum 14 years of age; basic literacy and age proof.",
    status: ContentStatus.PUBLISHED,
    sortOrder: 101,
    providerType: "BOARD",
    providerName: "Board of Open Schooling and Skill Education (BOSSE)",
    universityName: "Board of Open Schooling and Skill Education, Sikkim",
    programCategory: "SECONDARY",
    admissionSession: "2026-27",
    registrationFee: 0,
    examinationFee: 0,
    universityFeeYear: 3650000,
    specialization: "Hindi, English, Mathematics, Science & Tech, Social Science, Economics, Business Studies, Home Science, Data Entry",
    specializations: [
      "Hindi (201)",
      "English (202)",
      "Mathematics (211)",
      "Science and Technology (212)",
      "Social Science (213)",
      "Economics (214)",
      "Business Studies (215)",
      "Home Science (216)",
      "Data Entry Operations (229)",
    ],
    mode: "HYBRID",
    branch: "Civil Lines, Prayagraj",
    placementInfo: "Valid for Class 11th/12th Admissions, Polytechnic Diplomas, ITI, Govt. Jobs, and Indian Passport",
  },
  {
    title: "BOSSE Class 12th - Science Stream (Senior Secondary)",
    slug: "bosse-senior-secondary-12th-science",
    summary:
      "Recognized Senior Secondary (12th) Science stream with Physics, Chemistry, Biology/Mathematics, full lab practicals, and competitive exam eligibility (NEET/JEE).",
    description: `BOSSE Senior Secondary Science stream empowers students to complete Class 12th with full practical lab sessions, Transfer of Credit (TOC) options, and comprehensive academic support.
Recognized by AIU, COBSE, and Pharmacy Council of India (PCI). Eligible for NEET, JEE Mains, NDA, Defence, and Higher University Degrees.

Complete All-Inclusive Package: ₹39,500 (No extra charges for Registration, Examination Fee, Physics/Chemistry/Biology/Computer Practicals, Lab Sessions, TOC, Migration Certificate, Marksheet & Verification).`,
    durationWeeks: 40,
    durationYears: "1 Year",
    baseFee: 3950000, // ₹39,500 in Paise
    level: "Senior Secondary (Class 12th Science)",
    language: "Hindi / English",
    eligibility: "Passed Class 10th (Secondary) from any recognized Board.",
    status: ContentStatus.PUBLISHED,
    sortOrder: 102,
    providerType: "BOARD",
    providerName: "Board of Open Schooling and Skill Education (BOSSE)",
    universityName: "Board of Open Schooling and Skill Education, Sikkim",
    programCategory: "SENIOR_SECONDARY",
    admissionSession: "2026-27",
    registrationFee: 0,
    examinationFee: 0,
    universityFeeYear: 3950000,
    specialization: "Physics, Chemistry, Biology, Mathematics, Computer Science, English",
    specializations: [
      "Physics (312 - Theory + Practical)",
      "Chemistry (313 - Theory + Practical)",
      "Biology (314 - Theory + Practical)",
      "Mathematics (311)",
      "Computer Science (330 - Theory + Practical)",
      "English (302)",
    ],
    mode: "HYBRID",
    branch: "Civil Lines, Prayagraj",
    placementInfo: "Eligible for NEET, JEE, B.Tech, MBBS, B.Sc, BCA, Defence, NDA, and Central Govt. Examinations",
  },
  {
    title: "BOSSE Class 12th - Commerce Stream (Senior Secondary)",
    slug: "bosse-senior-secondary-12th-commerce",
    summary:
      "Recognized Senior Secondary (12th) Commerce stream covering Accountancy, Business Studies, Economics, project assessments, and career counseling for B.Com/BBA/CA Foundation.",
    description: `BOSSE Senior Secondary Commerce stream provides deep understanding of financial accounting, business organization, economics, and commercial computing.
Recognized across India by AIU and COBSE for direct admission into B.Com, BBA, CA Foundation, CS, CMA, Banking, and Law programs.

Complete All-Inclusive Package: ₹37,500 (No extra charges for Registration, Examination Fee, Commerce Practical & Project Evaluation, TOC, Migration Certificate, Marksheet & Verification).`,
    durationWeeks: 40,
    durationYears: "1 Year",
    baseFee: 3750000, // ₹37,500 in Paise
    level: "Senior Secondary (Class 12th Commerce)",
    language: "Hindi / English",
    eligibility: "Passed Class 10th (Secondary) from any recognized Board.",
    status: ContentStatus.PUBLISHED,
    sortOrder: 103,
    providerType: "BOARD",
    providerName: "Board of Open Schooling and Skill Education (BOSSE)",
    universityName: "Board of Open Schooling and Skill Education, Sikkim",
    programCategory: "SENIOR_SECONDARY",
    admissionSession: "2026-27",
    registrationFee: 0,
    examinationFee: 0,
    universityFeeYear: 3750000,
    specialization: "Accountancy, Business Studies, Economics, Mathematics, English, Data Entry",
    specializations: [
      "Accountancy (320)",
      "Business Studies (319)",
      "Economics (318)",
      "Mathematics (311)",
      "English (302)",
      "Data Entry Operations (336)",
    ],
    mode: "HYBRID",
    branch: "Civil Lines, Prayagraj",
    placementInfo: "Eligible for B.Com, BBA, CA/CS Foundation, IPMAT, Banking Exams, and Commercial Careers",
  },
  {
    title: "BOSSE Class 12th - Arts & Humanities (Senior Secondary)",
    slug: "bosse-senior-secondary-12th-arts",
    summary:
      "Recognized Senior Secondary (12th) Arts stream with History, Political Science, Geography, Sociology, and Economics for competitive exam foundations and university degrees.",
    description: `BOSSE Senior Secondary Arts and Humanities offers flexible subject combinations for students preparing for civil services, law entrance (CLAT), BA degrees, and government job eligibility.
Recognized by AIU and COBSE; eligible for all university admissions across India.

Complete All-Inclusive Package: ₹36,500 (No extra charges for Registration, Examination Fee, Practical/Project assessments, TOC, Migration Certificate, Marksheet & Verification).`,
    durationWeeks: 40,
    durationYears: "1 Year",
    baseFee: 3650000, // ₹36,500 in Paise
    level: "Senior Secondary (Class 12th Arts)",
    language: "Hindi / English",
    eligibility: "Passed Class 10th (Secondary) from any recognized Board.",
    status: ContentStatus.PUBLISHED,
    sortOrder: 104,
    providerType: "BOARD",
    providerName: "Board of Open Schooling and Skill Education (BOSSE)",
    universityName: "Board of Open Schooling and Skill Education, Sikkim",
    programCategory: "SENIOR_SECONDARY",
    admissionSession: "2026-27",
    registrationFee: 0,
    examinationFee: 0,
    universityFeeYear: 3650000,
    specialization: "History, Political Science, Geography, Sociology, Economics, Hindi, English",
    specializations: [
      "History (315)",
      "Political Science (317)",
      "Geography (316 - Theory + Practical)",
      "Sociology (331)",
      "Economics (318)",
      "Hindi (301)",
      "English (302)",
    ],
    mode: "HYBRID",
    branch: "Civil Lines, Prayagraj",
    placementInfo: "Eligible for BA, B.A. LL.B, UPSC/SSC Foundations, State PCS, Teaching, and Defence Services",
  },
];

async function main() {
  console.log("Seeding BOSSE Board 10th and 12th Academic Programs into LMS...");

  for (const course of BOSSE_COURSES) {
    const upserted = await db.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        summary: course.summary,
        description: course.description,
        durationWeeks: course.durationWeeks,
        durationYears: course.durationYears,
        baseFee: course.baseFee,
        level: course.level,
        language: course.language,
        eligibility: course.eligibility,
        status: course.status,
        sortOrder: course.sortOrder,
        providerType: course.providerType,
        providerName: course.providerName,
        universityName: course.universityName,
        programCategory: course.programCategory,
        admissionSession: course.admissionSession,
        registrationFee: course.registrationFee,
        examinationFee: course.examinationFee,
        universityFeeYear: course.universityFeeYear,
        specialization: course.specialization,
        specializations: course.specializations,
        mode: course.mode,
        branch: course.branch,
        placementInfo: course.placementInfo,
      },
      create: {
        ...course,
      },
    });

    console.log(`✓ Synchronized course: ${upserted.title} [${upserted.slug}] — Fee: ₹${upserted.baseFee / 100}`);
  }

  const count = await db.course.count({
    where: { providerName: { contains: "BOSSE" } },
  });
  console.log(`Done! Total BOSSE courses active in LMS: ${count}`);
}

main()
  .catch((e) => {
    console.error("Error seeding BOSSE courses:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
