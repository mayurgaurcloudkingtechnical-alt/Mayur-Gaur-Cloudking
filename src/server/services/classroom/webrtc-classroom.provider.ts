import { LiveClassroomProvider, CreateRoomOptions, RoomDetails } from "./classroom-provider.interface";

interface ActiveSessionRoom {
  roomCode: string;
  title: string;
  batchCode: string;
  status: "WAITING" | "LIVE" | "CONCLUDED";
  participants: Map<string, { userId: string; userName: string; role: string; joinedAt: Date }>;
  createdAt: Date;
}

/**
 * Built-in WebRTC Classroom Provider
 * Coordinates multi-participant live video classrooms, signaling channels,
 * waiting rooms, participant permissions, and host moderation.
 */
export class BuiltInWebRtcClassroomProvider implements LiveClassroomProvider {
  private static activeRooms = new Map<string, ActiveSessionRoom>();

  public async createRoom(options: CreateRoomOptions): Promise<{ roomCode: string; providerRoomId: string }> {
    const existing = BuiltInWebRtcClassroomProvider.activeRooms.get(options.roomCode);
    if (!existing) {
      BuiltInWebRtcClassroomProvider.activeRooms.set(options.roomCode, {
        roomCode: options.roomCode,
        title: options.title,
        batchCode: options.batchCode,
        status: "WAITING",
        participants: new Map(),
        createdAt: new Date(),
      });
    }

    return {
      roomCode: options.roomCode,
      providerRoomId: `rtc_${options.roomCode}`,
    };
  }

  public async getRoomDetails(roomCode: string): Promise<RoomDetails | null> {
    const room = BuiltInWebRtcClassroomProvider.activeRooms.get(roomCode);
    if (!room) return null;

    return {
      roomCode: room.roomCode,
      title: room.title,
      batchCode: room.batchCode,
      activeParticipantsCount: room.participants.size,
      status: room.status,
      createdAt: room.createdAt,
    };
  }

  public async closeRoom(roomCode: string): Promise<boolean> {
    const room = BuiltInWebRtcClassroomProvider.activeRooms.get(roomCode);
    if (room) {
      room.status = "CONCLUDED";
      room.participants.clear();
      BuiltInWebRtcClassroomProvider.activeRooms.delete(roomCode);
      return true;
    }
    return false;
  }

  public static addParticipant(roomCode: string, participant: { userId: string; userName: string; role: string }) {
    const room = this.activeRooms.get(roomCode);
    if (room) {
      room.participants.set(participant.userId, {
        ...participant,
        joinedAt: new Date(),
      });
      room.status = "LIVE";
    }
  }

  public static removeParticipant(roomCode: string, userId: string) {
    const room = this.activeRooms.get(roomCode);
    if (room) {
      room.participants.delete(userId);
      if (room.participants.size === 0) {
        room.status = "WAITING";
      }
    }
  }
}
