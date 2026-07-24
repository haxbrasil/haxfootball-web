import { Link } from "@tanstack/react-router";
import type { Room } from "@haxbrasil/haxfootball-api-sdk";
import { DataCard } from "#/components/ds/app-shell";
import { StatusBadge } from "#/components/ds/status-badge";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { roomDisplayName } from "../../room-display-name";

export function RoomCard({ room }: { room: Room }) {
  const displayName = roomDisplayName(room);

  return (
    <DataCard
      title="Sala"
      meta={
        <div className="flex flex-wrap justify-end gap-2">
          <StatusBadge value={room.state} />
          <Badge variant="outline" className="bg-muted/40 text-muted-foreground">
            {room.version.version}
          </Badge>
        </div>
      }
      className="border-t-4 border-t-primary"
    >
      <h2
        className="mb-4 line-clamp-2 min-h-[3.5rem] text-xl font-semibold leading-7"
        title={displayName}
      >
        {displayName}
      </h2>
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to="/rooms/$roomId" params={{ roomId: room.id }}>
            Detalhes
          </Link>
        </Button>
        {room.roomLink ? (
          <Button asChild size="sm">
            <a href={room.roomLink}>Entrar</a>
          </Button>
        ) : null}
      </div>
    </DataCard>
  );
}
