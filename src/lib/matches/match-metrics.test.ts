import { describe, expect, it } from "vitest";
import type { WebMatchMetrics } from "#/server/api/haxfootball";
import { overallMatchMetricRows } from "./match-metrics";

describe("overallMatchMetricRows", () => {
  it("returns physical match metrics unchanged", () => {
    const metrics: WebMatchMetrics = [
      {
        metrics: { goals: 2 },
        player: {
          account: null,
          country: "br",
          createdAt: "2026-01-01T00:00:00.000Z",
          id: "player001",
          name: "Ana",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    ];

    expect(overallMatchMetricRows(metrics)).toEqual(metrics);
  });

  it("returns only the aggregate rows from composed metrics", () => {
    const metrics: WebMatchMetrics = {
      overall: [
        {
          metrics: { goals: 3 },
          player: {
            account: null,
            country: "br",
            createdAt: "2026-01-01T00:00:00.000Z",
            id: "player001",
            name: "Ana",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        },
      ],
      rounds: [
        {
          round: { kind: "sequential", matchId: "match001", number: 1 },
          metrics: [],
        },
      ],
    };

    expect(overallMatchMetricRows(metrics)).toEqual(metrics.overall);
  });
});
