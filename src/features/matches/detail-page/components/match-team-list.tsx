import type { MatchTeamGroups } from "../utils/create-match-team-groups";
import { cn } from "#/lib/utils";

export function MatchTeamList({
  title,
  tone,
  players,
}: {
  title: string;
  tone: "red" | "blue";
  players: MatchTeamGroups["red"];
}) {
  const isRed = tone === "red";
  const teamColorClassName = isRed
    ? "border-red-400/40 bg-[linear-gradient(135deg,color-mix(in_oklch,#ef4444_18%,transparent),color-mix(in_oklch,var(--card)_94%,black)_52%,color-mix(in_oklch,#ef4444_8%,transparent))]"
    : "border-blue-400/40 bg-[linear-gradient(135deg,color-mix(in_oklch,#3b82f6_18%,transparent),color-mix(in_oklch,var(--card)_94%,black)_52%,color-mix(in_oklch,#3b82f6_8%,transparent))]";
  const badgeClassName = isRed
    ? "border-red-400/40 bg-red-500/12 text-red-200"
    : "border-blue-400/40 bg-blue-500/12 text-blue-200";

  return (
    <section
      className={cn(
        "relative min-h-full overflow-hidden rounded-xl border p-4 shadow-[0_14px_42px_color-mix(in_oklch,black_24%,transparent)]",
        teamColorClassName,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_oklch,var(--foreground)_30%,transparent),transparent)]" />

      <div className="relative mb-4 flex items-center gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-normal">{title}</h3>
          <p className="text-xs text-muted-foreground">{formatPlayersCount(players.length)}</p>
        </div>
        <span
          className={cn(
            "ml-auto inline-flex min-w-10 items-center justify-center rounded-full border px-3 py-1 text-sm font-semibold tabular-nums",
            badgeClassName,
          )}
        >
          {players.length}
        </span>
      </div>

      {players.length > 0 ? (
        <ul className="relative grid gap-2.5">
          {players.map((participation, index) => (
            <li
              key={participation.player.id}
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border/70 bg-background/45 px-3 py-2.5 text-sm font-medium transition hover:border-foreground/25 hover:bg-muted/45"
            >
              <span className="min-w-0 truncate text-foreground">{participation.player.name}</span>
              <span className="rounded-md border border-border/60 bg-background/45 px-2 py-1 text-[0.68rem] font-semibold text-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="relative rounded-lg border border-dashed border-border/80 bg-background/30 p-4 text-center text-sm text-muted-foreground">
          Sem jogadores registrados
        </p>
      )}
    </section>
  );
}

function formatPlayersCount(count: number) {
  return count === 1 ? "1 jogador" : `${count} jogadores`;
}
