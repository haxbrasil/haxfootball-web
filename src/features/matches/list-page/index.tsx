import { useMemo, useState } from "react";
import type { ListMatchesResponse } from "@haxbrasil/haxfootball-api-sdk";
import { BroadcastPanel } from "#/components/ds/broadcast-panel";
import { EmptyLeagueState } from "#/components/ds/empty-league-state";
import { InfiniteListBoundary } from "#/components/ds/infinite-list";
import { LeagueHeader } from "#/components/ds/league-header";
import { Skeleton } from "#/components/ui/skeleton";
import { MatchListFilters } from "./components/match-list-filters";
import { MatchListRow } from "./components/match-list-row";
import { useMatchesList } from "./hooks/use-matches-list";
import {
  defaultMatchListFilters,
  filterMatches,
  type MatchListFilterState,
} from "./utils/match-list-filters";

export function MatchesPage({ matches }: { matches: ListMatchesResponse }) {
  const list = useMatchesList(matches);
  const [filters, setFilters] = useState<MatchListFilterState>(defaultMatchListFilters);
  const visibleItems = useMemo(() => filterMatches(list.items, filters), [filters, list.items]);

  function updateFilters(patch: Partial<MatchListFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  return (
    <>
      <LeagueHeader
        title="Partidas"
        eyebrow={null}
        showBrand={false}
        description="Placar, status e arquivo das partidas registradas pela sala pública."
      />

      <BroadcastPanel
        eyebrow="Arquivo"
        title="Últimas partidas"
        action={
          <MatchListFilters
            filters={filters}
            onChange={updateFilters}
            onReset={() => setFilters(defaultMatchListFilters)}
          />
        }
      >
        {visibleItems.length === 0 ? (
          <EmptyLeagueState
            title="Nenhuma partida encontrada"
            body={
              visibleItems.length === 0 && list.items.length > 0
                ? "Nenhuma partida carregada corresponde aos filtros atuais."
                : "As partidas registradas pela sala aparecem aqui assim que ficarem disponíveis."
            }
          />
        ) : (
          <div className="grid gap-3">
            {visibleItems.map((match) => (
              <MatchListRow key={match.id} match={match} />
            ))}
          </div>
        )}

        <InfiniteListBoundary
          hasMore={list.hasMore}
          isLoading={list.isLoadingMore}
          itemCount={list.items.length}
          onLoadMore={list.loadMore}
        />
      </BroadcastPanel>
    </>
  );
}

export function MatchesPageSkeleton() {
  return (
    <div className="space-y-6" aria-label="Carregando partidas">
      <Skeleton className="h-36 w-full rounded-xl" />
      <section className="bfl-panel overflow-hidden rounded-xl border">
        <div className="bfl-panel-header border-b px-4 py-3">
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="grid gap-3 p-4">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}
