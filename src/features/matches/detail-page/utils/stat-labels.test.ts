import { describe, expect, it } from "vitest";
import { humanizeStatKey } from "#/lib/stats-metrics/labels";
import { formatMetricLabel, formatStatEventLabel } from "./stat-labels";

describe("stat labels", () => {
  it("uses known Portuguese metric labels", () => {
    expect(formatMetricLabel("field-goal-yards")).toBe("Jardas de field goal");
  });

  it("uses known Portuguese event labels", () => {
    expect(formatStatEventLabel("field-goal-made")).toBe("Field goal feito");
  });

  it("keeps generic humanization available through the shared labels module", () => {
    expect(humanizeStatKey("custom-stat-value")).toBe("Custom stat value");
  });
});
