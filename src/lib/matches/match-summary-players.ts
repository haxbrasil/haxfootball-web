export type MatchSummaryPlayer = {
  id: string;
  name: string;
  team: "red" | "blue";
};

export type MatchSummaryRoster = {
  kind?: "single" | "composed";
  players?: MatchSummaryPlayer[];
  rounds?: Array<{
    orientation?: "aligned" | "swapped";
    match?: { id: string; players?: MatchSummaryPlayer[] };
  }>;
};

export function matchSummaryPlayers(match: MatchSummaryRoster): MatchSummaryPlayer[] {
  const appearances =
    match.kind === "composed"
      ? (match.rounds ?? []).flatMap((round) =>
          (round.match?.players ?? []).map((player) => ({
            ...player,
            team:
              round.orientation === "swapped"
                ? player.team === "red"
                  ? ("blue" as const)
                  : ("red" as const)
                : player.team,
          })),
        )
      : (match.players ?? []);
  const playersById = new Map<string, MatchSummaryPlayer>();

  for (const player of appearances) {
    playersById.set(player.id, player);
  }

  return [...playersById.values()];
}
