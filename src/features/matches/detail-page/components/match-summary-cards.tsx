import { DataCard } from "#/components/ds/app-shell";
import { StatusBadge } from "#/components/ds/status-badge";
import type { MatchDetail } from "#/server/api/haxfootball";
import { SummaryRow } from "./summary-row";

export function MatchSummaryCards({ detail }: { detail: MatchDetail }) {
  const { match, statEvents, canModerateStats } = detail;

  if (!match) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <DataCard title="Resumo" meta={<StatusBadge value={match.status} />}>
        <dl className="grid gap-3 text-sm">
          <SummaryRow
            label="Placar"
            value={match.score ? `${match.score.red} x ${match.score.blue}` : "-"}
          />
          <SummaryRow label="Início" value={match.initiatedAt ?? "-"} />
          <SummaryRow label="Fim" value={match.endedAt ?? "-"} />
          <SummaryRow label="Schema" value={match.statEventSchema?.id ?? "-"} />
        </dl>
      </DataCard>

      <DataCard title="Contribuição">
        <dl className="grid gap-3 text-sm">
          <SummaryRow label="Eventos de sala" value={String(match.events.length)} />
          <SummaryRow label="Participações" value={String(match.participations.length)} />
          <SummaryRow label="Eventos de stats" value={String(statEvents.items.length)} />
        </dl>
      </DataCard>

      <DataCard title="Moderação">
        <p className="text-sm text-muted-foreground">
          {canModerateStats
            ? "Você pode desabilitar eventos de stats desta partida."
            : "Entre com uma conta autorizada para moderar eventos de stats."}
        </p>
      </DataCard>
    </div>
  );
}
