import { Sparkles } from "lucide-react";
import { DataCard } from "#/components/ds/app-shell";
import type { MatchDetail } from "#/server/api/haxfootball";
import { MatchPointsLeaderboard } from "./match-points-leaderboard";
import { SingleScorerPointsCard } from "./single-scorer-points-card";
import { getMatchPointsMetric, getMatchScoringRows } from "../utils/match-points";

export function MatchPointsPanel({ detail }: { detail: MatchDetail }) {
  const pointsMetric = getMatchPointsMetric(detail);
  const rows = pointsMetric ? getMatchScoringRows(detail.metrics ?? [], pointsMetric.key) : [];

  if (!pointsMetric || rows.length === 0) {
    return null;
  }

  const meta = (
    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
      <Sparkles className="size-3.5" />
      {rows.length === 1 ? "Destaque" : "Ranking"}
    </span>
  );

  return (
    <DataCard title="Pontos" meta={meta} className="border-primary/30">
      {rows.length === 1 ? (
        <SingleScorerPointsCard row={rows[0]!} pointsMetric={pointsMetric} />
      ) : (
        <MatchPointsLeaderboard rows={rows} pointsMetric={pointsMetric} />
      )}
    </DataCard>
  );
}
