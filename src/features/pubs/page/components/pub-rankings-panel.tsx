import { EmptyLeagueState } from "#/components/ds/empty-league-state";
import type { StatsCategoryRankingsResponse } from "#/server/api/haxfootball";
import { PubCategoryRankingSection } from "./pub-category-ranking-section";
import { PubPointsRankingCard } from "./pub-points-ranking-card";
import { splitPubPointsRanking } from "../utils/pub-points-ranking";
import type { PubRankingFilters } from "../utils/pub-ranking-filters";

export function PubRankingsPanel({
  rankings,
  initialFilters,
}: {
  rankings: StatsCategoryRankingsResponse;
  initialFilters: PubRankingFilters;
}) {
  const { pointsCategory, regularCategories } = splitPubPointsRanking(rankings);

  if (!pointsCategory && regularCategories.length === 0) {
    return (
      <EmptyLeagueState
        title="Nenhum ranking encontrado"
        body="Os rankings das pubs aparecem quando houver partidas com estatísticas registradas."
      />
    );
  }

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">
          Rankings
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-normal">Rankings das pubs</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Veja quem está liderando cada categoria nas partidas da sala pública.
        </p>
      </div>

      {pointsCategory ? (
        <PubPointsRankingCard
          category={pointsCategory}
          initialFilters={initialFilters}
          totalCount={Number(pointsCategory.stats.meta.totals.groupsCount)}
        />
      ) : null}

      {regularCategories.map((category) => (
        <PubCategoryRankingSection
          key={category.key}
          category={category}
          initialFilters={initialFilters}
          totalCount={Number(category.stats.meta.totals.groupsCount)}
        />
      ))}
    </section>
  );
}
