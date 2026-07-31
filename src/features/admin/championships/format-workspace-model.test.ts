import { describe, expect, it } from "vitest";
import {
  buildBracketLayout,
  focusedTeamMatchUuids,
  focusedRoute,
  matchContainsTeam,
  roundLabel,
  type FormatProjection,
} from "./format-workspace-model";

describe("championship bracket layout", () => {
  it.each(Array.from({ length: 63 }, (_, index) => index + 2))(
    "lays out a stable bracket for %d teams",
    (teamCount) => {
      const size = 2 ** Math.ceil(Math.log2(teamCount));
      const projection = fixture(size);
      const layout = buildBracketLayout(projection, "stage");

      expect(layout.nodes).toHaveLength(size - 1);
      expect(layout.roundCount).toBe(Math.log2(size));
      expect(layout.width).toBeGreaterThanOrEqual(264);
      expect(layout.height).toBeGreaterThanOrEqual(420);
      expect(
        layout.nodes.every(
          (node) =>
            node.x >= 0 &&
            node.y >= 0 &&
            node.x + node.width <= layout.width &&
            node.y + node.height <= layout.height,
        ),
      ).toBe(true);
      expect(layout.edges.every((edge) => edge.path.startsWith("M "))).toBe(true);
    },
  );

  it.each([
    [1, 4, "Oitavas de final"],
    [2, 4, "Quartas de final"],
    [3, 4, "Semifinais"],
    [4, 4, "Final"],
  ])("labels round %d of %d", (round, count, label) => {
    expect(roundLabel(round, count)).toBe(label);
  });

  it("highlights a focused team's visible path", () => {
    const projection = fixture(4);
    const layout = buildBracketLayout(projection, "stage");
    const first = layout.nodes[0].match;

    expect(matchContainsTeam(first, first.sideA.team!.uuid)).toBe(true);
    expect(focusedRoute(layout.edges[0], first.sideA.team!.uuid)).toBe("focused");
    expect(focusedRoute(layout.edges[0], null)).toBe("normal");
  });

  it("separates winner, loser, and grand-final bands with connected loser drops", () => {
    const projection = doubleFixture();
    const layout = buildBracketLayout(projection, "stage");
    const winners = layout.nodes.filter((node) => node.match.bracket === "winners");
    const losers = layout.nodes.filter((node) => node.match.bracket === "losers");
    const finals = layout.nodes.filter((node) => node.match.bracket === "grand-final");

    expect(layout.sections.map(({ key }) => key)).toEqual(["winners", "losers", "grand-final"]);
    expect(Math.max(...winners.map((node) => node.y + node.height))).toBeLessThan(
      Math.min(...losers.map((node) => node.y)),
    );
    expect(Math.min(...finals.map((node) => node.x))).toBeGreaterThan(
      Math.max(...winners.map((node) => node.x)),
    );
    expect(layout.edges.filter((edge) => edge.route.sourceOutcome === "loser")).toHaveLength(3);
  });

  it("traces every possible upper and lower path for a focused team", () => {
    const projection = doubleFixture();
    const focused = focusedTeamMatchUuids(projection, "stage", "t-1");

    expect(focused).toEqual(new Set(["m-1-1", "m-2-1", "l-1-1", "l-2-1", "grand-final-1"]));
    expect(focusedTeamMatchUuids(projection, "stage", null)).toBeNull();
  });
});

