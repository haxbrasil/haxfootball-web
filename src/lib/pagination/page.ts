export type PageInfo = {
  limit: number;
  nextCursor: string | null;
};

export type PaginatedPage<TItem> = {
  items: TItem[];
  page: PageInfo;
};

export type PaginationQuery = {
  cursor?: string;
  limit?: number;
};

export const defaultPageLimit = 25;

export function emptyPage<TItem>(limit = defaultPageLimit): PaginatedPage<TItem> {
  return {
    items: [],
    page: {
      limit,
      nextCursor: null,
    },
  };
}
