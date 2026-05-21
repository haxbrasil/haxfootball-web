import { DataCard } from "#/components/ds/app-shell";
import type { PlayerDetail } from "#/server/api/haxfootball";

export function PlayerProfileCard({ player }: { player: NonNullable<PlayerDetail["player"]> }) {
  return (
    <DataCard title="Perfil">
      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">ID</dt>
          <dd>{player.id}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">País</dt>
          <dd>{player.country?.toUpperCase() ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Conta</dt>
          <dd>{player.account?.name ?? "-"}</dd>
        </div>
      </dl>
    </DataCard>
  );
}
