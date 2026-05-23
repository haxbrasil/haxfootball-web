import type { ReactNode } from "react";
import type { ListMatchesResponse } from "@haxbrasil/haxfootball-api-sdk";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import { EmptyLeagueState } from "#/components/ds/empty-league-state";
import { InfiniteListBoundary } from "#/components/ds/infinite-list";
import { PubGameRow } from "./pub-game-row";
import { usePubGamesList } from "../hooks/use-pub-games-list";

export function PubGamesDialog({
  matches,
  children,
}: {
  matches: ListMatchesResponse;
  children: ReactNode;
}) {
  const list = usePubGamesList(matches);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="grid max-h-[90vh] grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Partidas das pubs</DialogTitle>
          <DialogDescription>Arquivo de partidas registradas na sala pública.</DialogDescription>
        </DialogHeader>

        <div className="bfl-scrollbar min-h-0 overflow-auto pr-1">
          {list.items.length === 0 ? (
            <EmptyLeagueState
              title="Nenhuma partida encontrada"
              body="As partidas registradas pela sala pública aparecem aqui."
            />
          ) : (
            <div className="grid gap-3">
              {list.items.map((match) => (
                <PubGameRow key={match.id} match={match} />
              ))}
            </div>
          )}

          <InfiniteListBoundary
            hasMore={list.hasMore}
            isLoading={list.isLoadingMore}
            itemCount={list.items.length}
            onLoadMore={list.loadMore}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
