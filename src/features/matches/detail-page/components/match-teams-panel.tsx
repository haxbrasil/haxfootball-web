import { Swords, Trophy, Users } from "lucide-react";
import { MatchStatusBadge } from "#/components/ds/match-status-badge";
import { cn } from "#/lib/utils";
import type { MatchDetail } from "#/server/api/haxfootball";
import { createMatchTeamGroups, type MatchTeamGroups } from "../utils/create-match-team-groups";

export function MatchTeamsPanel({ detail }: { detail: MatchDetail }) {
  const { match } = detail;

  if (!match) {
    return null;
  }

  const participations =
    match.kind === "single"
      ? match.participations
      : match.rounds.flatMap((round) => round.match.participations);
  const teams = createMatchTeamGroups(participations);
  const hasScore =
    match.score?.red !== null &&
    match.score?.red !== undefined &&
    match.score?.blue !== null &&
    match.score?.blue !== undefined;

  return (
    <article className="bfl-panel relative overflow-hidden rounded-xl border border-border/80 bg-[linear-gradient(145deg,color-mix(in_oklch,#ef4444_12%,transparent),color-mix(in_oklch,var(--card)_95%,black)_45%,color-mix(in_oklch,#3b82f6_12%,transparent))] p-4 text-card-foreground shadow-[0_24px_76px_color-mix(in_oklch,black_40%,transparent)]">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(90deg,color-mix(in_oklch,var(--foreground)_6%,transparent)_1px,transparent_1px),linear-gradient(180deg,color-mix(in_oklch,var(--foreground)_5%,transparent)_1px,transparent_1px)] [background-size:76px_100%,100%_46px]" />

      <div className="relative mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-border/80 bg-muted/60 text-foreground shadow-xs">
            <Trophy className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-normal text-muted-foreground">
              Resumo da partida
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal">Resultado</h2>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden w-fit items-center gap-2 rounded-full border border-border/80 bg-background/45 px-3 py-1 text-xs font-semibold text-muted-foreground sm:inline-flex">
            <Users className="size-3.5" />
            {teams.red.length + teams.blue.length}
          </span>
          <MatchStatusBadge value={match.status} />
        </div>
      </div>

      <div className="relative grid items-stretch gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <TeamResultCard
          players={teams.red}
          score={hasScore ? match.score?.red : "-"}
          title="RED"
          tone="red"
        />

        <div className="grid place-items-center">
          <span className="grid size-12 place-items-center rounded-full border border-border/80 bg-background/75 text-muted-foreground shadow-[0_12px_30px_color-mix(in_oklch,black_30%,transparent)]">
            <Swords className="size-5" />
          </span>
        </div>

        <TeamResultCard
          players={teams.blue}
          score={hasScore ? match.score?.blue : "-"}
          title="BLUE"
          tone="blue"
        />
      </div>
    </article>
  );
}

function TeamResultCard({
  players,
  score,
  title,
  tone,
}: {
  players: MatchTeamGroups["red"];
  score: number | string | null | undefined;
  title: string;
  tone: "red" | "blue";
}) {
  const isRed = tone === "red";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-xl border p-4 shadow-[0_14px_44px_color-mix(in_oklch,black_24%,transparent)]",
        isRed
          ? "border-red-400/40 bg-[linear-gradient(135deg,color-mix(in_oklch,#ef4444_20%,transparent),color-mix(in_oklch,var(--card)_94%,black)_56%,color-mix(in_oklch,#ef4444_8%,transparent))]"
          : "border-blue-400/40 bg-[linear-gradient(225deg,color-mix(in_oklch,#3b82f6_20%,transparent),color-mix(in_oklch,var(--card)_94%,black)_56%,color-mix(in_oklch,#3b82f6_8%,transparent))]",
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-normal",
              isRed ? "text-red-200/90" : "text-blue-200/90",
            )}
          >
            {title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{formatPlayersCount(players.length)}</p>
        </div>

        <span
          className={cn(
            "rounded-full border px-3 py-1 text-sm font-semibold tabular-nums",
            isRed
              ? "border-red-400/40 bg-red-500/12 text-red-200"
              : "border-blue-400/40 bg-blue-500/12 text-blue-200",
          )}
        >
          {players.length}
        </span>
      </div>

      <div className="mb-4 text-6xl font-semibold leading-none text-foreground tabular-nums">
        {score ?? "-"}
      </div>

      {players.length > 0 ? (
        <ul className="grid gap-2">
          {players.map((participation, index) => (
            <li
              key={participation.player.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border/70 bg-background/42 px-3 py-2.5 text-sm font-medium transition hover:border-foreground/25 hover:bg-muted/45"
            >
              <span className="min-w-0 truncate text-foreground">{participation.player.name}</span>
              <span className="rounded-md border border-border/60 bg-background/45 px-2 py-1 text-[0.68rem] font-semibold text-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border/80 bg-background/30 p-4 text-center text-sm text-muted-foreground">
          Sem jogadores registrados
        </p>
      )}
    </section>
  );
}

function formatPlayersCount(count: number) {
  return count === 1 ? "1 jogador" : `${count} jogadores`;
}
