import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, HardDrive, Cpu } from "lucide-react";

interface PortalTenantTabProps {
  tenant: any;
  quota: any;
}

export const PortalTenantTab: React.FC<PortalTenantTabProps> = ({ tenant, quota }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Employee User Seats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {quota?.users?.current ?? 0} / {quota?.users?.max ?? 50}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
            <div
              className="bg-emerald-500 h-2 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  ((quota?.users?.current ?? 0) / (quota?.users?.max ?? 50)) * 100
                )}%`,
              }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Active employee seats in this tenant</p>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-600" />
            Audio Recording Vault
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {tenant?._count?.callRecordings ?? 0} Files
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Storage Allocation: {quota?.storageGb?.max ?? 100} GB Encrypted Cloudflare R2
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-2">Zero public storage bucket exposure</p>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-600" />
            AI Transcription & NLP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {quota?.aiMinutes?.current ?? 0} / {quota?.aiMinutes?.max ?? 2000} mins
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
            <div
              className="bg-purple-500 h-2 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  ((quota?.aiMinutes?.current ?? 0) / (quota?.aiMinutes?.max ?? 2000)) * 100
                )}%`,
              }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Monthly Whisper & Gemini 1.5 quota</p>
        </CardContent>
      </Card>
    </div>
  );
};
