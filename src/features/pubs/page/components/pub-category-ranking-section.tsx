import { ActionButton } from "#/components/ds/action-button";
import type { StatsCategoryRanking } from "#/server/api/haxfootball";
import { PubCategoryRankingDialog } from "./pub-category-ranking-dialog";
import { PubCategoryRankingTable } from "./pub-category-ranking-table";
import type { PubRankingFilters } from "../utils/pub-ranking-filters";

export function PubCategoryRankingSection({
  category,
  initialFilters,
  totalCount,
}: {
  category: StatsCategoryRanking;
  initialFilters: PubRankingFilters;
  totalCount: number;
}) {
  const hasMore =
    totalCount > category.stats.items.length || Boolean(category.stats.page.nextCursor);

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border border-border/80">
      <header className="bfl-panel-header flex items-center justify-between gap-3 border-b px-4 py-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {category.title}
        </h3>

        {hasMore ? (
          <PubCategoryRankingDialog
            category={category}
            initialFilters={initialFilters}
            totalCount={totalCount}
          >
            <ActionButton type="button" size="sm" tone="quiet">
              Ver mais
            </ActionButton>
          </PubCategoryRankingDialog>
        ) : null}
      </header>

      <div className="p-4">
        <PubCategoryRankingTable category={category} rows={category.stats.items.slice(0, 10)} />
      </div>
    </section>
  );
}
