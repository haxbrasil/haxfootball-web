import { useState } from "react";
import { History } from "lucide-react";
import { InfiniteListBoundary } from "#/components/ds/infinite-list";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import type { ListRoomsResponse } from "#/server/api/haxfootball";
import { useAdminRoomHistory } from "../hooks/use-admin-room-history";
import { AdminRoomsTableContent } from "./admin-rooms-table-content";

export function RoomHistoryDialog({ rooms }: { rooms: ListRoomsResponse }) {
  const [open, setOpen] = useState(false);
  const history = useAdminRoomHistory(rooms);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <History className="size-4" />
        Histórico
      </Button>
      <DialogContent className="grid max-h-[90vh] grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Histórico de salas</DialogTitle>
          <DialogDescription>Salas abertas, fechadas e com falha.</DialogDescription>
        </DialogHeader>

        <div className="bfl-scrollbar min-h-0 overflow-auto pr-1">
          <AdminRoomsTableContent rooms={history.items} />

          <InfiniteListBoundary
            hasMore={history.hasMore}
            isLoading={history.isLoadingMore}
            itemCount={history.items.length}
            onLoadMore={history.loadMore}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
