import type {
  StatsCategoryRanking,
  StatsQuery,
  WebQueryMatchMetricsResponse,
} from "#/server/api/haxfootball";
import type { PubRankingFilters } from "./pub-ranking-filters";

type QueryStats = (input: { data: StatsQuery }) => Promise<WebQueryMatchMetricsResponse | null>;

export async function loadFullPubCategoryRanking({
  category,
  filters,
  queryStats,
}: {
  category: StatsCategoryRanking;
  filters: PubRankingFilters;
  queryStats: QueryStats;
}) {
  const pages: WebQueryMatchMetricsResponse[] = [];
  let cursor: string | undefined;

  do {
    const page = await queryStats({
      data: {
        ...filters,
        cursor,
        direction: "desc",
        limit: 100,
        metrics: category.metricKeys,
        sortKey: category.primaryMetricKey,
        sortType: "metric",
      },
    });

    if (!page) {
      break;
    }

    pages.push(page);
    cursor = page.page.nextCursor ?? undefined;
  } while (cursor);

  const firstPage = pages[0];
  const lastPage = pages.at(-1);

  return firstPage && lastPage
    ? {
        ...lastPage,
        items: pages.flatMap((page) => page.items),
      }
    : null;
}

export function createEmptyPubCategoryStats(
  category: StatsCategoryRanking,
): WebQueryMatchMetricsResponse {
  return {
    ...category.stats,
    items: [],
    page: {
      limit: 100,
      nextCursor: null,
    },
  };
}
