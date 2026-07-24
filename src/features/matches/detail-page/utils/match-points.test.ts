import { describe, expect, it } from "vitest";
import type { WebMatchMetricRow } from "#/server/api/haxfootball";
import { createRankedPointsRows, getMatchScoringRows } from "./match-points";

function pointsRow(input: {
  id: string;
  name: string;
  points: number | string;
}): WebMatchMetricRow {
  return {
    metrics: {
      points: input.points,
    },
    player: {
      account: null,
      country: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      externalId: input.id,
      id: input.id,
      name: input.name,
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  } as WebMatchMetricRow;
}

describe("match points", () => {
  it("keeps only positive scorers and sorts by points", () => {
    const rows = getMatchScoringRows(
      [
        pointsRow({ id: "one", name: "Ana", points: 0 }),
        pointsRow({ id: "two", name: "Bia", points: 7 }),
        pointsRow({ id: "three", name: "Caio", points: "14" }),
      ],
      "points",
    );

    expect(rows.map((row) => row.player.name)).toEqual(["Caio", "Bia"]);
  });

  it("adds stable display ranks", () => {
    const rows = createRankedPointsRows(
      [
        pointsRow({ id: "one", name: "Ana", points: 14 }),
        pointsRow({ id: "two", name: "Bia", points: 7 }),
      ].map((row) => ({ ...row, points: row.metrics.points as number | string })),
    );

    expect(rows.map((row) => row.rank)).toEqual([1, 2]);
  });
});
