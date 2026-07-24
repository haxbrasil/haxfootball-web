import { Link } from "@tanstack/react-router";
import type { Room } from "@haxbrasil/haxfootball-api-sdk";
import { DataCard } from "#/components/ds/app-shell";
import { StatusBadge } from "#/components/ds/status-badge";
import { Button } from "#/components/ui/button";
import { roomDisplayName } from "../../room-display-name";

export function RoomCard({ room }: { room: Room }) {
  const displayName = roomDisplayName(room);

  return (
    <DataCard
      title="Sala"
      meta={<StatusBadge value={room.state} />}
      className="border-t-4 border-t-primary"
    >
      <h2
        className="mb-4 line-clamp-2 min-h-[3.5rem] text-xl font-semibold leading-7"
        title={displayName}
      >
        {displayName}
      </h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Programa</dt>
          <dd>{room.program.name}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Versão</dt>
          <dd>{room.version?.version ?? "-"}</dd>
        </div>
      </dl>
      <div className="mt-4 flex gap-2">
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
