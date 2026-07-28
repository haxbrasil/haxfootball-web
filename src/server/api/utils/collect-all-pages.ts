export type CursorPage<T> = {
  items: T[];
  page: {
    limit: number;
    nextCursor: string | null;
  };
};

export async function collectAllPages<T>(
  loadPage: (query: { cursor?: string; limit: number }) => Promise<CursorPage<T> | null>,
  limit = 100,
): Promise<CursorPage<T> | null> {
  const items: T[] = [];
  let cursor: string | undefined;

  do {
    const page = await loadPage({ cursor, limit });

    if (!page) {
      return null;
    }

    items.push(...page.items);
    cursor = page.page.nextCursor ?? undefined;
  } while (cursor);

  return {
    items,
    page: {
      limit,
      nextCursor: null,
    },
  };
}
