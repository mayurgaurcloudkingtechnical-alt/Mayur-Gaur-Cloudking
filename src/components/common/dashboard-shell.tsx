"use client";

import * as React from "react";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { DiwaliLmsBanner } from "./diwali-lms-banner";
import { UserRoleCode } from "@prisma/client";
import { ErrorBoundary } from "@/components/ui/error-boundary";

interface DashboardShellProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    roleCode: UserRoleCode;
  };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const safeUser = user || {
    firstName: "System",
    lastName: "User",
    email: "",
    roleCode: UserRoleCode.SUPER_ADMIN,
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <Navbar
        user={safeUser}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <ErrorBoundary fallback={null}>
        <DiwaliLmsBanner />
      </ErrorBoundary>

      <div className="flex flex-1">
        <ErrorBoundary fallback={<div className="w-16 bg-slate-900" />}>
          <Sidebar
            roleCode={safeUser.roleCode}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </ErrorBoundary>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
