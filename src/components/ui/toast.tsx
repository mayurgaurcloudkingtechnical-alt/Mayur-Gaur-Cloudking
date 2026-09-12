import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

interface AlertBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "destructive";
  title?: string;
  children: React.ReactNode;
}

export function AlertBanner({
  variant = "info",
  title,
  children,
  className,
  ...props
}: AlertBannerProps) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    destructive: "border-red-200 bg-red-50 text-red-800",
  };

  const icons = {
    info: <Info className="h-4 w-4 text-blue-600 shrink-0" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />,
    warning: <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />,
    destructive: <XCircle className="h-4 w-4 text-red-600 shrink-0" />,
  };

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-lg border p-4 text-sm",
        styles[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-1">{title}</h5>}
        <div>{children}</div>
      </div>
    </div>
  );
}
