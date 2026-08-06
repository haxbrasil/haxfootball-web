import type { WebComposedMatch, WebPhysicalMatch } from "#/server/api/haxfootball";

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

export function createComposedMatchTeamGroups(rounds: WebComposedMatch["rounds"]): MatchTeamGroups {
  const composedParticipations = rounds.flatMap((round, roundIndex) =>
    round.match.participations.map((participation) => ({
      ...participation,
      // Each round restarts elapsed time. Offset it so the later physical round
      // remains the player's current logical side while earlier-only players stay listed.
      joinedElapsedSeconds:
        (roundIndex + 1) * 1_000_000 + (participation.joinedElapsedSeconds ?? 0),
      team:
        round.orientation === "swapped"
          ? participation.team === "red"
            ? "blue"
            : participation.team === "blue"
              ? "red"
              : participation.team
          : participation.team,
    })),
  );

  return createMatchTeamGroups(composedParticipations);
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
