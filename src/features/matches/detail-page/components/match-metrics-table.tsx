import { DataCard, EmptyState } from "#/components/ds/app-shell";
import { ResourceTable } from "#/components/ds/resource-table";
import { groupMetricKeysByCategory } from "#/lib/stats-metrics/categories";
import type { MatchDetail } from "#/server/api/haxfootball";
import { formatStatValue } from "../utils/stat-formatting";

export function MatchMetricsTable({
  metrics,
  metricMetadata,
  omittedMetricKeys = [],
}: {
  metrics: NonNullable<MatchDetail["metrics"]>;
  metricMetadata: MatchDetail["metricMetadata"];
  omittedMetricKeys?: string[];
}) {
  const omittedMetricKeySet = new Set(omittedMetricKeys);
  const metricKeys = Array.from(
    new Set(
      metrics.flatMap((row) =>
        Object.keys(row.metrics).filter((key) => !omittedMetricKeySet.has(key)),
      ),
    ),
  ).sort();
  const metricGroups = groupMetricKeysByCategory(metricKeys, metricMetadata);

  if (metrics.length === 0) {
    return <EmptyState title="Nenhuma estatística da partida" />;
  }

  if (metricGroups.length === 0) {
    return null;
  }

  return (
    <DataCard title="Estatísticas">
      <div className="grid gap-5">
        {metricGroups.map((group) => (
          <section key={group.key} className="grid gap-2">
            <h3 className="text-sm font-semibold text-card-foreground">{group.title}</h3>
            <ResourceTable
              rows={metrics}
              columns={[
                {
                  key: "player",
                  title: "Nome",
                  cell: (row) => <span className="font-medium">{row.player.name}</span>,
                },
                ...group.columns.map((column) => ({
                  key: column.key,
                  title: column.label,
                  cell: (row: (typeof metrics)[number]) => formatStatValue(row.metrics[column.key]),
                })),
              ]}
            />
          </section>
        ))}
      </div>
    </DataCard>
  );
}
