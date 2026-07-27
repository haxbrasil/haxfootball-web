import type { PublicLivePlayer } from "#/lib/rooms/public-room";
import { cn } from "#/lib/utils";

const teamStyles = {
  red: {
    dot: "bg-red-500",
    label: "Red",
    surface: "bg-red-500/[0.045]",
    text: "text-red-700 dark:text-red-300",
  },
  blue: {
    dot: "bg-blue-500",
    label: "Blue",
    surface: "bg-blue-500/[0.045]",
    text: "text-blue-700 dark:text-blue-300",
  },
} as const;

export function LiveTeamRoster({
  team,
  players,
}: {
  team: "red" | "blue";
  players: PublicLivePlayer[];
}) {
  const styles = teamStyles[team];

  return (
    <section className={cn("p-4 sm:p-5", styles.surface)} aria-labelledby={`${team}-team-title`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          id={`${team}-team-title`}
          className={cn(
            "flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em]",
            styles.text,
          )}
        >
          <span className={cn("size-2 rounded-full", styles.dot)} aria-hidden="true" />
          Time {styles.label}
        </h2>
        <span className="text-xs text-muted-foreground">
          {players.length} {players.length === 1 ? "jogador" : "jogadores"}
        </span>
      </div>

      {players.length ? (
        <ul className="grid gap-2" aria-label={`Jogadores do time ${styles.label}`}>
          {players.map((player) => (
            <li
              key={player.roomPlayerId}
              className="rounded-lg border border-border/70 bg-background/55 px-3 py-2.5 text-sm font-medium"
            >
              {player.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border/70 px-3 py-5 text-center text-sm text-muted-foreground">
          Nenhum jogador em campo.
        </p>
      )}
    </section>
  );
}
