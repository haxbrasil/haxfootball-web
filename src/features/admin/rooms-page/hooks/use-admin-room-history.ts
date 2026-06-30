import { useCallback } from "react";
import type { Room } from "@haxbrasil/haxfootball-api-sdk";
import { useInfinitePage } from "#/hooks/use-infinite-page";
import type { ListRoomsResponse } from "#/server/api/haxfootball";

export function useAdminRoomHistory(initialRooms: ListRoomsResponse) {
  const limit = initialRooms.page.limit;

  const loadPage = useCallback(
    async (cursor: string) => {
      const { listAdminRoomHistoryFn } = await import("#/server/api/admin-room-functions");

      return listAdminRoomHistoryFn({ data: { cursor, limit } });
    },
    [limit],
  );

  return useInfinitePage<Room, ListRoomsResponse>({
    initialPage: initialRooms,
    loadPage,
    resetKey: "admin-room-history",
  });
}
