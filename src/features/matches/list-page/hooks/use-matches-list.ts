import { useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { ListMatchesResponse, MatchSummary } from "@haxbrasil/haxfootball-api-sdk";
import { useInfinitePage } from "#/hooks/use-infinite-page";
import { listMatchesFn } from "#/server/api/functions";

export function useMatchesList(initialMatches: ListMatchesResponse) {
  const listMatches = useServerFn(listMatchesFn);
  const limit = initialMatches.page.limit;

  const loadPage = useCallback(
    (cursor: string) => listMatches({ data: { cursor, limit } }),
    [limit, listMatches],
  );

  return useInfinitePage<MatchSummary, ListMatchesResponse>({
    initialPage: initialMatches,
    loadPage,
    resetKey: "matches",
  });
}
