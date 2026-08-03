import { useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { WebClip, WebListClipsResponse } from "#/server/api/haxfootball";
import { useInfinitePage } from "#/hooks/use-infinite-page";
import { listClipsFn } from "#/server/api/functions";

export function useClipsList(initialClips: WebListClipsResponse) {
  const listClips = useServerFn(listClipsFn);
  const limit = initialClips.page.limit;

  const loadPage = useCallback(
    (cursor: string) => listClips({ data: { cursor, limit } }),
    [limit, listClips],
  );

  return useInfinitePage<WebClip, WebListClipsResponse>({
    initialPage: initialClips,
    loadPage,
    resetKey: "clips",
  });
}
