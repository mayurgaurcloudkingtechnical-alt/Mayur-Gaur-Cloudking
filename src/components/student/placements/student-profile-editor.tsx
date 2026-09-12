"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Edit3, Award } from "lucide-react";

interface Props {
  profile: any;
  onProfileUpdated: () => void;
}

export function StudentProfileEditor({ profile, onProfileUpdated }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    headline: profile?.headline || "",
    bio: profile?.bio || "",
    resumeUrl: profile?.resumeUrl || "",
    portfolioUrl: profile?.portfolioUrl || "",
    githubUrl: profile?.githubUrl || "",
    linkedinUrl: profile?.linkedinUrl || "",
    skills: profile?.skills?.join(", ") || "",
  });

  const updateMutation = api.placement.updateMyPlacementProfile.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      onProfileUpdated();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        headline: form.headline.trim() || undefined,
        bio: form.bio.trim() || undefined,
        resumeUrl: form.resumeUrl.trim() || undefined,
        portfolioUrl: form.portfolioUrl.trim() || undefined,
        githubUrl: form.githubUrl.trim() || undefined,
        linkedinUrl: form.linkedinUrl.trim() || undefined,
        skills: form.skills ? form.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      });

    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Placement Candidate Profile</h2>
        <button
          onClick={() => {
            setIsEditing(!isEditing);
            setForm({
              headline: profile?.headline || "",
              bio: profile?.bio || "",
              resumeUrl: profile?.resumeUrl || "",
              portfolioUrl: profile?.portfolioUrl || "",
              githubUrl: profile?.githubUrl || "",
              linkedinUrl: profile?.linkedinUrl || "",
              skills: profile?.skills?.join(", ") || "",
            });
          }}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Edit3 className="w-3.5 h-3.5" />
          {isEditing ? "Cancel Editing" : "Edit Profile"}
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block font-medium text-slate-700 text-xs mb-1">Headline</label>
            <input
              type="text"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="e.g. Full Stack Developer | Next.js & PostgreSQL"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 text-xs mb-1">Bio / Summary</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Brief career objective..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 text-xs mb-1">Resume Link (URL)</label>
              <input
                type="url"
                value={form.resumeUrl}
                onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })}
                placeholder="https://drive.google.com/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 text-xs mb-1">Portfolio / Website</label>
              <input
                type="url"
                value={form.portfolioUrl}
                onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
                placeholder="https://myportfolio.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 text-xs mb-1">GitHub URL</label>
              <input
                type="url"
                value={form.githubUrl}
                onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                placeholder="https://github.com/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 text-xs mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={form.linkedinUrl}
                onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-700 text-xs mb-1">Skills (comma-separated)</label>
            <input
              type="text"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              placeholder="JavaScript, TypeScript, React, Node.js, SQL"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
          >
            Save Profile
          </button>
        </form>
      ) : (
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-slate-900">{profile?.headline || "No headline set"}</h3>
            <p className="text-slate-600 text-xs mt-1">{profile?.bio || "No biography provided."}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Technical Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {profile && profile.skills.length > 0 ? (
                profile.skills.map((s: string, idx: number) => (
                  <span key={idx} className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">No skills added yet.</span>
              )}
            </div>
          </div>

          {profile?.isPlaced && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
              <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Placed Candidate
              </div>
              <p className="text-emerald-700">
                Placed at <span className="font-semibold">{profile.placedCompany}</span> (
                {profile.placedPackage || "Offered Package"})
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
