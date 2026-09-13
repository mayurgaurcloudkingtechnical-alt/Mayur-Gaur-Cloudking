"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Calendar,
  IndianRupee,
  FileCheck2,
  Award,
  Briefcase,
  Users,
  Settings,
  ClipboardCheck,
  FileEdit,
  PhoneCall,
  UserPlus,
  BarChart3,
  BookMarked,
  ShoppingCart,
  FileText,
  Clock,
  CreditCard,
} from "lucide-react";
import { UserRoleCode } from "@prisma/client";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SidebarProps {
  roleCode: UserRoleCode;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ roleCode, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const getNavItems = (): NavItem[] => {
    switch (roleCode) {
      case "STUDENT":
        return [
          { title: "Dashboard", href: "/student/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
          { title: "My Courses", href: "/student/courses", icon: <BookOpen className="h-4 w-4" /> },
          { title: "Marketplace", href: "/student/marketplace", icon: <ShoppingCart className="h-4 w-4" /> },
          { title: "Assignments", href: "/student/assignments", icon: <FileText className="h-4 w-4" /> },
          { title: "Exams & Quizzes", href: "/student/exams", icon: <ClipboardCheck className="h-4 w-4" /> },
          { title: "Marksheets", href: "/student/marksheets", icon: <FileCheck2 className="h-4 w-4" /> },
          { title: "Certificates", href: "/student/certificates", icon: <Award className="h-4 w-4" /> },
          { title: "Fees & Breakdown", href: "/student/fees", icon: <IndianRupee className="h-4 w-4" /> },
          { title: "Payment History", href: "/student/payments", icon: <CreditCard className="h-4 w-4" /> },
          { title: "Career & Placement", href: "/student/placement", icon: <Briefcase className="h-4 w-4" /> },
        ];
      case "TRAINER":
        return [
          { title: "Dashboard", href: "/trainer/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
          { title: "Assigned Batches", href: "/trainer/batches", icon: <Users className="h-4 w-4" /> },
          { title: "Live Classes", href: "/trainer/classes", icon: <Calendar className="h-4 w-4" /> },
          { title: "Curriculum CMS", href: "/trainer/classes", icon: <FileEdit className="h-4 w-4" /> },
        ];
      case "TELECALLER":
        return [
          { title: "Dashboard", href: "/counselor/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
          { title: "Lead Pipeline", href: "/counselor/leads", icon: <Users className="h-4 w-4" /> },
          { title: "Daily Follow-ups", href: "/counselor/follow-ups", icon: <PhoneCall className="h-4 w-4" /> },
        ];
      case "COUNSELOR":
        return [
          { title: "Dashboard", href: "/counselor/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
          { title: "Lead Pipeline", href: "/counselor/leads", icon: <Users className="h-4 w-4" /> },
          { title: "Daily Follow-ups", href: "/counselor/follow-ups", icon: <PhoneCall className="h-4 w-4" /> },
          { title: "Admissions Desk", href: "/counselor/admissions", icon: <UserPlus className="h-4 w-4" /> },
        ];
      default: // SUPER_ADMIN, DIRECTOR, ADMIN, MANAGER, HR, ACCOUNTANT, PLACEMENT_OFFICER
        return [
          { title: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
          { title: "Institutional Analytics", href: "/admin/analytics", icon: <BarChart3 className="h-4 w-4" /> },
          { title: "Admissions", href: "/admin/admissions", icon: <GraduationCap className="h-4 w-4" /> },
          { title: "Course Catalog", href: "/admin/courses", icon: <BookMarked className="h-4 w-4" /> },
          { title: "Batches & Schedules", href: "/admin/batches", icon: <Calendar className="h-4 w-4" /> },
          { title: "Finance & Accounts", href: "/admin/finance", icon: <IndianRupee className="h-4 w-4" /> },
          { title: "Exams & Results", href: "/admin/exams", icon: <FileCheck2 className="h-4 w-4" /> },
          { title: "Certificates", href: "/admin/certificates", icon: <Award className="h-4 w-4" /> },
          { title: "Placements", href: "/admin/placement", icon: <Briefcase className="h-4 w-4" /> },
          { title: "Staff & HR", href: "/admin/hr", icon: <Users className="h-4 w-4" /> },
          { title: "Settings & RBAC", href: "/admin/settings", icon: <Settings className="h-4 w-4" /> },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white pt-16 transition-transform duration-200 ease-in-out lg:static lg:z-0 lg:pt-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <span className={cn(isActive ? "text-emerald-600" : "text-slate-400")}>
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">SOFTLAB GLOBAL</p>
            <p className="mt-0.5">Prayagraj, UP 211001</p>
            <p className="mt-0.5 font-mono text-[10px]">v0.1.0 • Day 1 Foundation</p>
          </div>
        </div>
      </aside>
    </>
  );
}
