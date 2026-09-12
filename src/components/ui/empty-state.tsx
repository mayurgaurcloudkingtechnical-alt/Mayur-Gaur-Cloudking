import * as React from "react";
import { cn } from "@/lib/utils";
import { FolderOpen } from "lucide-react";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center",
        className
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
        {icon || <FolderOpen className="h-6 w-6" />}
      </div>
      <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      {description && (
        <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
