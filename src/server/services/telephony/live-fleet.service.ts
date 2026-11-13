import { db } from "@/server/db/client";
import { UserRoleCode } from "@prisma/client";

export type AgentPresenceStatus = "AVAILABLE" | "RINGING" | "ON_CALL" | "ON_BREAK" | "OFFLINE";

export interface AgentPresenceSummary {
  userId: string;
  name: string;
  email: string;
  roleCode: UserRoleCode;
  phone?: string | null;
  presenceStatus: AgentPresenceStatus;
  statusSource: "LIVE_PROVIDER" | "HEARTBEAT" | "LAST_KNOWN" | "OFFLINE";
  currentCallProvider?: string | null;
  lastSeenAt?: Date | null;
  registeredDeviceCount: number;
}

export class LiveFleetService {
  /**
   * Retrieves real presence status for all telecallers, counselors, and sales agents
   */
  static async getLiveFleetPresence(tenantId: string): Promise<AgentPresenceSummary[]> {
    const agents = await db.user.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        roleCode: {
          in: [
            UserRoleCode.TELECALLER,
            UserRoleCode.COUNSELOR,
            UserRoleCode.MANAGER,
            UserRoleCode.ADMIN,
          ],
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        roleCode: true,
        lastLoginAt: true,
        slgDeviceRegistrations: {
          where: { status: "ACTIVE" },
          select: { id: true, lastSeenAt: true, deviceType: true },
        },
      },
      orderBy: { firstName: "asc" },
    });

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const summaries: AgentPresenceSummary[] = [];

    for (const agent of agents) {
      // 1. Check for active live call event within the last 10 minutes
      const activeCall = await db.slgCallLog.findFirst({
        where: {
          tenantId,
          userId: agent.id,
          startedAt: { gte: tenMinutesAgo },
          endedAt: null,
          callStatus: "CONNECTED",
        },
        select: { id: true, provider: true },
      });

      const activeDevices = agent.slgDeviceRegistrations;
      const latestDeviceSeen = activeDevices.length > 0
        ? new Date(Math.max(...activeDevices.map((d) => (d.lastSeenAt ? d.lastSeenAt.getTime() : 0))))
        : null;

      let presenceStatus: AgentPresenceStatus = "OFFLINE";
      let statusSource: "LIVE_PROVIDER" | "HEARTBEAT" | "LAST_KNOWN" | "OFFLINE" = "OFFLINE";

      if (activeCall) {
        presenceStatus = "ON_CALL";
        statusSource = "LIVE_PROVIDER";
      } else if (latestDeviceSeen && latestDeviceSeen >= fiveMinutesAgo) {
        presenceStatus = "AVAILABLE";
        statusSource = "HEARTBEAT";
      } else if (agent.lastLoginAt && agent.lastLoginAt >= fiveMinutesAgo) {
        presenceStatus = "AVAILABLE";
        statusSource = "LAST_KNOWN";
      } else {
        presenceStatus = "OFFLINE";
        statusSource = "OFFLINE";
      }

      summaries.push({
        userId: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        email: agent.email,
        roleCode: agent.roleCode,
        phone: agent.phone,
        presenceStatus,
        statusSource,
        currentCallProvider: activeCall?.provider || null,
        lastSeenAt: latestDeviceSeen || agent.lastLoginAt,
        registeredDeviceCount: activeDevices.length,
      });
    }

    return summaries;
  }
}
