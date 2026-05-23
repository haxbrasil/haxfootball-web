import { Trophy } from "lucide-react";
import { ActionButton } from "#/components/ds/action-button";
import type { StatsCategoryRanking } from "#/server/api/haxfootball";
import { PubPointsRankingDialog } from "./pub-points-ranking-dialog";
import { PubPointsRankingList } from "./pub-points-ranking-list";
import type { PubRankingFilters } from "../utils/pub-ranking-filters";

export function PubPointsRankingCard({
  category,
  initialFilters,
  totalCount,
}: {
  category: StatsCategoryRanking;
  initialFilters: PubRankingFilters;
  totalCount: number;
}) {
  const visibleRows = category.stats.items.slice(0, 5);
  const hasMore = totalCount > visibleRows.length || Boolean(category.stats.page.nextCursor);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-[linear-gradient(145deg,color-mix(in_oklch,var(--primary)_18%,transparent),color-mix(in_oklch,var(--card)_94%,black)_42%,color-mix(in_oklch,var(--accent)_10%,transparent))] p-4 shadow-[0_22px_70px_color-mix(in_oklch,black_38%,transparent)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--primary),color-mix(in_oklch,var(--accent)_72%,white),transparent)]" />

      <header className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/35 bg-primary/18 text-primary shadow-xs">
            <Trophy className="size-5" />
          </span>

          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">
              Destaque
            </p>
            <h3 className="mt-1 text-2xl font-semibold tracking-normal">Pontos</h3>
          </div>
        </div>

        {hasMore ? (
          <PubPointsRankingDialog
            category={category}
            initialFilters={initialFilters}
            totalCount={totalCount}
          >
            <ActionButton type="button" size="sm" tone="quiet">
              Ver mais
            </ActionButton>
          </PubPointsRankingDialog>
        ) : null}
      </header>

      {visibleRows.length > 0 ? (
        <PubPointsRankingList category={category} rows={visibleRows} />
      ) : (
        <p className="rounded-xl border border-border/80 bg-background/35 p-5 text-center text-sm text-muted-foreground">
          Nenhuma entrada encontrada.
        </p>
      )}
    </section>
  );
}
