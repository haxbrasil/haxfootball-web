import type { PublicLivePlayer } from "#/lib/rooms/public-room";

export function RoomSpectators({ players }: { players: PublicLivePlayer[] }) {
  return (
    <section
      className="border-t border-border/80 bg-muted/20 p-4 sm:p-5"
      aria-labelledby="spectators-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <h2
            id="spectators-title"
            className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            Espectadores
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {players.length} {players.length === 1 ? "pessoa" : "pessoas"}
          </p>
        </div>

        {players.length ? (
          <ul className="flex flex-wrap gap-2" aria-label="Espectadores na sala">
            {players.map((player) => (
              <li
                key={player.roomPlayerId}
                className="rounded-full border border-border/70 bg-background/55 px-3 py-1.5 text-sm"
              >
                {player.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Ninguém acompanhando no momento.</p>
        )}
      </div>
    </section>
  );
}
