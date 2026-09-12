import { router, requireRoleProcedure } from "../init";
import { UserRoleCode } from "@prisma/client";
import { SystemHealthService } from "@/server/services/system-health.service";

export const systemRouter = router({
  /**
   * Performs deep diagnostic health check on database latency, models, memory, and environment
   */
  getHealthCheck: requireRoleProcedure([UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN]).query(
    async () => {
      return SystemHealthService.getHealthDiagnostics();
    }
  ),
});
