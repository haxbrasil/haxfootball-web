import { Link } from "@tanstack/react-router";
import { MatchCode } from "#/components/ds/match-code";
import { MatchStatusBadge } from "#/components/ds/match-status-badge";
import type { ListMatchesResponse } from "#/server/api/haxfootball";
import { formatAccountMatchDate } from "../utils/format-account-match-date";

type AccountMatch = ListMatchesResponse["items"][number];

export function AccountMatchRow({ match }: { match: AccountMatch }) {
  const score = match.score ? `${match.score.red} x ${match.score.blue}` : "Placar pendente";

  return (
    <Link
      to="/matches/$matchId"
      params={{ matchId: match.id }}
      className="grid gap-2 rounded-lg border bg-background/40 p-3 transition-colors hover:bg-background/70"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium">
          <MatchCode id={match.id} />
        </p>
        <MatchStatusBadge value={match.status} />
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{formatAccountMatchDate(match.initiatedAt ?? match.createdAt)}</span>
        <span className="font-medium text-foreground">{score}</span>
      </div>
    </Link>
  );
}
