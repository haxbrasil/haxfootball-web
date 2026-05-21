import { describe, expect, it } from "vitest";
import type { WebQueryMatchMetricsResponse } from "#/server/api/haxfootball";
import { formatMetricValue, visibleMetricColumns } from "./formatting";

const stats = {
  meta: {
    availableMetrics: [
      { key: "yards", label: "Jardas", description: null, precision: 1 },
      { key: "internal", label: "Interno", description: null, hidden: true },
    ],
  },
} as WebQueryMatchMetricsResponse;

describe("visibleMetricColumns", () => {
  it("filters hidden metrics", () => {
    expect(visibleMetricColumns(stats).map((metric) => metric.key)).toEqual(["yards"]);
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
