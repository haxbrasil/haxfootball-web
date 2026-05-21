import { DataGrid, EmptyState } from "#/components/ds/app-shell";
import { MetricCard } from "#/components/ds/metric-card";
import { formatMetricValue, visibleMetricColumns } from "#/lib/stats-metrics/formatting";
import type { PlayerDetail } from "#/server/api/haxfootball";

export function PlayerMetrics({ stats }: { stats: PlayerDetail["stats"] }) {
  const statRow = stats?.items[0] ?? null;
  const metricColumns = visibleMetricColumns(stats);

  if (!stats || !statRow) {
    return <EmptyState title="Nenhuma métrica agregada para este jogador" />;
  }

  const featuredMetrics = metricColumns.slice(0, 3);

  return (
    <DataGrid>
      <MetricCard label="Partidas" value={statRow.contribution.matchesCount} />
      <MetricCard label="Eventos" value={statRow.contribution.eventsCount} />
      {featuredMetrics.map((metric) => (
        <MetricCard
          key={metric.key}
          label={metric.label}
          value={formatMetricValue(statRow.metrics[metric.key], metric)}
        />
      ))}
    </DataGrid>
  );
}
