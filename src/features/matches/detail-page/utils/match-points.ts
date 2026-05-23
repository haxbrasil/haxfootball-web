import type { StatsMetric } from "#/lib/stats-metrics/formatting";
import type { MatchDetail, WebMatchMetrics } from "#/server/api/haxfootball";

export type MatchPointsRow = WebMatchMetrics[number] & {
  points: number | string;
};

export type RankedMatchPointsRow = MatchPointsRow & {
  rank: number;
};

export function getMatchPointsMetric(detail: MatchDetail): StatsMetric | null {
  const pointsMetricKey = detail.featuredMetrics?.points;

  if (!pointsMetricKey) {
    return null;
  }

  return detail.metricMetadata.find((metric) => metric.key === pointsMetricKey) ?? null;
}

export function getMatchPointsRows(
  metrics: WebMatchMetrics,
  pointsMetricKey: string,
): MatchPointsRow[] {
  return metrics
    .flatMap((row) => {
      const points = row.metrics[pointsMetricKey];

      if (typeof points !== "number" && typeof points !== "string") {
        return [];
      }

      return [{ ...row, points }];
    })
    .sort(comparePointsRows);
}

export function getMatchScoringRows(
  metrics: WebMatchMetrics,
  pointsMetricKey: string,
): MatchPointsRow[] {
  return getMatchPointsRows(metrics, pointsMetricKey).filter((row) => hasScored(row.points));
}

export function createRankedPointsRows(rows: MatchPointsRow[]): RankedMatchPointsRow[] {
  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

function hasScored(points: number | string) {
  const value = Number(points);

  return Number.isFinite(value) && value > 0;
}

function comparePointsRows(left: MatchPointsRow, right: MatchPointsRow) {
  const pointsComparison = Number(right.points) - Number(left.points);

  if (Number.isFinite(pointsComparison) && pointsComparison !== 0) {
    return pointsComparison;
  }

  return left.player.name.localeCompare(right.player.name);
}
