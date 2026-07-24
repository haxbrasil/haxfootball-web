import type { WebPhysicalMatch } from "#/server/api/haxfootball";

type MatchParticipation = WebPhysicalMatch["participations"][number];

export type MatchTeamGroups = {
  red: MatchParticipation[];
  blue: MatchParticipation[];
};

export function createMatchTeamGroups(participations: MatchParticipation[]): MatchTeamGroups {
  const latestByPlayerId = new Map<string, MatchParticipation>();

  for (const participation of participations) {
    const current = latestByPlayerId.get(participation.player.id);

    if (!current || participationOrder(participation) >= participationOrder(current)) {
      latestByPlayerId.set(participation.player.id, participation);
    }
  }

  const groups: MatchTeamGroups = {
    blue: [],
    red: [],
  };

  for (const participation of latestByPlayerId.values()) {
    if (participation.team === "red" || participation.team === "blue") {
      groups[participation.team].push(participation);
    }
  }

  groups.red.sort(comparePlayerName);
  groups.blue.sort(comparePlayerName);

  return groups;
}

function participationOrder(participation: MatchParticipation) {
  if (typeof participation.joinedElapsedSeconds === "number") {
    return participation.joinedElapsedSeconds;
  }

  if (participation.joinedAt) {
    return new Date(participation.joinedAt).getTime();
  }

  return 0;
}

function comparePlayerName(left: MatchParticipation, right: MatchParticipation) {
  return left.player.name.localeCompare(right.player.name, "pt-BR");
}
