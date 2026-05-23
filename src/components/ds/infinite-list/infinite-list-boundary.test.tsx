import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InfiniteListBoundary } from "#/components/ds/infinite-list";

describe("InfiniteListBoundary", () => {
  it("renders a manual load control when more items are available", () => {
    const loadMore = vi.fn();

    render(
      <InfiniteListBoundary hasMore={true} isLoading={false} itemCount={2} onLoadMore={loadMore} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Carregar mais itens" }));

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it("renders an end marker after the last page", () => {
    render(
      <InfiniteListBoundary
        hasMore={false}
        isLoading={false}
        itemCount={2}
        onLoadMore={() => undefined}
      />,
    );

    expect(screen.getByText("Fim da lista")).not.toBeNull();
  });
});
