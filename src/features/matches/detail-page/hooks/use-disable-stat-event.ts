import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { disableMatchStatEventFn } from "#/server/api/functions";

export function useDisableStatEvent(matchId: string) {
  const router = useRouter();
  const disableEvent = useServerFn(disableMatchStatEventFn);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function disable(eventId: string) {
    setPendingId(eventId);
    await disableEvent({ data: { matchId, eventId } });
    setPendingId(null);
    await router.invalidate();
  }

  return { disable, pendingId };
}
