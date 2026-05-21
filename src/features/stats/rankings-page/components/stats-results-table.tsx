import { EmptyState } from "#/components/ds/app-shell";
import { ResourceTable } from "#/components/ds/resource-table";
import { formatMetricValue } from "#/lib/stats-metrics/formatting";
import type { WebQueryMatchMetricsResponse } from "#/server/api/haxfootball";

export function StatsResultsTable({ stats }: { stats: WebQueryMatchMetricsResponse | null }) {
  const metricColumns = stats?.meta.availableMetrics.filter((metric) => !metric.hidden) ?? [];

  if (!stats || stats.items.length === 0) {
    return <EmptyState title="Nenhuma métrica encontrada" />;
  }

  return (
    <ResourceTable
      rows={stats.items}
      columns={[
        {
          key: "rank",
          title: "#",
          cell: (item) => item.rank,
        },
        {
          key: "name",
          title: "Grupo",
          cell: (item) => item.group.name,
        },
        {
          key: "matches",
          title: "Partidas",
          cell: (item) => item.contribution.matchesCount,
        },
        {
          key: "events",
          title: "Eventos",
          cell: (item) => item.contribution.eventsCount,
        },
        ...metricColumns.map((metric) => ({
          key: metric.key,
          title: metric.label,
          cell: (item: WebQueryMatchMetricsResponse["items"][number]) =>
            formatMetricValue(item.metrics[metric.key], metric),
        })),
      ]}
    />
  );
}
