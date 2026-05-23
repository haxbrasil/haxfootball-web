import { describe, expect, it } from "vitest";
import type { StatsMetric } from "./formatting";
import {
  formatMetricCategoryLabel,
  groupMetricKeysByCategory,
  groupMetricsByCategory,
} from "./categories";

function metric(input: Partial<StatsMetric> & Pick<StatsMetric, "key">): StatsMetric {
  return {
    category: null,
    description: null,
    format: "integer",
    hidden: false,
    label: `metric.${input.key}`,
    precision: 0,
    valueType: "number",
    ...input,
  };
}

function category(key: string, label: string, primaryMetric: string | null = null) {
  return {
    description: null,
    key,
    label,
    primaryMetric,
  };
}

describe("stats metric categories", () => {
  it("groups visible metrics by schema category", () => {
    const groups = groupMetricsByCategory([
      metric({
        key: "passing-yards",
        category: category("category.passing", "Passing", "passing-yards"),
      }),
      metric({
        key: "sacks",
        category: category("category.defense", "Defense", "sacks"),
      }),
      metric({ key: "custom" }),
    ]);

    expect(groups.map((group) => [group.title, group.metrics.map((entry) => entry.key)])).toEqual([
      ["Passe", ["passing-yards"]],
      ["Defesa", ["sacks"]],
      ["Outras", ["custom"]],
    ]);
  });

  it("moves the group containing the featured metric first", () => {
    const groups = groupMetricsByCategory(
      [
        metric({
          key: "passing-yards",
          category: category("category.passing", "Passing", "passing-yards"),
        }),
        metric({
          key: "fantasy-points",
          category: category("category.fantasy", "Fantasy", "fantasy-points"),
        }),
      ],
      { featuredMetricKey: "fantasy-points" },
    );

    expect(groups.map((group) => group.title)).toEqual(["Fantasy", "Passe"]);
  });

  it("uses metadata order and hides hidden metrics when grouping raw metric keys", () => {
    const groups = groupMetricKeysByCategory(
      ["custom", "hidden", "passing-yards"],
      [
        metric({
          key: "passing-yards",
          category: category("category.passing", "Passing", "passing-yards"),
        }),
        metric({ key: "hidden", hidden: true }),
      ],
    );

    expect(groups.map((group) => [group.title, group.columns.map((entry) => entry.key)])).toEqual([
      ["Passe", ["passing-yards"]],
      ["Outras", ["custom"]],
    ]);
  });

  it("keeps custom schema category labels", () => {
    expect(formatMetricCategoryLabel(category("category.pressure", "Pressão"))).toBe("Pressão");
  });
});
