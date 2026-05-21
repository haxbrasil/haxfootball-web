import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { closeRoomFn } from "#/server/api/functions";

export function useCloseRoomAction() {
  const router = useRouter();
  const closeRoom = useServerFn(closeRoomFn);
  const [closingId, setClosingId] = useState<string | null>(null);

  async function close(roomId: string) {
    setClosingId(roomId);
    await closeRoom({ data: { id: roomId } });
    setClosingId(null);
    await router.invalidate();
  }

  return { close, closingId };
}
