import { describe, expect, it } from "vitest";
import type { WebQueryMatchMetricsResponse } from "#/server/api/haxfootball";
import {
  featuredMetricColumns,
  formatMetricValue,
  formatPointsMetricValue,
  visibleMetricColumns,
} from "./formatting";

const stats = {
  meta: {
    availableMetrics: [
      { key: "yards", label: "Jardas", description: null, precision: 1 },
      { key: "points", label: "Pontos", description: null },
      { key: "internal", label: "Interno", description: null, hidden: true },
    ],
    featuredMetrics: {
      points: "points",
    },
  },
} as unknown as WebQueryMatchMetricsResponse;

describe("visibleMetricColumns", () => {
  it("filters hidden metrics", () => {
    expect(visibleMetricColumns(stats).map((metric) => metric.key)).toEqual(["yards", "points"]);
  });

  it("moves the schema points metric first for featured metric cards", () => {
    expect(featuredMetricColumns(stats, 2).map((metric) => metric.key)).toEqual([
      "points",
      "yards",
    ]);
  });
});

describe("formatMetricValue", () => {
  it("formats metric values using schema precision", () => {
    const [metric] = visibleMetricColumns(stats);

    expect(formatMetricValue(12.345, metric)).toBe("12.3");
    expect(formatMetricValue(null, metric)).toBe("-");
    expect(formatMetricValue({ value: 1 }, metric)).toBe('{"value":1}');
  });
});

describe("formatPointsMetricValue", () => {
  it("formats points with one decimal place", () => {
    const metric = visibleMetricColumns(stats).find((item) => item.key === "points")!;

    expect(formatPointsMetricValue(12.345, metric)).toBe("12.3");
    expect(formatPointsMetricValue("7", metric)).toBe("7.0");
    expect(formatPointsMetricValue(null, metric)).toBe("-");
  });
});
