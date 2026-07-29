import { describe, expect, it, vi } from "vitest";
import { collectAllPages, countAllPages, type CursorPage } from "./collect-all-pages";

describe("collectAllPages", () => {
  it("loads every cursor page into one result", async () => {
    const pages = new Map<string | undefined, CursorPage<number>>([
      [
        undefined,
        {
          items: Array.from({ length: 100 }, (_, index) => index + 1),
          page: { limit: 100, nextCursor: "page-2" },
        },
      ],
      [
        "page-2",
        {
          items: [101, 102],
          page: { limit: 100, nextCursor: null },
        },
      ],
    ]);
    const loadPage = vi.fn(
      async ({ cursor }: { cursor?: string; limit: number }) => pages.get(cursor) ?? null,
    );

    const result = await collectAllPages(loadPage);

    expect(result?.items).toHaveLength(102);
    expect(result?.items.at(-1)).toBe(102);
    expect(result?.page).toEqual({ limit: 100, nextCursor: null });
    expect(loadPage).toHaveBeenNthCalledWith(1, { cursor: undefined, limit: 100 });
    expect(loadPage).toHaveBeenNthCalledWith(2, { cursor: "page-2", limit: 100 });
  });

  it("returns null if any page cannot be loaded", async () => {
    const loadPage = vi
      .fn()
      .mockResolvedValueOnce({
        items: [1],
        page: { limit: 100, nextCursor: "page-2" },
      })
      .mockResolvedValueOnce(null);

    await expect(collectAllPages(loadPage)).resolves.toBeNull();
  });
});

describe("countAllPages", () => {
  it("counts items across every page without collecting them", async () => {
    const pages = new Map<string | undefined, CursorPage<number>>([
      [undefined, { items: [1, 2], page: { limit: 2, nextCursor: "next" } }],
      ["next", { items: [3], page: { limit: 2, nextCursor: null } }],
    ]);

    const result = await countAllPages(async ({ cursor }) => pages.get(cursor) ?? null, 2);

    expect(result).toBe(3);
  });

  it("returns null when a page cannot be loaded", async () => {
    await expect(countAllPages(async () => null)).resolves.toBeNull();
  });
});
