import { useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { InfiniteListBoundary } from "#/components/ds/infinite-list";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { useInfinitePage } from "#/hooks/use-infinite-page";
import { matchRoundLabel } from "#/lib/matches/composition-rounds";
import type {
  WebMatchEvent,
  WebMatchEventsPage,
  WebRoundMatchEvent,
} from "#/server/api/haxfootball";
import { listMatchEventsFn } from "#/server/api/functions";

export function MatchEventsPanel({
  matchId,
  initialEvents,
}: {
  matchId: string;
  initialEvents: WebMatchEventsPage;
}) {
  const listEvents = useServerFn(listMatchEventsFn);
  const limit = initialEvents.page.limit;
  const loadPage = useCallback(
    (cursor: string) => listEvents({ data: { matchId, cursor, limit } }),
    [limit, listEvents, matchId],
  );
  const events = useInfinitePage<WebMatchEvent | WebRoundMatchEvent, WebMatchEventsPage>({
    initialPage: initialEvents,
    loadPage,
    resetKey: matchId,
  });

  if (events.items.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eventos</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {events.items.map((item) => {
          const round = "event" in item ? item.round : null;
          const event = "event" in item ? item.event : item;

          return (
            <div
              key={`${round?.matchId ?? matchId}:${event.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                {round ? <Badge variant="secondary">{matchRoundLabel(round)}</Badge> : null}
                <span className="text-sm font-medium">{event.type}</span>
                {event.actorPlayer ? (
                  <span className="text-sm text-muted-foreground">{event.actorPlayer.name}</span>
                ) : null}
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {event.elapsedSeconds === null
                  ? "Tempo não informado"
                  : `${Number(event.elapsedSeconds).toFixed(1)} s`}
              </span>
            </div>
          );
        })}

        <InfiniteListBoundary
          hasMore={events.hasMore}
          isLoading={events.isLoadingMore}
          itemCount={events.items.length}
          onLoadMore={events.loadMore}
        />
      </CardContent>
    </Card>
  );
}
