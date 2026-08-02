import { useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { Clip, ListClipsResponse } from "#/server/api/haxfootball";
import { useInfinitePage } from "#/hooks/use-infinite-page";
import { listClipsFn } from "#/server/api/functions";

export function useClipsList(initialClips: ListClipsResponse) {
  const listClips = useServerFn(listClipsFn);
  const limit = initialClips.page.limit;

  const loadPage = useCallback(
    (cursor: string) => listClips({ data: { cursor, limit } }),
    [limit, listClips],
  );

  return useInfinitePage<Clip, ListClipsResponse>({
    initialPage: initialClips,
    loadPage,
    resetKey: "clips",
  });
}
