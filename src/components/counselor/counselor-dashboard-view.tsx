"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, PhoneCall, UserPlus, Percent, ArrowRight, Clock, AlertTriangle } from "lucide-react";
import { LeadStatus } from "@prisma/client";

interface CounselorDashboardViewProps {
  maxDiscount: number;
  roleCode: string;
}

export function CounselorDashboardView({ maxDiscount, roleCode }: CounselorDashboardViewProps) {
  const { data: stats, isLoading: isLoadingStats } = api.crm.getStats.useQuery();
  const { data: leadsData, isLoading: isLoadingLeads } = api.crm.listLeads.useQuery({
    limit: 5,
    page: 1,
  });

  const dueCount = stats?.dueToday ?? 0;

  return (
    <div className="space-y-6">
      {/* Alert if follow-ups are due */}
      {dueCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                You have {dueCount} follow-up {dueCount === 1 ? "call" : "calls"} scheduled for today or overdue.
              </p>
              <p className="text-xs text-amber-700">Prompt responses increase candidate enrollment probability.</p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
            <Link href="/counselor/follow-ups">Open Call Queue</Link>
          </Button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500">Pipeline Inquiries</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isLoadingStats ? "..." : stats?.totalLeads ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats?.newLeads ?? 0} uncontacted new leads
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500">Calls Due Today</CardTitle>
            <PhoneCall className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isLoadingStats ? "..." : stats?.dueToday ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Requiring outreach today</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500">Admissions Closed</CardTitle>
            <UserPlus className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isLoadingStats ? "..." : stats?.admittedCount ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats?.totalApps ?? 0} applications submitted
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500">Discount Authority</CardTitle>
            <Percent className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">≤ {maxDiscount}%</div>
            <p className="text-xs text-slate-500 mt-1">Direct approval limit</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads Preview */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Recent Assigned Inquiries</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Prospects assigned to your counseling queue
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/counselor/leads" className="flex items-center gap-1.5">
              <span>View All Leads</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingLeads ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading prospects...</div>
          ) : leadsData?.leads && leadsData.leads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="pb-2 font-semibold">Prospect</th>
                    <th className="pb-2 font-semibold">Phone / City</th>
                    <th className="pb-2 font-semibold">Interested Course</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 font-semibold">Next Follow-Up</th>
                    <th className="pb-2 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leadsData.leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5">
                        <div className="font-semibold text-slate-900">{lead.fullName}</div>
                        <div className="text-slate-400 text-[11px]">{lead.email}</div>
                      </td>
                      <td className="py-2.5 text-slate-600">
                        <div>{lead.phone}</div>
                        <div className="text-slate-400 text-[11px]">{lead.city || "—"}</div>
                      </td>
                      <td className="py-2.5 text-slate-700">
                        {lead.course?.title || <span className="text-slate-400 italic">General</span>}
                      </td>
                      <td className="py-2.5">
                        <Badge
                          variant="secondary"
                          className={
                            lead.status === LeadStatus.NEW
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : lead.status === LeadStatus.ADMITTED
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : lead.status === LeadStatus.INTERESTED
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }
                        >
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-slate-600">
                        {lead.nextFollowUp ? (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {new Date(lead.nextFollowUp).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Not set</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50">
                          <Link href={`/counselor/leads/${lead.id}`}>Details</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No leads currently assigned to your queue.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
