import { Link } from "@tanstack/react-router";
import { MatchCode } from "#/components/ds/match-code";
import { MatchStatusBadge } from "#/components/ds/match-status-badge";
import { Scoreline } from "#/components/ds/scoreline";
import { Badge } from "#/components/ui/badge";
import { formatDateTime } from "#/lib/date/format-date-time";
import { cn } from "#/lib/utils";

type MatchSummaryLinkSize = "sm" | "md";

type MatchSummaryLinkMatch = {
  id: string;
  initiatedAt: string | null;
  score?: { red?: number | string | null; blue?: number | string | null } | null;
  status: string;
  kind?: "single" | "composed";
  rounds?: unknown[];
};

export function MatchSummaryLink({
  match,
  size = "md",
}: {
  match: MatchSummaryLinkMatch;
  size?: MatchSummaryLinkSize;
}) {
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
            <Badge variant="secondary">{match.rounds?.length ?? 0} tempos</Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{formatDateTime(match.initiatedAt)}</p>
      </div>

      <Scoreline red={match.score?.red} blue={match.score?.blue} compact />
    </Link>
  );
}
