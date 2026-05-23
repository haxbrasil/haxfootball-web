import type { AccountLinkedSessionEntry } from "#/server/api/haxfootball";
import { formatSessionEntryJoinedAt } from "../utils/format-session-entry-joined-at";

export function LinkedSessionEntryRow({ entry }: { entry: AccountLinkedSessionEntry }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/40 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{entry.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatSessionEntryJoinedAt(entry.createdAt)}
        </p>
      </div>
    </div>
  );
}
