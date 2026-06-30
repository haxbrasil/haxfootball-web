import type { Room } from "@haxbrasil/haxfootball-api-sdk";
import { Power } from "lucide-react";
import { Button } from "#/components/ui/button";

export function RoomActions({
  room,
  isClosing,
  onClose,
  onOpenDetails,
}: {
  room: Room;
  isClosing: boolean;
  onClose: (roomId: string) => void;
  onOpenDetails: (roomId: string) => void;
}) {
  const canClose = room.state !== "closed" && room.state !== "failed";

  function handleOpenDetails() {
    onOpenDetails(room.id);
  }

  function handleClose() {
    onClose(room.id);
  }

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" onClick={handleOpenDetails}>
        Detalhes
      </Button>
      {canClose ? (
        <Button size="sm" variant="destructive" disabled={isClosing} onClick={handleClose}>
          <Power className="size-4" />
          Fechar
        </Button>
      ) : null}
    </div>
  );
}
