import { formatMetricValue, type StatsMetric } from "#/lib/stats-metrics/formatting";

export function MatchPointsValue({
  points,
  pointsMetric,
}: {
  points: number | string;
  pointsMetric: StatsMetric;
}) {
  return (
    <span className="font-semibold tabular-nums">{formatMetricValue(points, pointsMetric)}</span>
  );
}
