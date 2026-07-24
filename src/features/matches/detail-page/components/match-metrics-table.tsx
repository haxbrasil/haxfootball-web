import { DataCard, EmptyState } from "#/components/ds/app-shell";
import { groupMetricKeysByCategory } from "#/lib/stats-metrics/categories";
import { cn } from "#/lib/utils";
import type { MatchDetail, WebMatchMetricRow } from "#/server/api/haxfootball";
import { formatStatValue } from "../utils/stat-formatting";

export function MatchMetricsTable({
  metrics,
  metricMetadata,
  omittedMetricKeys = [],
}: {
  metrics: WebMatchMetricRow[];
  metricMetadata: MatchDetail["metricMetadata"];
  omittedMetricKeys?: string[];
}) {
  const omittedMetricKeySet = new Set(omittedMetricKeys);
  const rowMetricKeys = Array.from(
    new Set(
      metrics.flatMap((row) =>
        Object.keys(row.metrics).filter((key) => !omittedMetricKeySet.has(key)),
      ),
    ),
  ).sort();
  const visibleMetadataKeys = metricMetadata
    .filter((metric) => !metric.hidden && !omittedMetricKeySet.has(metric.key))
    .map((metric) => metric.key);
  const metricKeys = Array.from(new Set([...visibleMetadataKeys, ...rowMetricKeys]));
  const metricGroups = groupMetricKeysByCategory(metricKeys, metricMetadata);

  if (metrics.length === 0) {
    return <EmptyState title="Nenhuma estatística da partida" />;
  }

  if (metricGroups.length === 0) {
    return null;
  }

  return (
    <DataCard title="Estatísticas" className="overflow-hidden border-accent/20">
      <div className="grid gap-5">
        {metricGroups.map((group) => {
          const peakValues = getPeakValues(
            metrics,
            group.columns.map((column) => column.key),
          );

          return (
            <section
              key={group.key}
              className="relative overflow-hidden rounded-xl border border-border/80 bg-[linear-gradient(145deg,color-mix(in_oklch,var(--card)_96%,white),color-mix(in_oklch,var(--card)_94%,black)_54%,color-mix(in_oklch,var(--accent)_8%,transparent))] shadow-[0_16px_48px_color-mix(in_oklch,black_28%,transparent)]"
            >
              <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(90deg,color-mix(in_oklch,var(--foreground)_5%,transparent)_1px,transparent_1px)] [background-size:72px_100%]" />

              <header className="relative border-b border-border/75 bg-muted/35 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-8 w-1 rounded-full bg-accent" />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold uppercase tracking-normal text-card-foreground">
                      {group.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {group.columns.length === 1
                        ? "1 métrica"
                        : `${group.columns.length} métricas`}
                    </p>
                  </div>
                </div>
              </header>

              <div className="bfl-scrollbar relative overflow-x-auto">
                <table className="w-full min-w-max border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border/75 bg-background/40">
                      <th className="sticky left-0 z-20 w-60 min-w-60 max-w-60 bg-[linear-gradient(90deg,color-mix(in_oklch,var(--card)_98%,black),color-mix(in_oklch,var(--card)_90%,black))] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-normal text-muted-foreground shadow-[8px_0_24px_color-mix(in_oklch,black_22%,transparent)]">
                        Jogador
                      </th>
                      {group.columns.map((column) => (
                        <th
                          key={column.key}
                          className="min-w-28 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-normal text-muted-foreground"
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {metrics.map((row, rowIndex) => (
                      <tr
                        key={row.player.id}
                        className="group border-b border-border/55 transition last:border-b-0 hover:bg-muted/35"
                      >
                        <td className="sticky left-0 z-10 w-60 min-w-60 max-w-60 bg-[linear-gradient(90deg,color-mix(in_oklch,var(--card)_98%,black),color-mix(in_oklch,var(--card)_91%,black))] px-4 py-3.5 shadow-[8px_0_24px_color-mix(in_oklch,black_18%,transparent)]">
                          <span className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                            <span className="grid size-8 place-items-center rounded-lg border border-border/80 bg-background/55 text-xs font-semibold text-muted-foreground tabular-nums">
                              {rowIndex + 1}
                            </span>
                            <span className="min-w-0 truncate font-semibold text-foreground">
                              {row.player.name}
                            </span>
                          </span>
                        </td>

                        {group.columns.map((column) => {
                          const value = row.metrics[column.key];
                          const numericValue = toNumericStatValue(value);
                          const isPeak =
                            numericValue !== null &&
                            peakValues[column.key] !== undefined &&
                            numericValue === peakValues[column.key] &&
                            numericValue > 0;

                          return (
                            <td key={column.key} className="px-4 py-3.5 text-left">
                              <span
                                className={cn(
                                  "inline-flex min-w-10 justify-start rounded-lg px-2.5 py-1 font-medium tabular-nums transition",
                                  isPeak
                                    ? "border border-accent/35 bg-accent/14 text-accent shadow-[0_0_22px_color-mix(in_oklch,var(--accent)_18%,transparent)]"
                                    : "text-foreground/90 group-hover:bg-background/35",
                                )}
                              >
                                {formatStatValue(value)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </DataCard>
  );
}

function getPeakValues(
  metrics: WebMatchMetricRow[],
  metricKeys: string[],
): Record<string, number | undefined> {
  const peaks: Record<string, number | undefined> = {};

  for (const key of metricKeys) {
    for (const row of metrics) {
      const value = toNumericStatValue(row.metrics[key]);

      if (value === null) {
        continue;
      }

      peaks[key] = peaks[key] === undefined ? value : Math.max(peaks[key], value);
    }
  }

  return peaks;
}

function toNumericStatValue(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : null;
  }

  return null;
}
