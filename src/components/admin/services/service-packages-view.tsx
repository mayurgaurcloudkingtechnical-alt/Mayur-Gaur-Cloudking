"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Check,
  Clock,
  ShieldCheck,
  Loader2,
  FileText,
  TrendingUp,
  Tag,
} from "lucide-react";

export function ServicePackagesView({ basePath = "/admin/services" }: { basePath?: string }) {
  const { data: catalog, isLoading } = api.services.getCatalog.useQuery();

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <Button asChild size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs h-8">
          <Link href={basePath}>
            <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            <span>Overview & Metrics</span>
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs h-8">
          <Link href={`${basePath}/enquiries`}>
            <FileText className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            <span>Service Enquiries</span>
          </Link>
        </Button>
        <Button asChild size="sm" className="bg-slate-900 text-white font-bold text-xs h-8">
          <Link href={`${basePath}/packages`}>
            <Briefcase className="h-3.5 w-3.5 mr-1.5" />
            <span>Service Packages</span>
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          <span>Loading service packages...</span>
        </div>
      ) : !catalog || catalog.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500">
          No service packages found.
        </div>
      ) : (
        <div className="space-y-8">
          {catalog.map((cat) => (
            <div key={cat.id} className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-200 pb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs">
                  {cat.sortOrder}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                  <p className="text-[11px] text-slate-500">{cat.description}</p>
                </div>
                <Badge variant="outline" className="ml-auto text-[10px] font-mono">
                  {cat.packages.length} Packages
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.packages.map((pkg) => (
                  <Card key={pkg.id} className="border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-bold text-slate-900">
                          {pkg.name}
                        </CardTitle>
                        {pkg.isPopular && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold shrink-0">
                            POPULAR
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs text-slate-500 leading-relaxed">
                        {pkg.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 space-y-3">
                      <div className="flex items-baseline justify-between border-t border-b border-slate-100 py-2">
                        <span className="text-lg font-black text-slate-900">
                          {pkg.priceDisplay || `₹${pkg.price.toLocaleString("en-IN")}`}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-semibold uppercase text-slate-600">
                          {pkg.billingType}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                        {pkg.deliveryPeriod && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{pkg.deliveryPeriod}</span>
                          </div>
                        )}
                        {pkg.supportPeriod && (
                          <div className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{pkg.supportPeriod}</span>
                          </div>
                        )}
                      </div>

                      {pkg.features && pkg.features.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Features Included</span>
                          <ul className="space-y-1 text-xs text-slate-600">
                            {pkg.features.slice(0, 4).map((f) => (
                              <li key={f} className="flex items-start gap-1.5 text-[11px]">
                                <Check className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
