import * as fs from "fs";
import * as path from "path";

interface Page {
  page: number;
  text: string;
}

const pages: Page[] = JSON.parse(
  fs.readFileSync("scratch/curriculum-pages.json", "utf8")
);

const COURSE_DEFINITIONS = [
  { slug: "cpp-programming-complete-course", title: "C++ Programming Complete Course (Basic To Advanced)", start: 1, end: 11, flyer: "/courses/cpp-programming-brochure.jpg" },
  { slug: "certificate-in-advance-networking", title: "Certificate in Advanced Networking Program (Master Level)", start: 12, end: 23, flyer: "/courses/networking-brochure.jpg" },
  { slug: "certificate-in-cloud-computing-and-cyber-security-with-ai", title: "Certificate in Cloud Computing & Cyber Security with AI (Expert Master Level)", start: 24, end: 38, flyer: "/courses/cloud-cyber-ai-brochure.jpg" },
  { slug: "certificate-in-office-365-admin", title: "Certificate in Microsoft Office 365 Administration Program (Master Level)", start: 39, end: 51, flyer: "/courses/office-365-brochure.jpg" },
  { slug: "cyber-security-complete-course", title: "Cyber Security Complete Course (Master Level)", start: 52, end: 63, flyer: "/courses/cyber-security-brochure.jpg" },
  { slug: "data-science-master-level", title: "Data Science (Master Level) Complete Course", start: 64, end: 77, flyer: "/courses/data-science-brochure.jpg" },
  { slug: "digital-marketing-master-class", title: "Digital Marketing (Master Level) Complete Course", start: 78, end: 88, flyer: "/courses/digital-marketing-brochure.jpg" },
  { slug: "full-web-development", title: "Master Full Web Development Program (Beginner to Advanced Level)", start: 89, end: 96, flyer: "/courses/web-development-brochure.jpg" },
  { slug: "graphics-designing-master-level", title: "Graphics Designing (Master Level) Complete Course", start: 97, end: 104, flyer: "/courses/graphics-designing-brochure.jpg" },
  { slug: "java-full-stack-developer", title: "Master Java Full Stack Developer Program (Beginner to Advanced Expert Level)", start: 105, end: 118, flyer: "/courses/java-full-stack-brochure.jpg" },
  { slug: "master-in-cloud-administration", title: "Master Cloud Administration Program (Expert Master Level)", start: 119, end: 132, flyer: "/courses/cloud-admin-brochure.jpg" },
  { slug: "master-in-artificial-intelligence-and-machine-learning", title: "Master Artificial Intelligence & Machine Learning Program (Master Level)", start: 133, end: 146, flyer: "/courses/ai-ml-brochure.jpg" },
  { slug: "master-in-linux-administration", title: "Master Linux Administration Program (Expert Master Level)", start: 147, end: 162, flyer: "/courses/linux-admin-brochure.jpg" },
  { slug: "master-in-server-administration", title: "Master Server Administration Program (Expert Master Level)", start: 163, end: 176, flyer: "/courses/server-admin-brochure.jpg" },
  { slug: "certificate-in-c-language", title: "Master-Level Certificate in C Language", start: 177, end: 180, flyer: "/courses/c-programming-brochure.jpg" },
  { slug: "mern-full-stack-developer", title: "Master MERN Full Stack Developer Program (Beginner to Advanced Expert Level)", start: 181, end: 195, flyer: "/courses/mern-full-stack-brochure.jpg" },
  { slug: "mysql-advanced-course", title: "MySQL Advanced Course (Beginner To Expert)", start: 196, end: 206, flyer: "/courses/mysql-brochure.jpg" },
  { slug: "oracle-database-administration-dba", title: "Oracle Database Administration (DBA) with Oracle Cloud Integration", start: 207, end: 219, flyer: "/courses/oracle-dba-brochure.jpg" },
  { slug: "python-full-stack-developer", title: "Master Python Full Stack Developer Program (Beginner to Advanced Expert Level)", start: 220, end: 234, flyer: "/courses/python-full-stack-brochure.jpg" },
  { slug: "certificate-in-cloud-computing-with-devops", title: "Master DevOps Engineer (Master Level)", start: 235, end: 243, flyer: "/courses/devops-brochure.jpg" },
  { slug: "technical-support-engineer", title: "Technical Support Engineer (Master Level)", start: 244, end: 253, flyer: "/courses/technical-support-brochure.jpg" },
];

