import type { ListMatchesResponse } from "@haxbrasil/haxfootball-api-sdk";
import type { StatsCategoryRankingsResponse } from "#/server/api/haxfootball";
import { Skeleton } from "#/components/ui/skeleton";
import { PubGamesPanel } from "./components/pub-games-panel";
import { PubOverview } from "./components/pub-overview";
import { PubRankingsPanel } from "./components/pub-rankings-panel";
import { defaultPubRankingFilters } from "./utils/pub-ranking-filters";

export function PubsPage({
  matches,
  matchCount,
  rankings,
}: {
  matches: ListMatchesResponse;
  matchCount: number;
  rankings: StatsCategoryRankingsResponse;
}) {
  return (
    <div className="grid gap-5">
      <PubOverview matchCount={matchCount} />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <PubGamesPanel matches={matches} />
        <PubRankingsPanel rankings={rankings} initialFilters={defaultPubRankingFilters} />
      </div>
    </div>
  );
}

export function PubsPageSkeleton() {
  return (
    <div className="grid gap-5" aria-label="Carregando pubs">
      <section className="bfl-field-surface overflow-hidden rounded-xl border border-border/80 p-5 shadow-lg">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-12 w-40" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      </section>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <PanelSkeleton rows={5} />
        <PanelSkeleton rows={8} />
      </div>
    </div>
  );
}

function PanelSkeleton({ rows }: { rows: number }) {
  return (
    <section className="bfl-panel overflow-hidden rounded-xl border border-border/80">
      <div className="bfl-panel-header border-b px-4 py-3">
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="grid gap-3 p-4">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    </section>
  );
}
