import { UsersRound } from "lucide-react";
import { DataCard } from "#/components/ds/app-shell";
import type { ListAccountLinkedSessionEntriesResponse } from "#/server/api/haxfootball";
import { AccountLinkedSessionEntriesDialog } from "./account-linked-session-entries-dialog";
import { LinkedSessionEntryRow } from "./linked-session-entry-row";

const previewLimit = 3;

export function AccountLinkedSessionEntriesPanel({
  sessionEntries,
}: {
  sessionEntries: ListAccountLinkedSessionEntriesResponse | null;
}) {
  const previewEntries = sessionEntries?.items.slice(0, previewLimit) ?? [];
  const hasEntries = previewEntries.length > 0;
  const countLabel = sessionEntries
    ? `${sessionEntries.items.length}${sessionEntries.page.nextCursor ? "+" : ""}`
    : "0";

  return (
    <DataCard
      title="Entradas vinculadas"
      meta={<span className="text-xs text-muted-foreground">{countLabel}</span>}
      className="h-full"
    >
      {hasEntries ? (
        <div className="space-y-3">
          <div className="grid gap-3">
            {previewEntries.map((entry) => (
              <LinkedSessionEntryRow key={entry.id} entry={entry} />
            ))}
          </div>

          {sessionEntries ? (
            <AccountLinkedSessionEntriesDialog initialSessionEntries={sessionEntries} />
          ) : null}
        </div>
      ) : (
        <div className="flex gap-3 text-sm">
          <UsersRound className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Nenhuma entrada vinculada</p>
            <p className="mt-1 text-muted-foreground">
              As entradas associadas à sua conta aparecerão aqui.
            </p>
          </div>
        </div>
      )}
    </DataCard>
  );
}
