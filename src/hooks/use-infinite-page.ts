import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PaginatedPage } from "#/lib/pagination/page";

export type InfinitePageStatus = "idle" | "loading" | "error";

export function useInfinitePage<TItem, TPage extends PaginatedPage<TItem>>({
  initialPage,
  loadPage,
  resetKey,
}: {
  initialPage: TPage | null;
  loadPage: (cursor: string) => Promise<TPage>;
  resetKey?: string;
}) {
  const [pages, setPages] = useState<TPage[]>(() => (initialPage ? [initialPage] : []));
  const [status, setStatus] = useState<InfinitePageStatus>("idle");
  const [error, setError] = useState<unknown>(null);
  const loadingCursorRef = useRef<string | null>(null);

  useEffect(() => {
    setPages(initialPage ? [initialPage] : []);
    setStatus("idle");
    setError(null);
    loadingCursorRef.current = null;
  }, [initialPage, resetKey]);

  const lastPage = pages.at(-1) ?? initialPage;
  const nextCursor = lastPage?.page.nextCursor ?? null;
  const hasMore = nextCursor !== null;

  const items = useMemo(() => pages.flatMap((page) => page.items), [pages]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingCursorRef.current === nextCursor) {
      return;
    }

    loadingCursorRef.current = nextCursor;
    setStatus("loading");
    setError(null);

    try {
      const nextPage = await loadPage(nextCursor);

      setPages((currentPages) => [...currentPages, nextPage]);
      setStatus("idle");
    } catch (caughtError) {
      setError(caughtError);
      setStatus("error");
    } finally {
      loadingCursorRef.current = null;
    }
  }, [loadPage, nextCursor]);

  return {
    error,
    hasMore,
    isLoadingMore: status === "loading",
    items,
    loadMore,
    pages,
    status,
  };
}
