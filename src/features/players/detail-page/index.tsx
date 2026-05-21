import { EmptyState, PageHeader } from "#/components/ds/app-shell";
import type { PlayerDetail } from "#/server/api/haxfootball";
import { PlayerMatchesTable } from "./components/player-matches-table";
import { PlayerMetricDetailsTable } from "./components/player-metric-details-table";
import { PlayerMetrics } from "./components/player-metrics";
import { PlayerProfileCard } from "./components/player-profile-card";

export function PlayerDetailPage({ detail }: { detail: PlayerDetail }) {
  const { player, matches, stats } = detail;

  if (!player) {
    return <EmptyState title="Jogador não encontrado" />;
  }

  return (
    <>
      <PageHeader
        title={player.name}
        description={
          player.account ? `Conta: ${player.account.name}` : "Jogador sem conta vinculada."
        }
      />

      <PlayerProfileCard player={player} />

      <section className="mt-6">
        <PlayerMetrics stats={stats} />
      </section>

      <section className="mt-6">
        <PlayerMatchesTable matches={matches} />
      </section>

      <section className="mt-6">
        <PlayerMetricDetailsTable stats={stats} />
      </section>
    </>
  );
}
