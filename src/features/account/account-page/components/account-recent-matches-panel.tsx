import { DataCard } from "#/components/ds/app-shell";
import type { ListMatchesResponse } from "#/server/api/haxfootball";
import { AccountMatchesDialog } from "./account-matches-dialog";
import { AccountMatchRow } from "./account-match-row";

export function AccountRecentMatchesPanel({ matches }: { matches: ListMatchesResponse | null }) {
  const recentMatches = matches?.items ?? [];
  const hasMoreMatches = Boolean(matches?.page.nextCursor);

  return (
    <DataCard title="Últimas partidas" className="h-full">
      {recentMatches.length > 0 ? (
        <div className="space-y-3">
          <div className="grid gap-3">
            {recentMatches.map((match) => (
              <AccountMatchRow key={match.id} match={match} />
            ))}
          </div>

          {matches && hasMoreMatches ? <AccountMatchesDialog initialMatches={matches} /> : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          As partidas associadas às suas entradas aparecerão aqui.
        </p>
      )}
    </DataCard>
  );
}
