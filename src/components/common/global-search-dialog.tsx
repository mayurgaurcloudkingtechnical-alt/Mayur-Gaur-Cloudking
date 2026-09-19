"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  GraduationCap,
  Users,
  Target,
  BookOpen,
  Briefcase,
  Layers,
  Loader2,
  Command,
} from "lucide-react";

export function GlobalSearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  // Listen for Ctrl+K or Cmd+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { data, isLoading } = api.admin.globalSearch.useQuery(
    { query },
    { enabled: query.trim().length >= 2 }
  );

  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery("");
    router.push(url);
  };

  const totalResults =
    (data?.students.length || 0) +
    (data?.staff.length || 0) +
    (data?.leads.length || 0) +
    (data?.courses.length || 0) +
    (data?.drives.length || 0) +
    (data?.batches.length || 0);

  return (
    <>
      {/* Navbar search trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs transition-colors w-36 sm:w-64"
        title="Search platform (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="flex-1 text-left truncate">Search anything...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {/* Global Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search students, staff, leads, courses, batches, drives..."
                className="pl-10 pr-10 h-11 text-sm bg-white border-slate-200 focus-visible:ring-emerald-500"
                autoFocus
              />
              {isLoading && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 animate-spin" />
              )}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {query.trim().length < 2 && (
              <div className="text-center py-8 text-xs text-slate-400">
                Type at least 2 characters to search across all platform entities...
              </div>
            )}

            {query.trim().length >= 2 && !isLoading && totalResults === 0 && (
              <div className="text-center py-8 text-xs text-slate-500">
                No matching records found for &ldquo;<strong className="text-slate-800">{query}</strong>&rdquo;
              </div>
            )}

            {/* Students */}
            {data?.students && data.students.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                  <GraduationCap className="h-3.5 w-3.5 text-sky-600" />
                  <span>Students ({data.students.length})</span>
                </div>
                <div className="space-y-1">
                  {data.students.map((item: any) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-slate-100 flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">
                        Student
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Staff */}
            {data?.staff && data.staff.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                  <Users className="h-3.5 w-3.5 text-purple-600" />
                  <span>Staff & Faculty ({data.staff.length})</span>
                </div>
                <div className="space-y-1">
                  {data.staff.map((item: any) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-slate-100 flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                        Staff
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Leads */}
            {data?.leads && data.leads.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                  <Target className="h-3.5 w-3.5 text-amber-600" />
                  <span>CRM Leads ({data.leads.length})</span>
                </div>
                <div className="space-y-1">
                  {data.leads.map((item: any) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-slate-100 flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                        Lead
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Courses */}
            {data?.courses && data.courses.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Courses ({data.courses.length})</span>
                </div>
                <div className="space-y-1">
                  {data.courses.map((item: any) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-slate-100 flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        Course
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Placement Drives */}
            {data?.drives && data.drives.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                  <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Placement Drives ({data.drives.length})</span>
                </div>
                <div className="space-y-1">
                  {data.drives.map((item: any) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-slate-100 flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                        Drive
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Batches */}
            {data?.batches && data.batches.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                  <Layers className="h-3.5 w-3.5 text-teal-600" />
                  <span>Academic Batches ({data.batches.length})</span>
                </div>
                <div className="space-y-1">
                  {data.batches.map((item: any) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-slate-100 flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700 border-teal-200">
                        Batch
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
