"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPaiseToRupees } from "@/lib/utils";
import { openCareerCounselingModal } from "@/components/public/career-counseling-modal";
import {
  Clock,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  Brain,
  Shield,
  Cloud,
  Terminal,
  Database,
  Smartphone,
  CheckCircle2,
  TrendingUp,
  Layers,
  Code2,
  FileCheck,
} from "lucide-react";

export interface PublicCourseData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  durationWeeks: number;
  baseFee: number;
  level: string | null;
  language: string | null;
  eligibility?: string | null;
  thumbnailUrl?: string | null;
}

interface CourseCardProps {
  course: PublicCourseData;
}

interface CourseMetadata {
  technologies: string[];
  careerOutcome: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

function getCourseMetadata(slug: string, title: string): CourseMetadata {
  const key = (slug + " " + title).toLowerCase();

  if (key.includes("ai") || key.includes("machine learning")) {
    return {
      technologies: ["Python", "PyTorch", "LangChain", "Generative AI", "RAG"],
      careerOutcome: "AI / Machine Learning Engineer",
      icon: Brain,
      gradient: "from-emerald-950 via-teal-950 to-slate-950",
    };
  }
  if (key.includes("data science")) {
    return {
      technologies: ["Pandas", "Scikit-Learn", "PySpark", "Power BI", "SQL"],
      careerOutcome: "Data Scientist / ML Specialist",
      icon: Database,
      gradient: "from-cyan-950 via-teal-950 to-slate-950",
    };
  }
  if (key.includes("cyber") || key.includes("security") || key.includes("hacking")) {
    return {
      technologies: ["Kali Linux", "Wireshark", "Metasploit", "Burp Suite", "SIEM"],
      careerOutcome: "Cyber Security / SOC Analyst",
      icon: Shield,
      gradient: "from-slate-950 via-violet-950 to-slate-950",
    };
  }
  if (key.includes("cloud") || key.includes("devops")) {
    return {
      technologies: ["AWS", "Terraform", "Docker", "Kubernetes", "CI/CD"],
      careerOutcome: "Cloud DevOps Engineer / SRE",
      icon: Cloud,
      gradient: "from-sky-950 via-teal-950 to-slate-950",
    };
  }
  if (key.includes("full stack") || key.includes("web development")) {
    return {
      technologies: ["React", "Next.js", "Node.js", "TypeScript", "PostgreSQL"],
      careerOutcome: "Full Stack Software Engineer",
      icon: Layers,
      gradient: "from-emerald-950 via-slate-900 to-slate-950",
    };
  }
  if (key.includes("python")) {
    return {
      technologies: ["Python 3.12", "FastAPI", "OOP", "Automation", "SQLAlchemy"],
      careerOutcome: "Python Developer / Backend Engineer",
      icon: Terminal,
      gradient: "from-amber-950 via-emerald-950 to-slate-950",
    };
  }
  if (key.includes("java")) {
    return {
      technologies: ["Java 21", "Spring Boot", "Microservices", "Hibernate", "Kafka"],
      careerOutcome: "Java Enterprise Architect",
      icon: Layers,
      gradient: "from-orange-950 via-slate-900 to-slate-950",
    };
  }
  if (key.includes("analytics") || key.includes("power bi")) {
    return {
      technologies: ["Power BI", "DAX", "Advanced SQL", "Tableau", "Excel"],
      careerOutcome: "Business / Data Analyst",
      icon: TrendingUp,
      gradient: "from-teal-950 via-cyan-950 to-slate-950",
    };
  }
  if (key.includes("cpp") || key.includes("c++")) {
    return {
      technologies: ["Modern C++20", "OOP", "STL", "DSA", "Problem Solving"],
      careerOutcome: "Systems Software Engineer",
      icon: Code2,
      gradient: "from-blue-950 via-slate-900 to-slate-950",
    };
  }
  if (key.includes("c language") || key.includes("c programming")) {
    return {
      technologies: ["Memory Mgmt", "Pointers", "Data Structures", "Algorithms"],
      careerOutcome: "Core Systems Developer",
      icon: Terminal,
      gradient: "from-slate-900 via-slate-950 to-emerald-950",
    };
  }
  if (key.includes("flutter") || key.includes("mobile")) {
    return {
      technologies: ["Flutter", "Dart", "React Native", "Firebase", "State Mgmt"],
      careerOutcome: "Mobile App Engineer (iOS/Android)",
      icon: Smartphone,
      gradient: "from-purple-950 via-sky-950 to-slate-950",
    };
  }
  if (key.includes("testing") || key.includes("qa")) {
    return {
      technologies: ["Selenium", "Playwright", "Postman API", "JUnit", "CI/CD"],
      careerOutcome: "QA Automation Engineer",
      icon: FileCheck,
      gradient: "from-emerald-950 via-cyan-950 to-slate-950",
    };
  }
  if (key.includes("marketing") || key.includes("seo")) {
    return {
      technologies: ["SEO", "Google Ads", "Meta Ads", "GA4", "Growth Hacking"],
      careerOutcome: "Digital Marketing Specialist",
      icon: TrendingUp,
      gradient: "from-rose-950 via-slate-900 to-slate-950",
    };
  }
  if (key.includes("linux") || key.includes("network")) {
    return {
      technologies: ["RHEL / Ubuntu", "Bash", "Nginx", "Firewalls", "CCNA"],
      careerOutcome: "Linux System Administrator",
      icon: Terminal,
      gradient: "from-zinc-950 via-orange-950 to-slate-950",
    };
  }

  return {
    technologies: ["Core Engineering", "Industry Labs", "Production Projects"],
    careerOutcome: "Software Tech Professional",
    icon: Brain,
    gradient: "from-slate-950 via-slate-900 to-slate-950",
  };
}

function getCourseBrochureImage(slug: string, title: string): string | null {
  const lower = (slug + " " + title).toLowerCase();
  if (lower.includes("ai") || lower.includes("machine learning")) {
    return "/courses/ai-ml-brochure.jpg";
  }
  if (lower.includes("data science")) {
    return "/courses/data-science-brochure.jpg";
  }
  if (lower.includes("cyber") || lower.includes("security")) {
    return "/courses/cyber-security-brochure.jpg";
  }
  if (lower.includes("c++") || lower.includes("cpp")) {
    return "/courses/cpp-programming-brochure.jpg";
  }
  if (lower.includes("c language") || lower.includes("c programming")) {
    return "/courses/c-programming-brochure.jpg";
  }
  return null;
}

export function CourseCard({ course }: CourseCardProps) {
  const formattedFee = formatPaiseToRupees(course.baseFee);
  // Calculate indicative standard MRP (approx 20% higher to demonstrate authentic institutional fee structure)
  const originalFeePaise = Math.round((course.baseFee * 1.25) / 100000) * 100000;
  const formattedOriginalFee = formatPaiseToRupees(originalFeePaise);

  const meta = getCourseMetadata(course.slug, course.title);
  const IconComponent = meta.icon;
  const brochureImg = course.thumbnailUrl || getCourseBrochureImage(course.slug, course.title);

  return (
    <Card className="flex flex-col justify-between border-slate-200 bg-white hover:border-emerald-500 hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden group">
      {/* 1. Course Promotional Visual Header */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
        {brochureImg ? (
          <>
            <Image
              src={brochureImg}
              alt={course.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/30" />
          </>
        ) : (
          /* Dynamic Programmatic Technology Poster */
          <div className={`w-full h-full bg-gradient-to-br ${meta.gradient} p-5 flex flex-col justify-between relative overflow-hidden`}>
            {/* Tech Circuit Pattern Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-emerald-500/15 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 font-mono bg-emerald-950/90 px-2 py-0.5 rounded-full border border-emerald-800">
                SOFTLAB GLOBAL
              </span>
              <IconComponent className="w-5 h-5 text-emerald-400 opacity-80" />
            </div>

            <div className="relative z-10 space-y-1">
              <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug line-clamp-2">
                {course.title}
              </h4>
              <p className="text-[10px] text-slate-300 font-mono">
                Duration: {course.durationWeeks} Weeks • Certified
              </p>
            </div>
          </div>
        )}

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
            <ShieldCheck className="w-3 h-3" />
            <span>100% Placement</span>
          </span>
          {course.level && (
            <span className="bg-slate-900/90 text-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-700 backdrop-blur-sm">
              {course.level}
            </span>
          )}
        </div>

        {/* Bottom Metadata Ribbon */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px] z-10">
          <span className="text-emerald-300 font-bold flex items-center gap-1 bg-slate-950/70 px-2 py-0.5 rounded-md backdrop-blur-sm">
            <Clock className="w-3 h-3" />
            <span>{course.durationWeeks} Weeks Cohort</span>
          </span>

          <span className="text-slate-300 text-[10px] font-medium bg-slate-950/70 px-2 py-0.5 rounded-md backdrop-blur-sm">
            Classroom & Online
          </span>
        </div>
      </div>

      {/* 2. Course Body Content */}
      <CardHeader className="p-5 pb-2">
        <CardTitle className="text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
          <Link href={`/courses/${course.slug}`}>
            {course.title}
          </Link>
        </CardTitle>

        <CardDescription className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
          {course.summary}
        </CardDescription>

        {/* Key Technologies Chips */}
        <div className="flex flex-wrap gap-1 pt-2">
          {meta.technologies.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 px-2 py-0.5 rounded-md"
            >
              {tech}
            </span>
          ))}
        </div>
      </CardHeader>

      {/* 3. Career Outcome & Assurance */}
      <CardContent className="px-5 py-2 text-xs space-y-1.5 border-t border-slate-100 mt-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Career Role:</span>
          <span className="font-bold text-slate-900">{meta.careerOutcome}</span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Placement Drives:</span>
          <span className="font-bold text-emerald-700 flex items-center gap-1">
            <Award className="w-3 h-3" />
            <span>1,200+ Partner MNCs</span>
          </span>
        </div>
      </CardContent>

      {/* 4. Fee & 3 Distinct CTAs */}
      <CardFooter className="p-4 px-5 border-t border-slate-100 flex flex-col gap-3 bg-slate-50/70">
        <div className="flex items-baseline justify-between w-full">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
              Tuition Fee
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-slate-900">
                {formattedFee}
              </span>
              <span className="text-xs text-slate-400 line-through">
                {formattedOriginalFee}
              </span>
            </div>
          </div>

          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
            Save 20% Direct
          </span>
        </div>

        {/* 3 Visible Action Buttons */}
        <div className="grid grid-cols-3 gap-1.5 w-full pt-1">
          {/* CTA 1: Enquire Now (Opens Global Career Popup) */}
          <Button
            type="button"
            onClick={() => openCareerCounselingModal(course.title)}
            size="sm"
            variant="outline"
            className="border-emerald-500 text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold h-8 px-1"
          >
            Enquire Now
          </Button>

          {/* CTA 2: View Course Details */}
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-slate-300 text-slate-700 hover:border-slate-400 text-[11px] font-semibold h-8 px-1"
          >
            <Link href={`/courses/${course.slug}`}>
              View Course
            </Link>
          </Button>

          {/* CTA 3: Apply Now */}
          <Button
            asChild
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] h-8 px-1 shadow-sm"
          >
            <Link href={`/contact?course=${encodeURIComponent(course.title)}&action=apply`}>
              Apply Now
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
