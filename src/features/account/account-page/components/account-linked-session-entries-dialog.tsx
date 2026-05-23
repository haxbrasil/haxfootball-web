import { InfiniteListBoundary } from "#/components/ds/infinite-list";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import type { ListAccountLinkedSessionEntriesResponse } from "#/server/api/haxfootball";
import { useAccountLinkedSessionEntriesList } from "../hooks/use-account-linked-session-entries-list";
import { LinkedSessionEntryRow } from "./linked-session-entry-row";

export function AccountLinkedSessionEntriesDialog({
  initialSessionEntries,
}: {
  initialSessionEntries: ListAccountLinkedSessionEntriesResponse;
}) {
  const list = useAccountLinkedSessionEntriesList(initialSessionEntries);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          Ver todos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(760px,calc(100vh-2rem))] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Entradas vinculadas</DialogTitle>
          <DialogDescription>Sessões de sala associadas à sua conta BFL.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[540px] overflow-y-auto pr-1">
          <div className="grid gap-3">
            {list.items.map((entry) => (
              <LinkedSessionEntryRow key={entry.id} entry={entry} />
            ))}
          </div>

          <InfiniteListBoundary
            hasMore={list.hasMore}
            isLoading={list.isLoadingMore}
            itemCount={list.items.length}
            onLoadMore={list.loadMore}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
