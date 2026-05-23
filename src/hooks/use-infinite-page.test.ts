import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useInfinitePage } from "#/hooks/use-infinite-page";
import type { PaginatedPage } from "#/lib/pagination/page";

function page(items: string[], nextCursor: string | null): PaginatedPage<string> {
  return {
    items,
    page: {
      limit: 2,
      nextCursor,
    },
  };
}

describe("useInfinitePage", () => {
  it("appends the next page from the current cursor", async () => {
    const initialPage = page(["a", "b"], "next");

    const { result } = renderHook(() =>
      useInfinitePage({
        initialPage,
        loadPage: async (cursor) => page([cursor, "d"], null),
      }),
    );

    await act(() => result.current.loadMore());

    expect(result.current.items).toEqual(["a", "b", "next", "d"]);
    expect(result.current.hasMore).toBe(false);
  });

  it("resets when the reset key changes", () => {
    const firstPage = page(["a"], "next");
    const secondPage = page(["z"], null);

    const { result, rerender } = renderHook(
      ({ resetKey }) =>
        useInfinitePage({
          initialPage: resetKey === "one" ? firstPage : secondPage,
          loadPage: async () => page(["b"], null),
          resetKey,
        }),
      { initialProps: { resetKey: "one" } },
    );

    rerender({ resetKey: "two" });

    expect(result.current.items).toEqual(["z"]);
    expect(result.current.hasMore).toBe(false);
  });
});
