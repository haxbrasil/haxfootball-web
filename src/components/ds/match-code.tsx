import { formatMatchCode } from "#/lib/matches/format-match-code";
import { cn } from "#/lib/utils";

export function MatchCode({ id, className }: { id: string; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <span className="shrink-0">Partida</span>
      <span className="truncate rounded-md border bg-muted/60 px-1.5 py-0.5 font-mono text-[0.82em] tracking-[0.08em] text-foreground">
        {formatMatchCode(id)}
      </span>
    </span>
  );
}
