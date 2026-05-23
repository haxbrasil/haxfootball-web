import { LoaderCircle } from "lucide-react";
import { ActionButton } from "#/components/ds/action-button";
import { cn } from "#/lib/utils";
import { useInfiniteScrollTrigger } from "#/hooks/use-infinite-scroll-trigger";

export function InfiniteListBoundary({
  hasMore,
  isLoading,
  itemCount,
  onLoadMore,
  className,
}: {
  hasMore: boolean;
  isLoading: boolean;
  itemCount: number;
  onLoadMore: () => void;
  className?: string;
}) {
  const sentinelRef = useInfiniteScrollTrigger({
    enabled: hasMore && !isLoading,
    onLoadMore,
  });

  if (!hasMore && itemCount === 0) {
    return null;
  }

  return (
    <div className={cn("mt-4 flex flex-col items-center gap-3", className)}>
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />

      {hasMore ? (
        <ActionButton
          type="button"
          tone="quiet"
          disabled={isLoading}
          onClick={onLoadMore}
          aria-label="Carregar mais itens"
        >
          {isLoading ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {isLoading ? "Carregando..." : "Carregar mais"}
        </ActionButton>
      ) : (
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Fim da lista
        </p>
      )}
    </div>
  );
}
