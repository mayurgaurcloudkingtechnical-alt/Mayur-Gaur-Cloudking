export interface CreateRoomOptions {
  roomCode: string;
  title: string;
  batchCode: string;
  maxParticipants?: number;
  isRecordingEnabled?: boolean;
}

export interface RoomDetails {
  roomCode: string;
  title: string;
  batchCode: string;
  activeParticipantsCount: number;
  status: "WAITING" | "LIVE" | "CONCLUDED";
  createdAt: Date;
}

export interface LiveClassroomProvider {
  createRoom(options: CreateRoomOptions): Promise<{ roomCode: string; providerRoomId: string }>;
  getRoomDetails(roomCode: string): Promise<RoomDetails | null>;
  closeRoom(roomCode: string): Promise<boolean>;
}
