import { DataCard } from "#/components/ds/app-shell";
import { ResourceTable } from "#/components/ds/resource-table";
import { formatMetricValue, visibleMetricColumns } from "#/lib/stats-metrics/formatting";
import type { PlayerDetail } from "#/server/api/haxfootball";

export function PlayerMetricDetailsTable({ stats }: { stats: PlayerDetail["stats"] }) {
  const statRow = stats?.items[0] ?? null;
  const metricColumns = visibleMetricColumns(stats);

  if (!statRow || metricColumns.length === 0) {
    return null;
  }

  return (
    <DataCard title="Métricas detalhadas">
      <ResourceTable
        rows={metricColumns}
        columns={[
          { key: "metric", title: "Métrica", cell: (metric) => metric.label },
          {
            key: "value",
            title: "Valor",
            cell: (metric) => formatMetricValue(statRow.metrics[metric.key], metric),
          },
        ]}
      />
    </DataCard>
  );
}
