import type { PublicLivePlayer, PublicLiveRoom } from "#/lib/rooms/public-room";

export type RoomLiveFreshness = "live" | "delayed" | "offline" | "unavailable";

export type RoomLiveRosters = {
  red: PublicLivePlayer[];
  blue: PublicLivePlayer[];
  spectators: PublicLivePlayer[];
};

const delayedAfterMs = 15_000;

export function roomLiveFreshness(
  live: PublicLiveRoom | null,
  now = Date.now(),
): RoomLiveFreshness {
  if (!live) {
    return "unavailable";
  }

  if (!live.connected) {
    return "offline";
  }

  const lastSeenAt = Date.parse(live.lastSeenAt);

  if (!Number.isFinite(lastSeenAt) || now - lastSeenAt > delayedAfterMs) {
    return "delayed";
  }

  return "live";
}

export function roomLiveFreshnessLabel(freshness: RoomLiveFreshness): string {
  switch (freshness) {
    case "live":
      return "Ao vivo";
    case "delayed":
      return "Dados atrasados";
    case "offline":
      return "Atualização interrompida";
    case "unavailable":
      return "Sem dados ao vivo";
  }
}

export function roomGameStatusLabel(live: PublicLiveRoom | null): string {
  switch (live?.gameStatus) {
    case "running":
      return "Jogo em andamento";
    case "paused":
      return "Jogo pausado";
    case "resuming":
      return "Retomando";
    case "stopped":
      return "Aguardando partida";
    default:
      return "Informações ao vivo indisponíveis";
  }
}

export function groupLiveRoomPlayers(players: PublicLivePlayer[]): RoomLiveRosters {
  return {
    red: players.filter((player) => player.team === "red"),
    blue: players.filter((player) => player.team === "blue"),
    spectators: players.filter((player) => player.team === "spectators"),
  };
}
