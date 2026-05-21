import type { Room } from "@haxbrasil/haxfootball-api-sdk";
import { DataCard, EmptyState, PageHeader } from "#/components/ds/app-shell";
import { StatusBadge } from "#/components/ds/status-badge";
import { Button } from "#/components/ui/button";

export function RoomDetailPage({ room }: { room: Room | null }) {
  if (!room) {
    return <EmptyState title="Sala não encontrada" />;
  }

  return (
    <>
      <PageHeader
        title={room.program?.name ?? room.id}
        description="Detalhes da sala gerenciada."
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
            <dd>{room.createdAt}</dd>
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
