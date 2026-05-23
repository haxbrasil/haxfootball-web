import { RankingTable } from "#/components/ds/ranking-table";
import { formatMetricValue } from "#/lib/stats-metrics/formatting";
import { formatMetricLabel } from "#/lib/stats-metrics/labels";
import type { StatsCategoryRanking, WebQueryMatchMetricsResponse } from "#/server/api/haxfootball";

export function PubCategoryRankingTable({
  category,
  rows,
}: {
  category: StatsCategoryRanking;
  rows: WebQueryMatchMetricsResponse["items"];
}) {
  return (
    <RankingTable
      rows={rows}
      getRank={(item) => item.rank}
      columns={[
        {
          key: "rank",
          title: "#",
          cell: (item) => item.rank,
        },
        {
          key: "name",
          title: "Nome",
          cell: (item) => item.group.name,
        },
        {
          key: "matches",
          title: "Partidas",
          cell: (item) => item.contribution.matchesCount,
        },
        ...category.metrics.map((metric) => ({
          key: metric.key,
          title: formatMetricLabel(metric.key, metric.label),
          cell: (item: WebQueryMatchMetricsResponse["items"][number]) =>
            formatMetricValue(item.metrics[metric.key], metric),
        })),
      ]}
    />
  );
}