function cleanLine(l: string): string {
  return l
    .replace(/[\uF0B7\u2022\u25CF\uFEFF]/g, "")
    .replace(/^[-–—o•*]\s*/, "")
    .trim();
}

function parseCourse(def: typeof COURSE_DEFINITIONS[0]) {
  const coursePages = pages.filter((p) => p.page >= def.start && p.page <= def.end);
  const rawText = coursePages.map((p) => p.text).join("\n");
  const rawLines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  const modules: { title: string; topics: string[]; labs: string[] }[] = [];
  let currentMod: { title: string; topics: string[]; labs: string[] } | null = null;
  let inLab = false;

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];
    const cleaned = cleanLine(line);

    // Skip standalone bullet characters or noise
    if (!cleaned || cleaned.length < 2) continue;
    if (cleaned.startsWith("Page ") || cleaned.startsWith("Softlab Global") || cleaned.startsWith("Duration:")) continue;

    // Detect Module / Phase header
    const modMatch = line.match(/^(?:Module|Phase|MONTH|Month)\s+(\d+)[:\s–—-]+(.*)/i);
    if (modMatch) {
      inLab = false;
      let titlePart = (modMatch[2] || "").trim();
      // Look ahead to check if title was wrapped to next line (e.g. "(Master" -> "Level)")
      let nextIdx = i + 1;
      while (nextIdx < rawLines.length) {
        const nextClean = cleanLine(rawLines[nextIdx]);
        if (
          nextClean.startsWith("Level)") ||
          nextClean.startsWith("Program") ||
          nextClean.startsWith("Engineering") ||
          nextClean.startsWith("Administration") ||
          nextClean.startsWith("Developer") ||
          nextClean.startsWith("Architecture") ||
          nextClean.startsWith("Fundamentals") && !nextClean.includes(":")
        ) {
          titlePart += " " + nextClean;
          i = nextIdx;
          nextIdx++;
        } else {
          break;
        }
      }

      // Clean titlePart: remove "Module X:" if duplicated, strip leading colons
      titlePart = titlePart.replace(/^[:\s–—-]+/, "").trim();
      if (!titlePart) {
        titlePart = `Module ${modMatch[1]}`;
      }

      // Strip redundant "MODULE \d+:" from the title so it's clean (e.g. "Computer Hardware (Master Level)")
      titlePart = titlePart.replace(/^(?:Module|Phase|MONTH|Month)\s+\d+[:\s–—-]*/i, "").trim();

      currentMod = {
        title: titlePart,
        topics: [],
        labs: [],
      };
      modules.push(currentMod);
      continue;
    }

    if (!currentMod) continue;

    // Check for Practical / Lab / Projects header
    if (/^(practical|labs?|hands-on|projects?)\b/i.test(cleaned)) {
      inLab = true;
      continue;
    }

    if (inLab) {
      if (!currentMod.labs.includes(cleaned)) {
        currentMod.labs.push(cleaned);
      }
    } else {
      if (!currentMod.topics.includes(cleaned)) {
        currentMod.topics.push(cleaned);
      }
    }
  }

  return {
    slug: def.slug,
    title: def.title,
    moduleCount: modules.length,
    modules: modules.map((m) => ({
      title: m.title,
      topicsCount: m.topics.length,
      topicsSample: m.topics.slice(0, 4),
    })),
  };
}

console.log("=== TESTING CURRICULUM PARSING FOR 21 COURSES ===");
for (const def of COURSE_DEFINITIONS.slice(0, 3)) {
  const parsed = parseCourse(def);
  console.log(`\n[${parsed.slug}] Modules: ${parsed.moduleCount}`);
  for (const m of parsed.modules.slice(0, 4)) {
    console.log(`  - "${m.title}" -> ${m.topicsCount} topics: ${m.topicsSample.join(" | ")}`);
  }
}

// Test technical-support-engineer specifically
const tech = parseCourse(COURSE_DEFINITIONS.find((d) => d.slug === "technical-support-engineer")!);
console.log(`\n[technical-support-engineer] Modules: ${tech.moduleCount}`);
for (const m of tech.modules) {
  console.log(`  - "${m.title}" -> ${m.topicsCount} topics: ${m.topicsSample.join(" | ")}`);
}
