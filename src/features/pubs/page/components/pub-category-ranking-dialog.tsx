import type { ReactNode } from "react";
import type { StatsCategoryRanking } from "#/server/api/haxfootball";
import { PubCategoryRankingTable } from "./pub-category-ranking-table";
import { PubRankingDialogShell } from "./pub-ranking-dialog-shell";
import { usePubCategoryRankingDialog } from "../hooks/use-pub-category-ranking-dialog";
import type { PubRankingFilters } from "../utils/pub-ranking-filters";

export function PubCategoryRankingDialog({
  category,
  initialFilters,
  totalCount,
  children,
}: {
  category: StatsCategoryRanking;
  initialFilters: PubRankingFilters;
  totalCount: number;
  children: ReactNode;
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
      description={`Ranking completo com ${totalCount} entradas nesta categoria.`}
      filters={ranking.filters}
      hasItems={ranking.filteredItems.length > 0}
      isLoading={ranking.isLoading}
      open={ranking.isOpen}
      search={ranking.search}
      title={category.title}
      trigger={children}
      onFilterChange={handleFilterChange}
      onOpenChange={handleOpenChange}
      onSearchChange={ranking.setSearch}
    >
      <PubCategoryRankingTable category={category} rows={ranking.filteredItems} />
    </PubRankingDialogShell>
  );
}
