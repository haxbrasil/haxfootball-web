import type { Player } from "@haxbrasil/haxfootball-api-sdk";

export function filterPlayers(players: Player[], query: string): Player[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return players;
  }

  return players.filter((player) =>
    [player.name, player.country, player.account?.name, player.account?.externalId].some((value) =>
      value?.toLowerCase().includes(normalizedQuery),
    ),
  );
}
