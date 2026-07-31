import { Link } from "@tanstack/react-router";
import { MatchCode } from "#/components/ds/match-code";
import { MatchStatusBadge } from "#/components/ds/match-status-badge";
import { Scoreline } from "#/components/ds/scoreline";
import { Badge } from "#/components/ui/badge";
import { formatDateTime } from "#/lib/date/format-date-time";
import {
  type MatchSummaryPlayer,
  type MatchSummaryRoster,
  matchSummaryPlayers,
} from "#/lib/matches/match-summary-players";
import { cn } from "#/lib/utils";

type MatchSummaryLinkSize = "sm" | "md";

type MatchSummaryLinkMatch = MatchSummaryRoster & {
  id: string;
  initiatedAt: string | null;
  score?: { red?: number | string | null; blue?: number | string | null } | null;
  status: string;
};

export function MatchSummaryLink({
  match,
  size = "md",
  showPlayers = true,
  showPlayerTeams = true,
}: {
  match: MatchSummaryLinkMatch;
  size?: MatchSummaryLinkSize;
  showPlayers?: boolean;
  showPlayerTeams?: boolean;
}) {
  const players = matchSummaryPlayers(match);

  return (
    <Link
      to="/matches/$matchId"
      params={{ matchId: match.id }}
      className="grid gap-4 rounded-xl border bg-background/35 p-4 transition hover:border-primary/40 hover:bg-muted/35 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
    >
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className={cn("truncate font-semibold", size === "sm" ? "text-base" : "text-lg")}>
            <MatchCode id={match.id} />
          </h3>
          <MatchStatusBadge value={match.status} />
          {match.kind === "composed" ? (
            <Badge variant="outline" className="bg-muted/40 text-muted-foreground">
              {match.rounds?.length ?? 0} tempos
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{formatDateTime(match.initiatedAt)}</p>
        {showPlayers && players.length > 0 ? (
          <MatchPlayerBadges players={players} showTeams={showPlayerTeams} />
        ) : null}
      </div>

      <Scoreline red={match.score?.red} blue={match.score?.blue} compact />
    </Link>
  );
}

function MatchPlayerBadges({
  players,
  showTeams,
}: {
  players: MatchSummaryPlayer[];
  showTeams: boolean;
}) {
  const visiblePlayers = players.slice(0, 8);
  const remainingPlayers = players.length - visiblePlayers.length;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Jogadores da partida">
      {visiblePlayers.map((player) => (
        <Badge
          key={player.id}
          variant="outline"
          className={cn(
            "max-w-40 rounded-full px-2.5 py-1 font-medium shadow-sm",
            showTeams
              ? player.team === "red"
                ? "gap-1.5 border-red-400/25 bg-red-500/10 text-red-200"
                : "gap-1.5 border-blue-400/25 bg-blue-500/10 text-blue-200"
              : "border-border/70 bg-muted/45 text-foreground",
          )}
        >
          {showTeams ? (
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                player.team === "red" ? "bg-red-400" : "bg-blue-400",
              )}
            />
          ) : null}
          <span className="truncate">{player.name}</span>
        </Badge>
      ))}
      {remainingPlayers > 0 ? (
        <Badge
          variant="outline"
          className="rounded-full border-border/70 bg-muted/45 px-2.5 py-1 text-muted-foreground"
        >
          +{remainingPlayers}
        </Badge>
      ) : null}
    </div>
  );
}
