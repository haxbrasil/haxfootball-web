import type { ListMatchesResponse } from "@haxbrasil/haxfootball-api-sdk";
import { BroadcastPanel } from "#/components/ds/broadcast-panel";
import { EmptyLeagueState } from "#/components/ds/empty-league-state";
import { InfiniteListBoundary } from "#/components/ds/infinite-list";
import { LeagueHeader } from "#/components/ds/league-header";
import { MatchListRow } from "./components/match-list-row";
import { useMatchesList } from "./hooks/use-matches-list";

export function MatchesPage({ matches }: { matches: ListMatchesResponse }) {
  const list = useMatchesList(matches);

  return (
    <>
      <LeagueHeader
        title="Partidas"
        eyebrow={null}
        showBrand={false}
        description="Placar, status e arquivo das partidas registradas pela sala pública."
      />

      <BroadcastPanel eyebrow="Arquivo" title="Últimas partidas">
        {list.items.length === 0 ? (
          <EmptyLeagueState
            title="Nenhuma partida encontrada"
            body="As partidas registradas pela sala aparecem aqui assim que ficarem disponíveis."
          />
        ) : (
          <div className="grid gap-3">
            {list.items.map((match) => (
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
