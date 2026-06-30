import type { Room } from "@haxbrasil/haxfootball-api-sdk";
import { DataCard, EmptyState } from "#/components/ds/app-shell";
import { LeagueHeader } from "#/components/ds/league-header";
import { StatusBadge } from "#/components/ds/status-badge";
import { Button } from "#/components/ui/button";
import { formatDateTime } from "#/lib/date/format-date-time";

export function RoomDetailPage({
  room,
  description = "Estado público, versão e link da sala.",
}: {
  room: Room | null;
  description?: string;
}) {
  if (!room) {
    return <EmptyState title="Sala não encontrada" />;
  }

  return (
    <>
      <LeagueHeader
        title={room.program?.name ?? room.id}
        eyebrow={null}
        showBrand={false}
        description={description}
        action={
          room.roomLink ? (
            <Button asChild>
              <a href={room.roomLink}>Entrar</a>
            </Button>
          ) : null
        }
      />
      <DataCard title="Estado" meta={<StatusBadge value={room.state} />}>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">ID</dt>
            <dd>{room.id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Versão</dt>
            <dd>{room.version?.version ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Criada em</dt>
            <dd>{formatDateTime(room.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Falha</dt>
            <dd>{room.failureReason ?? "-"}</dd>
          </div>
        </dl>
      </DataCard>
    </>
  );
}
