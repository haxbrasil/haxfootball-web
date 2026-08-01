import { describe, expect, it } from "vitest";
import {
  humanizeMetricKey,
  metricDisplayLabel,
  metricMappingDrafts,
  playerMetricColumns,
  statisticValueLabel,
  validateMetricMappingDrafts,
  type MetricMappingDraft,
} from "./statistics-workspace-model";

describe("championship statistics workspace model", () => {
  it("builds stable non-reserved metric columns", () => {
    expect(
      playerMetricColumns({
        players: {
          items: [
            { metrics: { tackles: 3, matches_played: 1, goals: 2 } },
            { metrics: { goals: 1, assists: 4, playing_time_seconds: 600 } },
          ],
        },
      } as never),
    ).toEqual(["assists", "goals", "tackles"]);
  });

  it.each([
    ["goals_scored", "Gols marcados"],
    ["qb-rating", "Qb Rating"],
    ["tackles", "Tackles"],
  ])("humanizes metric key %s", (key, expected) => {
    expect(humanizeMetricKey(key)).toBe(expected);
  });

  it("uses Portuguese labels for known football metrics before configured English labels", () => {
    expect(metricDisplayLabel("passing_yards", "Passing Yards")).toBe("Jardas passadas");
    expect(metricDisplayLabel("custom_metric", "Métrica personalizada")).toBe(
      "Métrica personalizada",
    );
  });

  it("rounds floating-point noise", () => {
    expect(statisticValueLabel(1200.5166666662321)).toBe("1.200,52");
  });

  it.each(Array.from({ length: 61 }, (_, value) => value))("formats integer metric %d", (value) => {
    expect(statisticValueLabel(value, "integer")).toBe(String(value));
  });

  it.each([
    [0, "0:00"],
    [59, "0:59"],
    [60, "1:00"],
    [3_661, "1:01:01"],
  ])("formats duration %d", (value, expected) => {
    expect(statisticValueLabel(value, "duration")).toBe(expected);
  });

  it("hydrates current mappings and preserves inactive sources", () => {
    const drafts = metricMappingDrafts(
      {
        metricSources: {
          items: [
            {
              eventSchemaId: "schema",
              eventSchemaName: "new",
              eventSchemaVersion: 2,
              metricKey: "new-goals",
              label: "Gols novos",
              valueKind: "integer",
              mappedCanonicalMetricKey: null,
            },
          ],
        },
      } as never,
      {
        items: [
          {
            source: {
              eventSchemaId: "old-schema",
              eventSchemaName: "old",
              eventSchemaVersion: 1,
              metricKey: "old-goals",
            },
            canonicalMetricKey: "goals",
            displayLabel: "Gols",
            valueKind: "integer",
            aggregation: "sum",
          },
        ],
      } as never,
    );

    expect(drafts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceMetricKey: "new-goals", enabled: false }),
        expect.objectContaining({
          sourceMetricKey: "old-goals",
          canonicalMetricKey: "goals",
          enabled: true,
        }),
      ]),
    );
  });

  it("rejects incompatible definitions for one canonical metric", () => {
    expect(
      validateMetricMappingDrafts([
        draft({ sourceKey: "one", displayLabel: "Gols", aggregation: "sum" }),
        draft({ sourceKey: "two", displayLabel: "Gols", aggregation: "maximum" }),
      ]),
    ).toEqual(["As definições da métrica canônica goals não são iguais."]);
  });
});

function draft(overrides: Partial<MetricMappingDraft>): MetricMappingDraft {
  return { ...baseDraft(), ...overrides };
}

function baseDraft(): MetricMappingDraft {
  return {
    sourceKey: "source",
    enabled: true,
    eventSchemaId: "schema",
    eventSchemaName: "schema",
    eventSchemaVersion: 1,
    sourceMetricKey: "goals",
    canonicalMetricKey: "goals",
    displayLabel: "Gols",
    valueKind: "integer",
    aggregation: "sum",
  };
}
