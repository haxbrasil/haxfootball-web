import { Trophy } from "lucide-react";
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
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-primary/35 bg-primary/10 p-3">
      <span className="grid size-10 place-items-center rounded-lg border border-primary/40 bg-primary/15 text-primary">
        <Trophy className="size-5" />
      </span>

      <span className="min-w-0">
        <span className="block truncate font-semibold">{row.player.name}</span>
        <span className="block text-xs text-muted-foreground">Pontuador da partida</span>
      </span>

      <span className="text-right text-2xl">
        <MatchPointsValue points={row.points} pointsMetric={pointsMetric} />
      </span>
    </div>
  );
}
