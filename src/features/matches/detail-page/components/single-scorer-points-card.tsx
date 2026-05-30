import { Crown } from "lucide-react";
import type { StatsMetric } from "#/lib/stats-metrics/formatting";
import type { MatchPointsRow } from "../utils/match-points";
import { MatchPointsValue } from "./match-points-value";

export function SingleScorerPointsCard({
  row,
  pointsMetric,
}: {
  row: MatchPointsRow;
  pointsMetric: StatsMetric;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-accent/45 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--accent)_20%,transparent),color-mix(in_oklch,var(--card)_94%,black)_48%,color-mix(in_oklch,var(--primary)_18%,transparent))] p-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_oklch,var(--accent)_84%,white),transparent)]" />

      <div className="relative grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <span className="grid size-14 place-items-center rounded-xl border border-accent/50 bg-accent/20 text-accent shadow-xs">
          <Crown className="size-7" />
        </span>

        <span className="min-w-0">
          <span className="block truncate text-xl font-semibold">{row.player.name}</span>
          <span className="mt-1 block text-sm text-muted-foreground">Pontuador da partida</span>
        </span>

        <span className="text-left sm:text-right">
          <span className="block text-4xl font-semibold leading-none tabular-nums">
            <MatchPointsValue points={row.points} pointsMetric={pointsMetric} />
          </span>
          <span className="mt-1 block text-[0.68rem] font-semibold uppercase tracking-normal text-accent">
            Pontos
          </span>
        </span>
      </div>
    </div>
  );
}
