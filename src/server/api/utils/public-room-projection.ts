import type { GetRoomQuery, Room } from "@haxbrasil/haxfootball-api-sdk";
import type {
  PublicLivePlayer,
  PublicLiveRoom,
  PublicRoomDetail,
  PublicRoomSummary,
} from "#/lib/rooms/public-room";
import { roomDisplayName } from "#/lib/rooms/room-display-name";

export type PublicRoomBase = Omit<PublicRoomDetail, "live">;
type LiveRoomResult = NonNullable<GetRoomQuery["liveRoom"]>;

export function isPubliclyAvailableRoom(
  room: Room,
): room is Room & { state: PublicRoomSummary["state"] } {
  return room.state === "provisioning" || room.state === "running";
}

export function toPublicRoomSummary(
  room: Room & { state: PublicRoomSummary["state"] },
): PublicRoomSummary {
  return {
    id: room.id,
    name: roomDisplayName(room),
    state: room.state,
    roomLink: room.roomLink,
    version: room.version.version,
  };
}

export function toPublicRoomBase(
  room: Room & { state: PublicRoomSummary["state"] },
): PublicRoomBase {
  const capacity = room.launchConfig.maxPlayers;

  return {
    ...toPublicRoomSummary(room),
    capacity: typeof capacity === "number" ? capacity : null,
    createdAt: room.createdAt,
  };
}

export function toPublicLiveRoom(liveRoom: LiveRoomResult): PublicLiveRoom {
  return {
    connected: liveRoom.connected,
    lastSeenAt: liveRoom.lastSeenAt,
    gameStatus: toPublicGameStatus(liveRoom.room.gameStatus),
    score: liveRoom.room.scores,
    players: liveRoom.players.nodes.map((player) => ({
      roomPlayerId: player.roomPlayerId,
      name: player.name,
      team: toPublicTeam(player.team),
    })),
  };
}

function toPublicGameStatus(status: LiveRoomResult["room"]["gameStatus"]) {
  switch (status) {
    case "STOPPED":
      return "stopped";
    case "RUNNING":
      return "running";
    case "PAUSED":
      return "paused";
    case "RESUMING":
      return "resuming";
  }
}

function toPublicTeam(
  team: LiveRoomResult["players"]["nodes"][number]["team"],
): PublicLivePlayer["team"] {
  switch (team) {
    case "RED":
      return "red";
    case "BLUE":
      return "blue";
    case "SPECTATORS":
      return "spectators";
  }
}
