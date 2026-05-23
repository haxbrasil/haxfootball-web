import { useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useInfinitePage } from "#/hooks/use-infinite-page";
import { listAccountMatchesFn } from "#/server/api/functions";
import type { ListMatchesResponse } from "#/server/api/haxfootball";

export function useAccountMatchesList(initialMatches: ListMatchesResponse) {
  const listAccountMatches = useServerFn(listAccountMatchesFn);
  const limit = initialMatches.page.limit;

  const loadPage = useCallback(
    (cursor: string) => listAccountMatches({ data: { cursor, limit } }),
    [limit, listAccountMatches],
  );

  return useInfinitePage<ListMatchesResponse["items"][number], ListMatchesResponse>({
    initialPage: initialMatches,
    loadPage,
    resetKey: "account-matches",
  });
}
