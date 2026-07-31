import type { ChampionshipFormat } from "@haxbrasil/haxfootball-api-sdk";
import type { Serializable } from "#/server/api/championship-api";
import { numberValue } from "./draft-workspace-model";

export { numberValue };

export type FormatProjection = Serializable<ChampionshipFormat>;
export type FormatStage = FormatProjection["stages"]["items"][number];
export type FormatSpot = FormatProjection["spots"]["items"][number];
export type FormatMatch = FormatProjection["matches"]["items"][number];
export type FormatRoute = FormatProjection["routes"]["items"][number];

export type BracketNode = {
  match: FormatMatch;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type BracketEdge = {
  route: FormatRoute;
  source: BracketNode;
  destination: BracketNode | null;
  path: string;
};

export type BracketLayout = {
  width: number;
  height: number;
  roundCount: number;
  sections: Array<{
    key: string;
    label: string;
    x: number;
    y: number;
  }>;
  nodes: BracketNode[];
  edges: BracketEdge[];
};

const nodeWidth = 264;
const nodeHeight = 112;
const columnGap = 64;
const minimumRowGap = 24;

export function buildBracketLayout(projection: FormatProjection, stageUuid: string): BracketLayout {
  const matches = projection.matches.items
    .filter((match) => match.stageUuid === stageUuid && match.bracketRound !== null)
    .sort(
      (left, right) =>
        numberValue(left.bracketRound) - numberValue(right.bracketRound) ||
        numberValue(left.bracketPosition) - numberValue(right.bracketPosition),
    );
  const doubleElimination = matches.some((match) => match.bracket === "losers");
  const winners = matches.filter((match) => match.bracket === "winners");
  const losers = matches.filter((match) => match.bracket === "losers");
  const finals = matches.filter((match) => match.bracket === "grand-final");
  const winnersRoundCount = Math.max(0, ...winners.map((match) => numberValue(match.bracketRound)));
  const losersRoundCount = Math.max(0, ...losers.map((match) => numberValue(match.bracketRound)));
  const roundCount = doubleElimination
    ? Math.max(winnersRoundCount, losersRoundCount) + (finals.length ? 1 : 0)
    : Math.max(0, ...matches.map((match) => numberValue(match.bracketRound)));
  const winnersHeight = bracketBandHeight(winners);
  const losersHeight = doubleElimination ? bracketBandHeight(losers) : 0;
  const bandGap = doubleElimination ? 112 : 0;
  const height = Math.max(420, winnersHeight + losersHeight + bandGap);
  const nodes = matches.map((match) => {
    const round = numberValue(match.bracketRound);
    const position = numberValue(match.bracketPosition);
    const bracketMatches =
      match.bracket === "losers" ? losers : match.bracket === "grand-final" ? finals : winners;
    const matchesInRound = Math.max(
      1,
      bracketMatches.filter((candidate) => numberValue(candidate.bracketRound) === round).length,
    );
    const bandHeight =
      match.bracket === "losers"
        ? losersHeight
        : match.bracket === "grand-final"
          ? height
          : winnersHeight;
    const bandOffset = match.bracket === "losers" ? winnersHeight + bandGap : 0;
    const rowHeight = bandHeight / matchesInRound;
    const xRound =
      match.bracket === "grand-final"
        ? Math.max(winnersRoundCount, losersRoundCount) + round - 1
        : round - 1;

    return {
      match,
      x: xRound * (nodeWidth + columnGap),
      y: bandOffset + rowHeight * (position - 0.5) - nodeHeight / 2,
      width: nodeWidth,
      height: nodeHeight,
    };
  });
  const nodeByMatchUuid = new Map(nodes.map((node) => [node.match.uuid, node]));
  const matchBySpotUuid = new Map<string, BracketNode>();

  for (const node of nodes) {
    matchBySpotUuid.set(node.match.sideA.spotUuid, node);
    matchBySpotUuid.set(node.match.sideB.spotUuid, node);
  }

  const edges = projection.routes.items.flatMap((route) => {
    if (!route.sourceMatchUuid) {
      return [];
    }
    const source = nodeByMatchUuid.get(route.sourceMatchUuid);

    if (!source) {
      return [];
    }
    const destination = matchBySpotUuid.get(route.destinationSpotUuid) ?? null;
    const startX = source.x + source.width;
    const startY = source.y + source.height / 2;
    const endX = destination ? destination.x : startX + columnGap;
    const endY = destination ? destination.y + destination.height / 2 : startY;
    const control = Math.max(36, Math.abs(endX - startX) / 2);

    return [
      {
        route,
        source,
        destination,
        path: `M ${startX} ${startY} C ${startX + control} ${startY}, ${
          endX - control
        } ${endY}, ${endX} ${endY}`,
      },
    ];
  });

  return {
    width: Math.max(nodeWidth, roundCount * nodeWidth + Math.max(0, roundCount - 1) * columnGap),
    height,
    roundCount,
    sections: doubleElimination
      ? [
          { key: "winners", label: "Chave superior", x: 0, y: 0 },
          {
            key: "losers",
            label: "Chave inferior",
            x: 0,
            y: winnersHeight + bandGap - 30,
          },
          ...(finals.length
            ? [
                {
                  key: "grand-final",
                  label: "Finais",
                  x: Math.max(winnersRoundCount, losersRoundCount) * (nodeWidth + columnGap),
                  y: 0,
                },
              ]
            : []),
        ]
      : Array.from({ length: roundCount }, (_, index) => ({
          key: `round-${index + 1}`,
          label: roundLabel(index + 1, roundCount),
          x: index * (nodeWidth + columnGap),
          y: 0,
        })),
    nodes,
    edges,
  };
}

function bracketBandHeight(matches: FormatMatch[]): number {
  const firstRoundCount = Math.max(
    1,
    matches.filter((match) => numberValue(match.bracketRound) === 1).length,
  );

  return Math.max(320, firstRoundCount * (nodeHeight + minimumRowGap));
}

export function matchContainsTeam(match: FormatMatch, teamUuid: string | null): boolean {
  if (!teamUuid) {
    return false;
  }

  return match.sideA.team?.uuid === teamUuid || match.sideB.team?.uuid === teamUuid;
}

export function focusedRoute(
  edge: BracketEdge,
  teamUuid: string | null,
): "focused" | "muted" | "normal" {
  if (!teamUuid) {
    return "normal";
  }

  return matchContainsTeam(edge.source.match, teamUuid) ||
    (edge.destination ? matchContainsTeam(edge.destination.match, teamUuid) : false)
    ? "focused"
    : "muted";
}

export function focusedTeamMatchUuids(
  projection: FormatProjection,
  stageUuid: string,
  teamUuid: string | null,
): Set<string> | null {
  if (!teamUuid) return null;
  const stageMatches = projection.matches.items.filter((match) => match.stageUuid === stageUuid);
  const matchBySpot = new Map<string, string>();
  const routesBySource = new Map<string, FormatRoute[]>();

  for (const match of stageMatches) {
    matchBySpot.set(match.sideA.spotUuid, match.uuid);
    matchBySpot.set(match.sideB.spotUuid, match.uuid);
  }
  for (const route of projection.routes.items) {
    if (!route.sourceMatchUuid) continue;
    routesBySource.set(route.sourceMatchUuid, [
      ...(routesBySource.get(route.sourceMatchUuid) ?? []),
      route,
    ]);
  }

  const focused = new Set(
    stageMatches.filter((match) => matchContainsTeam(match, teamUuid)).map((match) => match.uuid),
  );
  const queue = [...focused];

  while (queue.length) {
    const matchUuid = queue.shift()!;
    const match = stageMatches.find((candidate) => candidate.uuid === matchUuid);
    if (!match) continue;
    const adjacent = (routesBySource.get(matchUuid) ?? [])
      .map((route) => matchBySpot.get(route.destinationSpotUuid))
      .filter((uuid): uuid is string => Boolean(uuid));

    for (const adjacentUuid of adjacent) {
      if (!focused.has(adjacentUuid)) {
        focused.add(adjacentUuid);
        queue.push(adjacentUuid);
      }
    }
  }

  return focused;
}

export function roundLabel(round: number, roundCount: number): string {
  const remaining = roundCount - round;

  if (remaining === 0) return "Final";
  if (remaining === 1) return "Semifinais";
  if (remaining === 2) return "Quartas de final";
  if (remaining === 3) return "Oitavas de final";
  return `Fase ${round}`;
}

export function spotOccupancy(
  projection: FormatProjection,
  stageUuid: string,
): Map<string, FormatSpot> {
  const result = new Map<string, FormatSpot>();

  for (const spot of projection.spots.items) {
    if (spot.stageUuid === stageUuid && spot.currentTeam) {
      result.set(spot.currentTeam.uuid, spot);
    }
  }

  return result;
}
