import { useState } from "react";
import { useRouter } from "@tanstack/react-router";

export function useCloseRoomAction() {
  const router = useRouter();
  const [closingId, setClosingId] = useState<string | null>(null);

  async function close(roomId: string) {
    setClosingId(roomId);
    const { closeRoomFn } = await import("#/server/api/admin-room-action-functions");

    await closeRoomFn({ data: { id: roomId } });
    setClosingId(null);
    await router.invalidate();
  }

  return { close, closingId };
}
