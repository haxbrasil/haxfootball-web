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
  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" onClick={() => onOpenDetails(room.id)}>
        Detalhes
      </Button>
      {room.state !== "closed" ? (
        <Button
          size="sm"
          variant="destructive"
          disabled={isClosing}
          onClick={() => onClose(room.id)}
        >
          <Power className="size-4" />
          Fechar
        </Button>
      ) : null}
    </div>
  );
}
