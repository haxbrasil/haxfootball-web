import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { PublicLiveRoom } from "#/lib/rooms/public-room";
import { getRoomLiveFn } from "#/server/api/functions";

const refreshIntervalMs = 5_000;

export function useLiveRoom(roomId: string, initialLive: PublicLiveRoom | null) {
  const getLiveRoom = useServerFn(getRoomLiveFn);
  const [live, setLive] = useState(initialLive);
  const [observedAt, setObservedAt] = useState(() => Date.now());

  useEffect(() => {
    setLive(initialLive);
    setObservedAt(Date.now());
  }, [initialLive, roomId]);

  useEffect(() => {
    let active = true;
    let refreshing = false;

    async function refresh() {
      if (!active || refreshing || document.visibilityState === "hidden") {
        return;
      }

      refreshing = true;

      try {
        const result = await getLiveRoom({ data: { id: roomId } });

        if (!active) {
          return;
        }

        if (result.status === "ok") {
          setLive(result.live);
        } else if (result.status === "room-unavailable") {
          setLive(null);
        }
      } catch {
        // Preserve the last valid snapshot during transient network failures.
      } finally {
        if (active) {
          setObservedAt(Date.now());
        }
        refreshing = false;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }

    const intervalId = window.setInterval(() => void refresh(), refreshIntervalMs);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [getLiveRoom, roomId]);

  return { live, observedAt };
}
