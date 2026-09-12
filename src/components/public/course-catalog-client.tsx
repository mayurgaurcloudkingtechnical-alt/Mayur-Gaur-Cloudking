"use client";

import * as React from "react";
import { PublicCourseData, CourseCard } from "./course-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, BookOpen, Filter, X } from "lucide-react";

interface CourseCatalogClientProps {
  courses: PublicCourseData[];
}

export function CourseCatalogClient({ courses }: CourseCatalogClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedLevel, setSelectedLevel] = React.useState<string>("ALL");

  // Extract distinct levels from real database courses
  const availableLevels = React.useMemo(() => {
    const levels = new Set<string>();
    courses.forEach((c) => {
      if (c.level) levels.add(c.level);
    });
    return Array.from(levels);
  }, [courses]);

  // Filter courses by search query and level
  const filteredCourses = React.useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        searchQuery === "" ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.summary.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLevel =
        selectedLevel === "ALL" || course.level === selectedLevel;

      return matchesSearch && matchesLevel;
    });
  }, [courses, searchQuery, selectedLevel]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedLevel("ALL");
  };

  return (
    <div className="space-y-8">
      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search courses by keyword, technology, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-sm h-11 border-slate-200 focus-visible:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1 md:pb-0">
          <Button
            variant={selectedLevel === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedLevel("ALL")}
            className={
              selectedLevel === "ALL"
                ? "bg-emerald-600 hover:bg-emerald-700 text-xs h-9"
                : "border-slate-200 text-slate-700 text-xs h-9"
            }
          >
            All Levels ({courses.length})
          </Button>

          {availableLevels.map((lvl) => {
            const count = courses.filter((c) => c.level === lvl).length;
            const isSelected = selectedLevel === lvl;
            return (
              <Button
                key={lvl}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLevel(lvl)}
                className={
                  isSelected
                    ? "bg-emerald-600 hover:bg-emerald-700 text-xs h-9"
                    : "border-slate-200 text-slate-700 text-xs h-9"
                }
              >
                {lvl} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-900">{filteredCourses.length}</strong> of{" "}
          <strong className="text-slate-900">{courses.length}</strong> published programs
        </span>
        {(searchQuery || selectedLevel !== "ALL") && (
          <button
            onClick={handleResetFilters}
            className="text-emerald-700 hover:text-emerald-800 font-medium underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Course Grid or Empty State */}
      {filteredCourses.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <BookOpen className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              No matching courses found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
              We could not find any published curriculum matching &ldquo;{searchQuery}&rdquo;.
              Try adjusting your search terms or view all programs.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="border-slate-300 text-xs"
            >
              Reset All Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
