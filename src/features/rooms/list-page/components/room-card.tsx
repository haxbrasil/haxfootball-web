import { Link } from "@tanstack/react-router";
import { DataCard } from "#/components/ds/app-shell";
import { StatusBadge } from "#/components/ds/status-badge";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import type { PublicRoomSummary } from "#/lib/rooms/public-room";

export function RoomCard({ room }: { room: PublicRoomSummary }) {
  return (
    <DataCard
      title="Sala"
      meta={
        <div className="flex flex-wrap justify-end gap-2">
          <StatusBadge value={room.state} />
          <Badge variant="outline" className="bg-muted/40 text-muted-foreground">
            {room.version}
          </Badge>
        </div>
      }
      className="border-t-4 border-t-primary"
    >
      <h2
        className="mb-4 line-clamp-2 min-h-[3.5rem] text-xl font-semibold leading-7"
        title={room.name}
      >
        {room.name}
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
