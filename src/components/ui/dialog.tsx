"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType | null>(null);

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  const childArray = React.Children.toArray(children);
  const hasDialogContent = childArray.some(
    (child) =>
      React.isValidElement(child) &&
      (child.type === DialogContent ||
        (typeof child.type === "function" &&
          (child.type as { displayName?: string }).displayName === "DialogContent"))
  );

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[99990] flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-xs"
      >
        <div
          className="fixed inset-0"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
        {hasDialogContent ? children : <DialogContent>{children}</DialogContent>}
      </div>
    </DialogContext.Provider>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-left pr-10 mb-4",
        className
      )}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-bold leading-snug tracking-tight text-slate-900",
        className
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed", className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-2 mt-6 pt-3 border-t border-slate-100",
        className
      )}
      {...props}
    />
  );
}

export function DialogContent({
  className,
  children,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(DialogContext);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(e);
      }}
      className={cn(
        "relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 text-slate-900 border border-slate-200",
        className
      )}
      {...props}
    >
      {ctx && (
        <button
          type="button"
          onClick={() => ctx.onOpenChange(false)}
          className="absolute right-3.5 top-3.5 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-black hover:bg-zinc-800 text-white border-2 border-black shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-black cursor-pointer hover:scale-105"
          aria-label="Close dialog"
          title="Close dialog"
        >
          <X className="h-4 w-4 text-white stroke-[3]" />
        </button>
      )}
      {children}
    </div>
  );
}
DialogContent.displayName = "DialogContent";
