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
import type { ListMatchesResponse } from "#/server/api/haxfootball";
import { useAccountMatchesList } from "../hooks/use-account-matches-list";
import { AccountMatchRow } from "./account-match-row";

export function AccountMatchesDialog({ initialMatches }: { initialMatches: ListMatchesResponse }) {
  const list = useAccountMatchesList(initialMatches);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          Ver todas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(760px,calc(100vh-2rem))] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Partidas</DialogTitle>
          <DialogDescription>Partidas associadas às suas entradas.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[540px] overflow-y-auto pr-1">
          <div className="grid gap-3">
            {list.items.map((match) => (
              <AccountMatchRow key={match.id} match={match} />
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
