"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  Trash2,
  Edit2,
  ShieldCheck,
  Building,
  GraduationCap,
  DollarSign,
  PhoneCall,
  MessageCircle,
} from "lucide-react";

const CATEGORIES = [
  { key: "ALL", label: "All Knowledge" },
  { key: "COURSES", label: "Courses & Curricula" },
  { key: "FEES", label: "Fees & EMI Policies" },
  { key: "SYLLABUS", label: "Syllabus Details" },
  { key: "FAQS", label: "Frequently Asked Questions" },
  { key: "ADMISSIONS", label: "Admissions Criteria" },
  { key: "PLACEMENT", label: "Placement & 1,200+ Partners" },
  { key: "POLICIES", label: "Academic Policies" },
  { key: "BRANCHES", label: "Campuses & Centers" },
  { key: "TRAINERS", label: "Faculty & Mentors" },
  { key: "COMPANY_INFO", label: "Company & Trust Info" },
  { key: "OFFERS", label: "Approved Offers & Scholarships" },
  { key: "CALLING_SCRIPTS", label: "AI Calling Scripts" },
  { key: "WHATSAPP_TEMPLATES", label: "WhatsApp Templates" },
  { key: "OBJECTION_HANDLING", label: "Objection Handling" },
];

export function AiKnowledgeView() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New Doc Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("COURSES");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [priority, setPriority] = useState(5);

  const utils = api.useUtils();

  const { data: docs = [], isLoading } = api.aiKnowledge.listDocs.useQuery({
    category: selectedCategory,
    search: searchQuery || undefined,
  });

  const upsertMutation = api.aiKnowledge.upsertDoc.useMutation({
    onSuccess: () => {
      alert("Knowledge document saved successfully!");
      setIsDialogOpen(false);
      resetForm();
      utils.aiKnowledge.listDocs.invalidate();
    },
    onError: (err) => alert(err.message),
  });

  const deleteMutation = api.aiKnowledge.deleteDoc.useMutation({
    onSuccess: () => {
      utils.aiKnowledge.listDocs.invalidate();
    },
  });

  const seedMutation = api.aiKnowledge.seedDefaultKnowledge.useMutation({
    onSuccess: (res) => {
      alert(res.message);
      utils.aiKnowledge.listDocs.invalidate();
    },
  });

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setContent("");
    setTags("");
    setPriority(5);
  };

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !content) {
      alert("Please fill in all required fields.");
      return;
    }

    upsertMutation.mutate({
      category: category as any,
      title,
      slug,
      content,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      priority,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Knowledge Center & Grounding</h1>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              <ShieldCheck className="h-3 w-3 mr-1" /> Institutional Source of Truth
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Super Admin controlled institutional knowledge base across 14 categories. AI Voice Agents and WhatsApp Counselors strictly ground their answers here.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {docs.length === 0 && (
            <Button
              variant="outline"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="text-xs border-purple-300 bg-purple-50 text-purple-700"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Seed Default Facts
            </Button>
          )}

          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-cyan-700 hover:bg-cyan-800 text-white text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Knowledge Document
          </Button>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedCategory(c.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === c.key
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search knowledge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Add Document Modal Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Add AI Knowledge Document</h2>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDoc} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1 border rounded-md p-2 text-xs"
                  >
                    {CATEGORIES.filter((c) => c.key !== "ALL").map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Priority (1-10)</label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value) || 5)}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Document Title *</label>
                <Input
                  placeholder="e.g. 2026 Merit Scholarship Terms"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }
                  }}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Unique Slug *</label>
                <Input
                  placeholder="e.g. scholarship-terms-2026"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="mt-1 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Authoritative Content & Facts *</label>
                <textarea
                  rows={5}
                  placeholder="Enter exact facts, figures, policies, and requirements that the AI must communicate..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full mt-1 border rounded-md p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Tags (comma-separated)</label>
                <Input
                  placeholder="fees, scholarship, admissions, discount"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={upsertMutation.isPending}
                  className="bg-cyan-700 hover:bg-cyan-800 text-white"
                >
                  Save Knowledge Doc
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading knowledge documents...</div>
        ) : docs.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-50 border rounded-xl p-8">
            <BookOpen className="h-10 w-10 stroke-1 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">No knowledge documents found</p>
            <p className="text-xs text-slate-500 mt-1">
              Click &quot;Seed Default Facts&quot; or &quot;Add Knowledge Document&quot; above to initialize the AI grounding base.
            </p>
          </div>
        ) : (
          docs.map((doc) => (
            <Card key={doc.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono uppercase bg-slate-50">
                    {doc.category.replace("_", " ")}
                  </Badge>
                  <Badge className="bg-emerald-50 text-emerald-700 text-[10px] border-emerald-200">
                    Priority {doc.priority}
                  </Badge>
                </div>
                <CardTitle className="text-base text-slate-900 mt-2 line-clamp-1">{doc.title}</CardTitle>
                <CardDescription className="text-xs font-mono text-slate-400">/{doc.slug}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-600 line-clamp-4 whitespace-pre-wrap">{doc.content}</p>

                <div className="pt-2 border-t flex items-center justify-between text-[11px] text-slate-400">
                  <span>Verified: {doc.verifiedBy || "Super Admin"}</span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete document "${doc.title}"?`)) {
                        deleteMutation.mutate({ id: doc.id });
                      }
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete document"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
