import { formatMetricValue } from "#/lib/stats-metrics/formatting";
import { cn } from "#/lib/utils";
import type { StatsCategoryRanking, WebQueryMatchMetricsResponse } from "#/server/api/haxfootball";
import { getPubPointsMetric } from "../utils/pub-points-ranking";

export function PubPointsRankingList({
  category,
  rows,
}: {
  category: StatsCategoryRanking;
  rows: WebQueryMatchMetricsResponse["items"];
}) {
  const pointsMetric = getPubPointsMetric(category);

  if (!pointsMetric) {
    return null;
  }

  return (
    <ol className="grid gap-2.5">
      {rows.map((item, index) => {
        const isLeader = index === 0;

        return (
          <li
            key={`${item.group.type}-${item.group.id ?? item.group.name}-${item.rank}`}
            className={cn(
              "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border/80 bg-background/35 p-3",
              "transition hover:border-primary/45 hover:bg-muted/40",
              isLeader &&
                "border-primary/45 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_24%,transparent),color-mix(in_oklch,var(--card)_92%,black))]",
            )}
          >
            <span
              className={cn(
                "grid size-8 place-items-center rounded-lg border border-border/80 bg-muted/60 text-sm font-semibold text-muted-foreground",
                isLeader && "border-primary/40 bg-primary/20 text-primary",
              )}
            >
              {item.rank}
            </span>

            <span className="min-w-0">
              <span className="block truncate font-medium text-foreground">{item.group.name}</span>
              <span className="block text-xs text-muted-foreground">
                {formatMatchesCount(Number(item.contribution.matchesCount))}
              </span>
            </span>

            <span className="text-right">
              <span className={cn("block font-semibold text-foreground", isLeader && "text-xl")}>
                {formatMetricValue(item.metrics[pointsMetric.key], pointsMetric)}
              </span>
              <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Pontos
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function formatMatchesCount(matchesCount: number) {
  return matchesCount === 1 ? "1 partida" : `${matchesCount} partidas`;
}
