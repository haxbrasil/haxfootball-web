import type { ListMatchesResponse } from "@haxbrasil/haxfootball-api-sdk";
import { ActionButton } from "#/components/ds/action-button";
import { BroadcastPanel } from "#/components/ds/broadcast-panel";
import { EmptyLeagueState } from "#/components/ds/empty-league-state";
import { PubGameRow } from "./pub-game-row";
import { PubGamesDialog } from "./pub-games-dialog";

export function PubGamesPanel({ matches }: { matches: ListMatchesResponse }) {
  const hasMore = Boolean(matches.page.nextCursor);

  return (
    <BroadcastPanel
      eyebrow="Partidas"
      title="Últimos jogos das pubs"
      action={
        hasMore ? (
          <PubGamesDialog matches={matches}>
            <ActionButton type="button" size="sm" tone="quiet">
              Ver mais
            </ActionButton>
          </PubGamesDialog>
        ) : null
      }
      className="xl:sticky xl:top-20"
    >
      {matches.items.length === 0 ? (
        <EmptyLeagueState
          title="Nenhuma partida encontrada"
          body="As partidas registradas pela sala pública aparecem aqui."
        />
      ) : (
        <div className="grid gap-3">
          {matches.items.slice(0, 5).map((match) => (
            <PubGameRow key={match.id} match={match} />
          ))}
        </div>
      )}
    </BroadcastPanel>
  );
}
