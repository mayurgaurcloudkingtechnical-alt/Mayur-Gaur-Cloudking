"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle2,
  FileText,
  TrendingUp,
  ArrowRight,
  Loader2,
  PhoneCall,
  XCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function ServicesDashboardView({ basePath = "/admin/services" }: { basePath?: string }) {
  const { data: metrics, isLoading: loadingMetrics } = api.services.getMetrics.useQuery();
  const { data: enquiriesData, isLoading: loadingEnquiries } = api.services.listEnquiries.useQuery({
    limit: 5,
  });

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <Button asChild size="sm" className="bg-slate-900 text-white font-bold text-xs h-8">
          <Link href={basePath}>
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            <span>Overview & Metrics</span>
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs h-8">
          <Link href={`${basePath}/enquiries`}>
            <FileText className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            <span>Service Enquiries</span>
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs h-8">
          <Link href={`${basePath}/packages`}>
            <Briefcase className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            <span>Service Packages</span>
          </Link>
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Enquiries */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Enquiries
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">
                {loadingMetrics ? "..." : metrics?.totalEnquiries ?? 0}
              </span>
              <Briefcase className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-[10px] text-slate-400">All inbound corporate leads</p>
          </CardContent>
        </Card>

        {/* New Enquiries */}
        <Card className="border-blue-100 bg-blue-50/40 shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
              New Enquiries
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-blue-900">
                {loadingMetrics ? "..." : metrics?.newEnquiries ?? 0}
              </span>
              <Sparkles className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-[10px] text-blue-600">Pending initial response</p>
          </CardContent>
        </Card>

        {/* Contacted */}
        <Card className="border-amber-100 bg-amber-50/40 shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
              Contacted
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-900">
                {loadingMetrics ? "..." : metrics?.contacted ?? 0}
              </span>
              <PhoneCall className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-[10px] text-amber-600">Discussion in progress</p>
          </CardContent>
        </Card>

        {/* Quote Requested */}
        <Card className="border-purple-100 bg-purple-50/40 shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
              Quote Requested
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-purple-900">
                {loadingMetrics ? "..." : metrics?.quoteRequested ?? 0}
              </span>
              <FileText className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-[10px] text-purple-600">Proposals being drafted</p>
          </CardContent>
        </Card>

        {/* Converted */}
        <Card className="border-emerald-100 bg-emerald-50/40 shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Converted
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-900">
                {loadingMetrics ? "..." : metrics?.converted ?? 0}
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-[10px] text-emerald-600">Won commercial clients</p>
          </CardContent>
        </Card>

        {/* Follow-ups Pending */}
        <Card className="border-rose-100 bg-rose-50/40 shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
              Follow-ups Due
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-rose-900">
                {loadingMetrics ? "..." : metrics?.followUpsPending ?? 0}
              </span>
              <Clock className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-[10px] text-rose-600">Scheduled for today / overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Enquiries Preview */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Recent Inbound Service Enquiries
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Latest quote requests received from the SoftLab Global website.
            </CardDescription>
          </div>
          <Button asChild size="sm" variant="ghost" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
            <Link href={`${basePath}/enquiries`} className="flex items-center gap-1">
              <span>View All Enquiries</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loadingEnquiries ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              <span>Loading latest enquiries...</span>
            </div>
          ) : !enquiriesData?.items || enquiriesData.items.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">No service enquiries yet.</p>
              <p className="text-slate-400">
                Enquiries submitted via the public /services page will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Ref Number</th>
                    <th className="py-2.5 px-4">Client / Company</th>
                    <th className="py-2.5 px-4">Service Domain</th>
                    <th className="py-2.5 px-4">Package / Scope</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Counselor</th>
                    <th className="py-2.5 px-4">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enquiriesData.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {item.enquiryNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.fullName}</div>
                        <div className="text-[11px] text-slate-400">{item.companyName || "Individual Client"}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {item.category?.name || item.serviceCategoryCode || "General Service"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.packageName || "Custom Scope"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {item.assignedCounselor
                          ? `${item.assignedCounselor.firstName} ${item.assignedCounselor.lastName}`
                          : "Unassigned"}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
