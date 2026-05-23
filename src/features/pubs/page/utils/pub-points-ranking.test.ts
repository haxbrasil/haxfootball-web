import { describe, expect, it } from "vitest";
import type { StatsCategoryRanking, StatsCategoryRankingsResponse } from "#/server/api/haxfootball";
import { getPubPointsMetric, splitPubPointsRanking } from "./pub-points-ranking";

describe("splitPubPointsRanking", () => {
  it("separates the category that contains the featured points metric", () => {
    const points = category("fantasy", ["fantasy-points"], "fantasy-points");
    const passing = category("passing", ["passing-yards"], "passing-yards");
    const rankings = response([points, passing]);

    expect(splitPubPointsRanking(rankings)).toEqual({
      pointsCategory: points,
      pointsMetricKey: "fantasy-points",
      regularCategories: [passing],
    });
  });

  it("keeps every category regular when no featured points metric exists", () => {
    const passing = category("passing", ["passing-yards"], "passing-yards", null);
    const rankings = response([passing]);

    expect(splitPubPointsRanking(rankings)).toEqual({
      pointsCategory: null,
      pointsMetricKey: null,
      regularCategories: [passing],
    });
  });
});

describe("getPubPointsMetric", () => {
  it("returns the featured points metric metadata", () => {
    const points = category("fantasy", ["fantasy-points"], "fantasy-points");

    expect(getPubPointsMetric(points)?.key).toBe("fantasy-points");
  });
});

function response(categories: StatsCategoryRanking[]): StatsCategoryRankingsResponse {
  return { categories };
}

function category(
  key: string,
  metricKeys: string[],
  primaryMetricKey: string,
  featuredPointsMetricKey: string | null = "fantasy-points",
): StatsCategoryRanking {
  const metrics = metricKeys.map((metricKey) => ({
    category: null,
    description: null,
    key: metricKey,
    label: `metric.${metricKey}`,
  }));

  return {
    key,
    metricKeys,
    metrics,
    primaryMetricKey,
    stats: {
      items: [],
      meta: {
        availableMetrics: metrics,
        featuredMetrics: {
          points: featuredPointsMetricKey,
        },
        totals: {
          groupsCount: 0,
        },
      },
      page: {
        limit: 10,
        nextCursor: null,
      },
    },
    title: key,
  } as unknown as StatsCategoryRanking;
}
