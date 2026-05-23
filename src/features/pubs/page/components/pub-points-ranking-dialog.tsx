import type { ReactNode } from "react";
import type { StatsCategoryRanking } from "#/server/api/haxfootball";
import { PubPointsRankingList } from "./pub-points-ranking-list";
import { PubRankingDialogShell } from "./pub-ranking-dialog-shell";
import { usePubCategoryRankingDialog } from "../hooks/use-pub-category-ranking-dialog";
import type { PubRankingFilters } from "../utils/pub-ranking-filters";

export function PubPointsRankingDialog({
  category,
  children,
  initialFilters,
  totalCount,
}: {
  category: StatsCategoryRanking;
  children: ReactNode;
  initialFilters: PubRankingFilters;
  totalCount: number;
}) {
  const ranking = usePubCategoryRankingDialog({ category, initialFilters });

  function handleFilterChange<TField extends keyof PubRankingFilters>(
    field: TField,
    value: PubRankingFilters[TField],
  ) {
    void ranking.updateFilter(field, value);
  }

  function handleOpenChange(isOpen: boolean) {
    void ranking.openDialog(isOpen);
  }

  return (
    <PubRankingDialogShell
      categoryKey={category.key}
      description={`Ranking completo com ${totalCount} entradas.`}
      filters={ranking.filters}
      hasItems={ranking.filteredItems.length > 0}
      isLoading={ranking.isLoading}
      maxWidthClassName="sm:max-w-3xl"
      open={ranking.isOpen}
      search={ranking.search}
      title="Pontos"
      trigger={children}
      onFilterChange={handleFilterChange}
      onOpenChange={handleOpenChange}
      onSearchChange={ranking.setSearch}
    >
      <PubPointsRankingList category={category} rows={ranking.filteredItems} />
    </PubRankingDialogShell>
  );
}
