export type PublicRoomSummary = {
  id: string;
  name: string;
  state: "provisioning" | "running";
  roomLink: string | null;
  version: string;
};

export type PublicLivePlayer = {
  roomPlayerId: number;
  name: string;
  team: "red" | "blue" | "spectators";
};

export type PublicLiveRoom = {
  connected: boolean;
  lastSeenAt: string;
  gameStatus: "stopped" | "running" | "paused" | "resuming";
  score: {
    red: number;
    blue: number;
  } | null;
  players: PublicLivePlayer[];
};

export type PublicRoomDetail = PublicRoomSummary & {
  capacity: number | null;
  createdAt: string;
  live: PublicLiveRoom | null;
};

export type PublicRoomLiveResult =
  | {
      status: "ok";
      live: PublicLiveRoom | null;
    }
  | {
      status: "error" | "room-unavailable";
    };
