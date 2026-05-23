import type { MatchTeamGroups } from "../utils/create-match-team-groups";

export function MatchTeamList({
  title,
  tone,
  players,
}: {
  title: string;
  tone: "red" | "blue";
  players: MatchTeamGroups["red"];
}) {
  return (
    <section className="rounded-xl border bg-background/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={
            tone === "red" ? "size-2 rounded-full bg-red-500" : "size-2 rounded-full bg-blue-500"
          }
        />
        <h3 className="font-semibold">{title}</h3>
        <span className="ml-auto text-sm text-muted-foreground">{players.length}</span>
      </div>

      {players.length > 0 ? (
        <ul className="grid gap-2">
          {players.map((participation) => (
            <li
              key={participation.player.id}
              className="rounded-lg border bg-background/45 px-3 py-2 text-sm font-medium"
            >
              {participation.player.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma entrada registrada.</p>
      )}
    </section>
  );
}
