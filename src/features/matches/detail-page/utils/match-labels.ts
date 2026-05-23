import { humanizeStatKey } from "#/lib/stats-metrics/labels";

const teamLabels: Record<string, string> = {
  blue: "Azul",
  red: "Vermelho",
  spectators: "Espectadores",
};

const roomEventLabels: Record<string, string> = {
  player_join: "Entrou na sala",
  player_leave: "Saiu da sala",
  player_team_change: "Mudou de time",
};

export function formatTeam(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return teamLabels[String(value)] ?? String(value);
}

export function formatRoomEventLabel(type: string) {
  return roomEventLabels[type] ?? humanizeStatKey(type);
}

export function formatElapsedSeconds(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  if (value < 60) {
    return `${Math.round(value)}s`;
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);

  return `${minutes}min ${String(seconds).padStart(2, "0")}s`;
}
