import { describe, expect, it } from "vitest";
import {
  createDefaultVisualizationChart,
  createVisualizationFieldCatalog,
  supportedVisualizationTypes,
} from "./chart-configurator";

describe("visualization chart configurator", () => {
  const catalog = createVisualizationFieldCatalog([
    {
      definition: {
        metrics: [
          {
            key: "passing-yards",
            label: "Jardas passadas",
            valueType: "number",
            category: "passing",
          },
          { key: "nickname", label: "Apelido", valueType: "string" },
        ],
        virtualMetrics: [{ metric: "fantasy-points" }],
      },
    },
  ]);

  it("offers actual numeric and derived schema statistics", () => {
    expect(catalog.playerMetrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "passing-yards", label: "Jardas passadas" }),
        expect.objectContaining({ key: "fantasy-points", kind: "number" }),
      ]),
    );
    expect(catalog.playerMetrics.some((field) => field.key === "nickname")).toBe(false);
  });

  it.each(supportedVisualizationTypes)("creates a complete default mapping for %s", (type) => {
    const chart = createDefaultVisualizationChart(type, "main", catalog.events);
    expect(chart.type).toBe(type);
    expect(chart.datasetId).toBe("main");
    expect(
      Object.values(chart.fields).every((value) =>
        Array.isArray(value) ? value.length : value.length > 0,
      ),
    ).toBe(true);
  });

  it("selects multiple real statistics for radar", () => {
    const chart = createDefaultVisualizationChart("radar", "main", catalog.playerMetrics);
    expect(chart.fields.metrics).toEqual(
      expect.arrayContaining(["passing-yards", "fantasy-points"]),
    );
  });

  it.each([
    ["heatmap", "x", "y"],
    ["scatter", "x", "y"],
    ["bubble", "x", "y"],
    ["sankey", "source", "target"],
    ["graph", "source", "target"],
  ] as const)("chooses distinct default roles for %s", (type, first, second) => {
    const source =
      type === "heatmap" || type === "sankey" || type === "graph"
        ? catalog.events
        : catalog.playerMetrics;
    const chart = createDefaultVisualizationChart(type, "main", source);
    expect(chart.fields[first]).not.toBe(chart.fields[second]);
  });
});
