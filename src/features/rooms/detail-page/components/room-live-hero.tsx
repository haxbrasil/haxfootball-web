import { Link } from "@tanstack/react-router";
import { ExternalLink, Trophy, Users } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import type { PublicRoomDetail } from "#/lib/rooms/public-room";
import { roomLiveFreshnessLabel, type RoomLiveFreshness } from "../room-live-view-model";

const freshnessStyles: Record<RoomLiveFreshness, string> = {
  live: "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  delayed: "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  offline: "border-border bg-muted/60 text-muted-foreground",
  unavailable: "border-border bg-background/55 text-muted-foreground",
};

const freshnessDotStyles: Record<RoomLiveFreshness, string> = {
  live: "bg-emerald-500",
  delayed: "bg-amber-500",
  offline: "bg-muted-foreground",
  unavailable: "bg-muted-foreground/60",
};

export function RoomLiveHero({
  room,
  freshness,
}: {
  room: PublicRoomDetail;
  freshness: RoomLiveFreshness;
}) {
  const playerCount = room.live?.players.length ?? null;
  const availabilityLabel =
    room.state === "provisioning" ? "Abrindo sala" : roomLiveFreshnessLabel(freshness);

  return (
    <header className="bfl-field-surface mb-6 overflow-hidden rounded-xl border border-border/80 text-foreground shadow-lg">
      <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 px-2.5 py-1",
                room.state === "provisioning"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : freshnessStyles[freshness],
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  room.state === "provisioning"
                    ? "animate-pulse bg-primary"
                    : freshnessDotStyles[freshness],
                )}
                aria-hidden="true"
              />
              <span aria-live="polite">{availabilityLabel}</span>
            </Badge>
            <Badge variant="outline" className="bg-background/45 text-muted-foreground">
              {room.version}
            </Badge>
          </div>

          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">{room.name}</h1>

          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" aria-hidden="true" />
            {playerCount === null ? (
              room.capacity ? (
                <>Capacidade para {room.capacity} jogadores</>
              ) : (
                <>Sala disponível para jogar e acompanhar</>
              )
            ) : (
              <>
                {playerCount}
                {room.capacity ? ` de ${room.capacity}` : ""}{" "}
                {playerCount === 1 ? "jogador" : "jogadores"}
              </>
            )}
          </p>
        </div>

        <div className="grid gap-2">
          {room.roomLink ? (
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href={room.roomLink}>
                Entrar na sala
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </Button>
          ) : null}
          {room.championship ? (
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/championships/$slug" params={{ slug: room.championship.slug }}>
                <Trophy />
                {room.championship.name}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
