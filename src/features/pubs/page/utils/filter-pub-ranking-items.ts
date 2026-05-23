import type { WebQueryMatchMetricsResponse } from "#/server/api/haxfootball";

export function filterPubRankingItems(
  items: WebQueryMatchMetricsResponse["items"],
  search: string,
) {
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

  if (!normalizedSearch) {
    return items;
  }

  return items.filter((item) =>
    item.group.name.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
  );
}
