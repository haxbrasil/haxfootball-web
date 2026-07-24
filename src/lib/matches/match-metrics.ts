import type { WebMatchMetricRow, WebMatchMetrics } from "#/server/api/haxfootball";

export function overallMatchMetricRows(metrics: WebMatchMetrics | null): WebMatchMetricRow[] {
  if (!metrics) {
    return [];
  }

  return Array.isArray(metrics) ? metrics : metrics.overall;
}
