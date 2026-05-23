import { RankingTable } from "#/components/ds/ranking-table";
import type { StatsMetric } from "#/lib/stats-metrics/formatting";
import { createRankedPointsRows, type MatchPointsRow } from "../utils/match-points";
import { MatchPointsValue } from "./match-points-value";

export function MatchPointsLeaderboard({
  rows,
  pointsMetric,
}: {
  rows: MatchPointsRow[];
  pointsMetric: StatsMetric;
}) {
  const rankedRows = createRankedPointsRows(rows);

  return (
    <RankingTable
      rows={rankedRows}
      getRank={(row) => row.rank}
      columns={[
        {
          key: "rank",
          title: "Posição",
          cell: () => null,
        },
        {
          key: "player",
          title: "Nome",
          cell: (row) => <span className="font-medium">{row.player.name}</span>,
        },
        {
          key: "points",
          title: "Pontos",
          cell: (row) => <MatchPointsValue points={row.points} pointsMetric={pointsMetric} />,
        },
      ]}
    />
  );
}
