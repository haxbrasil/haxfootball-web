import { Swords } from "lucide-react";
import { cn } from "#/lib/utils";

export function Scoreline({
  red,
  blue,
  compact = false,
  fullWidth = false,
}: {
  red?: number | string | null;
  blue?: number | string | null;
  compact?: boolean;
  fullWidth?: boolean;
}) {
  const hasScore = red !== null && red !== undefined && blue !== null && blue !== undefined;

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto_1fr] items-stretch overflow-hidden rounded-xl border bg-background/70 font-semibold shadow-sm",
        compact ? "min-w-28 text-sm" : "min-w-56",
        fullWidth ? "w-full" : "inline-grid",
      )}
    >
      <span
        className={cn(
          "grid place-items-center gap-1 bg-red-500/10 px-3",
          compact ? "py-2" : "py-5",
        )}
      >
        {!compact ? (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="size-2 rounded-full bg-red-500" />
            RED
          </span>
        ) : null}
        <span className={cn("text-foreground", compact ? "text-base" : "text-5xl")}>
          {hasScore ? red : "-"}
        </span>
      </span>

      <span className="grid place-items-center border-x px-3 text-xs font-medium uppercase text-muted-foreground">
        <Swords className={cn(compact ? "size-3.5" : "size-4")} />
      </span>

      <span
        className={cn(
          "grid place-items-center gap-1 bg-blue-500/10 px-3",
          compact ? "py-2" : "py-5",
        )}
      >
        {!compact ? (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="size-2 rounded-full bg-blue-500" />
            BLUE
          </span>
        ) : null}
        <span className={cn("text-foreground", compact ? "text-base" : "text-5xl")}>
          {hasScore ? blue : "-"}
        </span>
      </span>
    </div>
  );
}