function fixture(size: number): FormatProjection {
  const rounds = Math.log2(size);
  const matches = [];
  const routes = [];

  for (let round = 1; round <= rounds; round += 1) {
    const count = size / 2 ** round;

    for (let position = 1; position <= count; position += 1) {
      const uuid = `m-${round}-${position}`;
      matches.push({
        uuid,
        stageUuid: "stage",
        groupUuid: null,
        label: uuid,
        displayOrder: matches.length,
        sideA: {
          spotUuid: `s-${round}-${position}-a`,
          team:
            round === 1
              ? {
                  uuid: `t-${position * 2 - 1}`,
                  name: `Team ${position * 2 - 1}`,
                  abbreviation: null,
                  colors: null,
                }
              : null,
        },
        sideB: {
          spotUuid: `s-${round}-${position}-b`,
          team:
            round === 1
              ? {
                  uuid: `t-${position * 2}`,
                  name: `Team ${position * 2}`,
                  abbreviation: null,
                  colors: null,
                }
              : null,
        },
        competitionRoundUuid: null,
        scheduledAt: null,
        scheduleStatus: "unscheduled" as const,
        roomProgram: null,
        matchRulesOverride: null,
        bracket: "winners" as const,
        bracketRound: round,
        bracketPosition: position,
        evidenceRevision: 0,
        resultRevision: 0,
        scheduleRevision: 0,
        revision: 0,
        createdAt: "",
        updatedAt: "",
      });
      if (round < rounds) {
        routes.push({
          uuid: `r-${round}-${position}`,
          sourceKind: "match-outcome" as const,
          sourceMatchUuid: uuid,
          sourceGroupUuid: null,
          sourceOutcome: "winner" as const,
          sourceRank: null,
          condition: "always" as const,
          destinationSpotUuid: `s-${round + 1}-${Math.ceil(position / 2)}-${
            position % 2 ? "a" : "b"
          }`,
          priority: 0,
          state: "active" as const,
          createdAt: "",
          updatedAt: "",
        });
      }
    }
  }

  return {
    championshipUuid: "championship",
    championshipRevision: 1,
    limit: 500,
    stages: { items: [], totalCount: 0, truncated: false },
    groups: { items: [], totalCount: 0, truncated: false },
    spots: { items: [], totalCount: 0, truncated: false },
    routes: { items: routes, totalCount: routes.length, truncated: false },
    competitionRounds: { items: [], totalCount: 0, truncated: false },
    matches: { items: matches, totalCount: matches.length, truncated: false },
  } as FormatProjection;
}

function doubleFixture(): FormatProjection {
  const projection = fixture(4);
  const winners = projection.matches.items;
  const baseMatch = winners[0]!;
  const lowerMatches = [
    {
      ...baseMatch,
      uuid: "l-1-1",
      label: "Chave inferior 1",
      displayOrder: 3,
      sideA: { spotUuid: "l-1-1-a", team: null },
      sideB: { spotUuid: "l-1-1-b", team: null },
      bracket: "losers" as const,
      bracketRound: 1,
      bracketPosition: 1,
    },
    {
      ...baseMatch,
      uuid: "l-2-1",
      label: "Chave inferior 2",
      displayOrder: 4,
      sideA: { spotUuid: "l-2-1-a", team: null },
      sideB: { spotUuid: "l-2-1-b", team: null },
      bracket: "losers" as const,
      bracketRound: 2,
      bracketPosition: 1,
    },
    {
      ...baseMatch,
      uuid: "grand-final-1",
      label: "Grande final",
      displayOrder: 5,
      sideA: { spotUuid: "grand-final-1-a", team: null },
      sideB: { spotUuid: "grand-final-1-b", team: null },
      bracket: "grand-final" as const,
      bracketRound: 1,
      bracketPosition: 1,
    },
  ];
  const route = (
    uuid: string,
    sourceMatchUuid: string,
    sourceOutcome: "winner" | "loser",
    destinationSpotUuid: string,
  ) => ({
    uuid,
    sourceKind: "match-outcome" as const,
    sourceMatchUuid,
    sourceGroupUuid: null,
    sourceOutcome,
    sourceRank: null,
    condition: "always" as const,
    destinationSpotUuid,
    priority: 0,
    state: "active" as const,
    createdAt: "",
    updatedAt: "",
  });
  const routes = [
    ...projection.routes.items,
    route("drop-1", "m-1-1", "loser", "l-1-1-a"),
    route("drop-2", "m-1-2", "loser", "l-1-1-b"),
    route("lower-1", "l-1-1", "winner", "l-2-1-a"),
    route("drop-final", "m-2-1", "loser", "l-2-1-b"),
    route("upper-final", "m-2-1", "winner", "grand-final-1-a"),
    route("lower-final", "l-2-1", "winner", "grand-final-1-b"),
  ];

  return {
    ...projection,
    routes: { items: routes, totalCount: routes.length, truncated: false },
    matches: {
      items: [...winners, ...lowerMatches],
      totalCount: winners.length + lowerMatches.length,
      truncated: false,
    },
  };
}
