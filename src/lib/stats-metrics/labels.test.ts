import { describe, expect, it } from "vitest";
import { formatMetricLabel, humanizeStatKey } from "./labels";

describe("stats metric labels", () => {
  it("uses known Portuguese metric labels", () => {
    expect(formatMetricLabel("field-goal-yards")).toBe("Jardas de field goal");
  });

  it("resolves value keys returned as labels", () => {
    expect(formatMetricLabel("ignored", "metric.fantasy-points")).toBe("Pontos");
  });

  it("keeps API labels that are already presentational", () => {
    expect(formatMetricLabel("ignored", "Pontos")).toBe("Pontos");
  });

  it("humanizes unknown schema keys", () => {
    expect(humanizeStatKey("custom-stat-value")).toBe("Custom stat value");
  });
});
