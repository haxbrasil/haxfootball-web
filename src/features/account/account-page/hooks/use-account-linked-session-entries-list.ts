import { useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useInfinitePage } from "#/hooks/use-infinite-page";
import { listAccountLinkedSessionEntriesFn } from "#/server/api/functions";
import type {
  AccountLinkedSessionEntry,
  ListAccountLinkedSessionEntriesResponse,
} from "#/server/api/haxfootball";

export function useAccountLinkedSessionEntriesList(
  initialSessionEntries: ListAccountLinkedSessionEntriesResponse,
) {
  const listAccountLinkedSessionEntries = useServerFn(listAccountLinkedSessionEntriesFn);
  const limit = initialSessionEntries.page.limit;

  const loadPage = useCallback(
    (cursor: string) => listAccountLinkedSessionEntries({ data: { cursor, limit } }),
    [limit, listAccountLinkedSessionEntries],
  );

  return useInfinitePage<AccountLinkedSessionEntry, ListAccountLinkedSessionEntriesResponse>({
    initialPage: initialSessionEntries,
    loadPage,
    resetKey: "account-linked-session-entries",
  });
}
