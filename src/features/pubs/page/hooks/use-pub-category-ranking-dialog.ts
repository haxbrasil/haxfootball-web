import { useCallback, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { queryStatsFn } from "#/server/api/functions";
import type { StatsCategoryRanking, WebQueryMatchMetricsResponse } from "#/server/api/haxfootball";
import { filterPubRankingItems } from "../utils/filter-pub-ranking-items";
import {
  createEmptyPubCategoryStats,
  loadFullPubCategoryRanking,
} from "../utils/load-pub-category-ranking";
import type { PubRankingFilters } from "../utils/pub-ranking-filters";

export function usePubCategoryRankingDialog({
  category,
  initialFilters,
}: {
  category: StatsCategoryRanking;
  initialFilters: PubRankingFilters;
}) {
  const queryStats = useServerFn(queryStatsFn);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<PubRankingFilters>({
    groupBy: initialFilters.groupBy,
    status: initialFilters.status,
  });
  const [stats, setStats] = useState<WebQueryMatchMetricsResponse>(() => category.stats);

  const filteredItems = useMemo(() => filterPubRankingItems(stats.items, search), [search, stats]);

  const loadRanking = useCallback(
    async (nextFilters: PubRankingFilters) => {
      setIsLoading(true);

      try {
        const fullStats = await loadFullPubCategoryRanking({
          category,
          filters: nextFilters,
          queryStats,
        });

        setStats(fullStats ?? createEmptyPubCategoryStats(category));
      } finally {
        setIsLoading(false);
      }
    },
    [category, queryStats],
  );

  async function openDialog(nextOpen: boolean) {
    setIsOpen(nextOpen);

    if (nextOpen) {
      await loadRanking(filters);
    }
  }

  async function updateFilter<TField extends keyof PubRankingFilters>(
    field: TField,
    value: PubRankingFilters[TField],
  ) {
    const nextFilters = {
      ...filters,
      [field]: value,
    };

    setFilters(nextFilters);
    await loadRanking(nextFilters);
  }

  return {
    filteredItems,
    filters,
    isLoading,
    isOpen,
    openDialog,
    search,
    setSearch,
    stats,
    updateFilter,
  };
}
