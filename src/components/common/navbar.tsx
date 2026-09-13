"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SoftlabLogo } from "@/components/common/softlab-logo";
import { LogOut, User as UserIcon, Menu } from "lucide-react";
import { UserRoleCode } from "@prisma/client";

interface NavbarProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    roleCode: UserRoleCode;
  };
  onToggleSidebar?: () => void;
}

export function Navbar({ user, onToggleSidebar }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Link href="/" className="flex items-center gap-2">
          <SoftlabLogo size="sm" showTagline={false} />
        </Link>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <Badge variant="default" className="hidden sm:inline-flex uppercase font-mono text-[11px]">
          {user.roleCode.replace(/_/g, " ")}
        </Badge>

        <div className="flex items-center gap-2 text-right">
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-semibold text-slate-900 leading-none">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-[11px] text-slate-500">{user.email}</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <UserIcon className="h-4 w-4" />
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline text-xs">Logout</span>
        </Button>
      </div>
    </header>
  );
}
