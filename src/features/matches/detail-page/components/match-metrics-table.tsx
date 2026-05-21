import { Link } from "@tanstack/react-router";
import { DataCard, EmptyState } from "#/components/ds/app-shell";
import { ResourceTable } from "#/components/ds/resource-table";
import type { MatchDetail } from "#/server/api/haxfootball";
import { formatStatValue } from "../utils/stat-formatting";

export function MatchMetricsTable({ metrics }: { metrics: NonNullable<MatchDetail["metrics"]> }) {
  const metricKeys = Array.from(new Set(metrics.flatMap((row) => Object.keys(row.metrics)))).sort();

  if (metrics.length === 0) {
    return <EmptyState title="Nenhuma métrica da partida" />;
  }

  return (
    <DataCard title="Métricas por jogador">
      <ResourceTable
        rows={metrics}
        columns={[
          {
            key: "player",
            title: "Jogador",
            cell: (row) => (
              <Link
                to="/players/$playerId"
                params={{ playerId: row.player.id }}
                className="font-medium underline-offset-4 hover:underline"
              >
                {row.player.name}
              </Link>
            ),
          },
          ...metricKeys.map((key) => ({
            key,
            title: key,
            cell: (row: (typeof metrics)[number]) => formatStatValue(row.metrics[key]),
          })),
        ]}
      />
    </DataCard>
  );
}
