"use client";

import * as React from "react";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { UserRoleCode } from "@prisma/client";

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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <Navbar
        user={user}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <div className="flex flex-1">
        <Sidebar
          roleCode={user.roleCode}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
