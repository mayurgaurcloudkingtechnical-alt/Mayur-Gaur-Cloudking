import React from "react";
import { SkillverseService } from "@/server/services/skillverse.service";
import { SkillverseHomeView } from "@/components/skillverse/skillverse-home-view";

export const dynamic = "force-dynamic";

export default async function SkillverseHomePage() {
  const data = await SkillverseService.getCatalogAndConfig();

  return (
    <SkillverseHomeView
      courses={data.courses}
      packages={data.packages}
      addons={data.addons}
      feeRules={data.feeRules}
      cms={data.cms}
      faqs={data.faqs}
      verifiedFaculty={data.verifiedFaculty}
    />
  );
}
