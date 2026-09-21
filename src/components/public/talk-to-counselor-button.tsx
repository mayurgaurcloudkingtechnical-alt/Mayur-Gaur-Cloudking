"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Phone, Sparkles } from "lucide-react";
import { openCareerCounselingModal } from "@/components/public/career-counseling-modal";

interface TalkToCounselorButtonProps {
  className?: string;
  course?: string;
  children?: React.ReactNode;
  variant?: "outline" | "default" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function TalkToCounselorButton({
  className = "",
  course,
  children,
  variant = "outline",
  size = "lg",
}: TalkToCounselorButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => openCareerCounselingModal(course)}
      className={className}
    >
      {children || (
        <span className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-emerald-400" />
          <span>Talk to Counselor</span>
        </span>
      )}
    </Button>
  );
}
