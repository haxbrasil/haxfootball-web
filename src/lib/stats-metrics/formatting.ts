import type { WebQueryMatchMetricsResponse } from "#/server/api/haxfootball";

export type StatsMetric = WebQueryMatchMetricsResponse["meta"]["availableMetrics"][number];
export type StatsMetricValue = WebQueryMatchMetricsResponse["items"][number]["metrics"][string];

export function visibleMetricColumns(stats: WebQueryMatchMetricsResponse | null) {
  return stats?.meta.availableMetrics.filter((metric) => !metric.hidden) ?? [];
}

export function featuredMetricColumns(stats: WebQueryMatchMetricsResponse | null, limit: number) {
  const metrics = visibleMetricColumns(stats);
  const pointsMetricKey = stats?.meta.featuredMetrics?.points;
  const pointsMetric = metrics.find((metric) => metric.key === pointsMetricKey);
  const remainingMetrics = pointsMetric
    ? metrics.filter((metric) => metric.key !== pointsMetric.key)
    : metrics;

  return [...(pointsMetric ? [pointsMetric] : []), ...remainingMetrics].slice(0, limit);
}

export function formatMetricValue(value: StatsMetricValue, metric: StatsMetric): string {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "number") {
    return typeof metric.precision === "number" ? value.toFixed(metric.precision) : String(value);
  }

  if (typeof value === "boolean" || typeof value === "string") {
    return String(value);
  }

  return JSON.stringify(value);
}
